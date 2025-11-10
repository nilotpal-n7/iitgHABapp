// server/modules/auth/authController.js
const axios = require("axios");
const qs = require("querystring");
const jwt = require("jsonwebtoken");
const AppError = require("../../utils/appError.js");
const {
  getUserFromToken,
  User,
  findUserWithEmail,
} = require("../user/userModel.js");
const UserAllocHostel = require("../hostel/hostelAllocModel.js");
const {
  sendNotificationToUser,
} = require("../notification/notificationController.js");
require("dotenv").config();
const appConfig = require("../../config/default.js");

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const redirectUri = process.env.REDIRECT_URI;

// Helper — find hostel allocation by roll number
const getHostelAlloc = async (rollno) => {
  try {
    const allocation = await UserAllocHostel.findOne({ rollno }).populate(
      "hostel"
    );
    return allocation?.hostel || null;
  } catch (err) {
    console.error("Error fetching hostel allocation:", err);
    return null;
  }
};

// Mobile redirect (used by app deep link)
const mobileRedirectHandler = async (req, res, next) => {
  try {
    const { code } = req.query;
    if (!code) throw new AppError(400, "Authorization code is missing");

    const data = qs.stringify({
      client_secret: clientSecret,
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: "user.read",
      grant_type: "authorization_code",
      code: code,
    });

    const tokenResp = await axios.post(
      `https://login.microsoftonline.com/850aa78d-94e1-4bc6-9cf3-8c11b530701c/oauth2/v2.0/token`,
      data,
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const accessToken = tokenResp.data.access_token;
    const userFromToken = await getUserFromToken(accessToken);
    if (!userFromToken?.data) throw new AppError(401, "Access denied");

    const roll = userFromToken.data.surname;
    if (!roll) throw new AppError(401, "Sign in using Institute Account");

    const allocatedHostel = await getHostelAlloc(roll);
    if (!allocatedHostel)
      throw new AppError(
        401,
        "Hostel allocation not found for this roll number"
      );

    let existingUser = await findUserWithEmail(userFromToken.data.mail);
    let isFirstLogin = false;

    if (!existingUser) {
      const user = new User({
        name: userFromToken.data.displayName,
        degree: userFromToken.data.jobTitle,
        rollNumber: roll,
        email: userFromToken.data.mail,
        hostel: allocatedHostel._id,
      });
      existingUser = await user.save();
      isFirstLogin = true;
    }

    const token = existingUser.generateJWT();

    if (isFirstLogin) {
      try {
        await sendNotificationToUser(
          existingUser._id,
          "Welcome to HAB App",
          "Thanks for signing in! You will receive updates here."
        );
      } catch (e) {
        console.warn("Failed to send welcome notification", e);
      }
    }

    return res.redirect(
      `iitgcomplain://success?token=${token}&user=${encodeURIComponent(
        existingUser.email
      )}`
    );
  } catch (error) {
    console.error("Error in mobileRedirectHandler:", error);
    next(error);
  }
};

// Logout
const logoutHandler = (req, res) => {
  res.status(200).json({ message: "Logged out" });
};

// Unified web login handler — HAB / Hostel / SMC
const webLoginHandler = async (req, res, next) => {
  try {
    const { code, type, state } = req.query;
    if (!code) throw new AppError(400, "Authorization code missing");

    const loginType = type || state;
    if (!["hab", "hostel", "smc"].includes(loginType))
      throw new AppError(400, "Invalid login type");

    const webRedirectUri = process.env.WEB_REDIRECT_URI || redirectUri;

    const data = qs.stringify({
      client_secret: clientSecret,
      client_id: clientId,
      redirect_uri: webRedirectUri,
      scope: "user.read",
      grant_type: "authorization_code",
      code,
    });

    const tokenResp = await axios.post(
      `https://login.microsoftonline.com/850aa78d-94e1-4bc6-9cf3-8c11b530701c/oauth2/v2.0/token`,
      data,
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const accessToken = tokenResp.data.access_token;
    const userFromToken = await getUserFromToken(accessToken);
    const email = userFromToken?.data?.mail;
    if (!email) throw new AppError(401, "Invalid Microsoft login");

    let token;
    let redirectPath = "/";
    let baseUrl;

    if (loginType === "hab") {
      const HAB_EMAIL = process.env.HAB_EMAIL;
      if (email.toLowerCase() !== HAB_EMAIL.toLowerCase())
        throw new AppError(403, "Unauthorized HAB login");
      token = jwt.sign({ hab: true, email }, process.env.ADMIN_JWT_SECRET, {
        expiresIn: "2h",
      });
      baseUrl = process.env.HAB_FRONTEND_URL;
    }

    if (loginType === "hostel") {
      const { Hostel } = require("../hostel/hostelModel.js");
      const hostel = await Hostel.findOne({ microsoft_email: email });
      if (!hostel) throw new AppError(403, "No hostel found for this email");
      token = hostel.generateJWT();
      baseUrl = process.env.HOSTEL_FRONTEND_URL;
      redirectPath = "/dashboard";
    }

    if (loginType === "smc") {
      const existingUser = await findUserWithEmail(email);
      if (!existingUser || !existingUser.isSMC)
        throw new AppError(403, "Unauthorized SMC login");
      token = existingUser.generateJWT();
      baseUrl = process.env.SMC_FRONTEND_URL;
      redirectPath = "/dashboard";
    }

    // ✅ Always send token in URL
    return res.redirect(
      `${baseUrl}${redirectPath}?token=${encodeURIComponent(token)}`
    );
  } catch (err) {
    console.error("Error in webLoginHandler:", err);
    next(new AppError(500, "Login failed"));
  }
};

// Validate token from Authorization header
const meHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ authenticated: false });
    }

    const token = authHeader.split(" ")[1];

    // Try user
    try {
      const user = await User.findByJWT(token);
      if (user)
        return res
          .status(200)
          .json({ authenticated: true, type: "user", user });
    } catch {}

    // Try hostel
    try {
      const { Hostel } = require("../hostel/hostelModel.js");
      const hostel = await Hostel.findByJWT(token);
      if (hostel)
        return res
          .status(200)
          .json({ authenticated: true, type: "hostel", hostel });
    } catch {}

    // Try HAB admin
    try {
      const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
      if (decoded?.hab)
        return res
          .status(200)
          .json({ authenticated: true, type: "hab", email: decoded.email });
    } catch {}

    return res.status(401).json({ authenticated: false });
  } catch (err) {
    console.error("Error in meHandler:", err);
    return next(new AppError(500, "Error validating token"));
  }
};

// Guest login
const guestLoginHandler = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    if (
      email.toLowerCase() !== process.env.GUEST_EMAIL.toLowerCase() ||
      password !== process.env.GUEST_EMAIL_PASSWORD
    ) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    let existingUser = await findUserWithEmail(email);
    if (!existingUser) {
      const GUEST_ROLL = process.env.GUEST_ROLL;
      const allocatedHostel = await getHostelAlloc(GUEST_ROLL);

      const user = new User({
        name: "Guest User",
        degree: "BTech",
        rollNumber: GUEST_ROLL,
        email,
        hostel: allocatedHostel?._id,
      });
      existingUser = await user.save();
    }

    const token = existingUser.generateJWT();
    return res.status(200).json({ token });
  } catch (err) {
    console.error("Error in guestLoginHandler:", err);
    next(new AppError(500, "Guest login failed"));
  }
};

module.exports = {
  mobileRedirectHandler,
  webLoginHandler,
  meHandler,
  logoutHandler,
  guestLoginHandler,
};
