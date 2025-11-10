const axios = require("axios");
const qs = require("querystring");
const {
  getUserFromToken,
  User,
  findUserWithEmail,
} = require("../user/userModel.js"); // Assuming getUserFromToken is a named export
const AppError = require("../../utils/appError.js");
const UserAllocHostel = require("../hostel/hostelAllocModel.js");
const {
  sendNotificationToUser,
} = require("../notification/notificationController.js");
require("dotenv").config();

const appConfig = require("../../config/default.js");

const clientid = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const redirect_uri = process.env.REDIRECT_URI;

// Not used
const loginHandler = (req, res) => {
  res.redirect(
    `https://login.microsoftonline.com/850aa78d-94e1-4bc6-9cf3-8c11b530701c/oauth2/v2.0/authorize?client_id=${clientid}&response_type=code&redirect_uri=${redirect_uri}&scope=offline_access%20user.read&state=12345&prompt=consent`
  );
};

// Function to calculate semester (if needed)

//** */
const getHostelAlloc = async (rollno) => {
  try {
    const allocation = await UserAllocHostel.findOne({
      rollno: rollno,
    }).populate("hostel");
    if (!allocation || !allocation.hostel) {
      return null;
    }
    return allocation.hostel; // return populated Hostel document
  } catch (err) {
    console.log(err);
    return null;
  }
};

const mobileRedirectHandler = async (req, res, next) => {
  try {
    const { code } = req.query;

    if (!code) {
      throw new AppError(400, "Authorization code is missing");
    }

    const data = qs.stringify({
      client_secret: clientSecret,
      client_id: clientid,
      redirect_uri: redirect_uri,
      scope: "user.read",
      grant_type: "authorization_code",
      code: code,
    });

    const config = {
      method: "post",
      url: `https://login.microsoftonline.com/850aa78d-94e1-4bc6-9cf3-8c11b530701c/oauth2/v2.0/token`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        client_secret: clientSecret,
      },
      data: data,
    };

    // Make the Axios request
    const response = await axios.post(config.url, config.data, {
      headers: config.headers,
    });

    // Check if the response data exists
    if (!response.data) throw new AppError(500, "Something went wrong");

    const AccessToken = response.data.access_token;
    // console.log("access token ", AccessToken);
    const RefreshToken = response.data.refresh_token;
    // console.log("refresh token is: ", RefreshToken);

    // Get user information from token
    const userFromToken = await getUserFromToken(AccessToken);

    // Check if user data exists
    if (!userFromToken || !userFromToken.data)
      throw new AppError(401, "Access Denied");

    const roll = userFromToken.data.surname;
    if (!roll) throw new AppError(401, "Sign in using Institute Account");

    // Ensure hostel allocation exists for this roll number
    const allocatedHostel = await getHostelAlloc(roll);
    if (!allocatedHostel) {
      throw new AppError(
        401,
        "Hostel allocation not found for this roll number"
      );
    }

    // create an existing user instance with finduserwithemail
    let existingUser = await findUserWithEmail(userFromToken.data.mail);

    // If the user doesn't exist, create a new user
    let isFirstLogin = false;
    if (!existingUser) {
      const userData = {
        name: userFromToken.data.displayName,
        degree: userFromToken.data.jobTitle,
        rollNumber: userFromToken.data.surname,
        email: userFromToken.data.mail,
        hostel: allocatedHostel._id,
      };

      //console.log(userData);

      const user = new User(userData);
      //console.log( "user model is",user);
      existingUser = await user.save();
      isFirstLogin = true;
    } else {
      // Optionally ensure user's hostel matches allocated hostel
      try {
        const needsUpdate =
          !existingUser.hostel ||
          existingUser.hostel.toString() !== allocatedHostel._id.toString();
        if (needsUpdate) {
          existingUser.hostel = allocatedHostel._id;
          existingUser.curr_subscribed_mess = allocatedHostel._id;
          await existingUser.save();
        }
      } catch (e) {
        console.log("Error while syncing user hostel with allocation", e);
      }
    }

    // Generate JWT for the existing or new user
    const token = existingUser.generateJWT();
    //console.log(token);

    // Send welcome notification on first login
    if (isFirstLogin) {
      try {
        await sendNotificationToUser(
          existingUser._id,
          "Welcome to HAB App",
          "Thanks for signing in! You will receive updates here."
        );
      } catch (e) {
        console.log("Failed to send welcome notification", e);
      }
    }

    // Redirect to the success URL with the token
    return res.redirect(
      `iitgcomplain://success?token=${token}&user=${existingUser}`
    );
  } catch (error) {
    console.error("Error in mobileRedirectHandler:", error); // Log the error to the console
    // Use next to pass the error to the error handling middleware
    next(error); // Pass the error to the next middleware for centralized error handling
  }
};

const logoutHandler = (req, res, next) => {
  // res.clearCookie("token");
  res.cookie("token", "loggedout", {
    maxAge: 0,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: false,
    path: "/",
    expires: new Date(Date.now()),
    httpOnly: true,
  });
  res.redirect(appConfig.clientURL);
};

// Unified web login handler for HAB, Hostel, and SMC
const webLoginHandler = async (req, res, next) => {
  try {
    const { code, type, state } = req.query;

    if (!code) {
      return next(new AppError(400, "Authorization code is missing"));
    }

    // Use state parameter from OAuth callback if type is not provided
    const loginType = type || state;

    if (!loginType || !["hab", "hostel", "smc"].includes(loginType)) {
      return next(
        new AppError(
          400,
          "Invalid login type. Must be 'hab', 'hostel', or 'smc'"
        )
      );
    }

    // Get redirect URI based on type
    const webRedirectUri = process.env.WEB_REDIRECT_URI || redirect_uri;

    const data = qs.stringify({
      client_secret: clientSecret,
      client_id: clientid,
      redirect_uri: webRedirectUri,
      scope: "user.read",
      grant_type: "authorization_code",
      code: code,
    });

    const config = {
      method: "post",
      url: `https://login.microsoftonline.com/850aa78d-94e1-4bc6-9cf3-8c11b530701c/oauth2/v2.0/token`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        client_secret: clientSecret,
      },
      data: data,
    };

    const response = await axios.post(config.url, config.data, {
      headers: config.headers,
    });

    if (!response.data) {
      return next(new AppError(500, "Something went wrong"));
    }

    const AccessToken = response.data.access_token;
    const userFromToken = await getUserFromToken(AccessToken);

    if (!userFromToken || !userFromToken.data) {
      return next(new AppError(401, "Access Denied"));
    }

    const email = userFromToken.data.mail;
    if (!email) {
      return next(new AppError(401, "Email not found in token"));
    }

    let token;
    let redirectPath;

    // Handle different login types
    if (loginType === "hab") {
      // HAB login: Check against hardcoded email
      const HAB_EMAIL = process.env.HAB_EMAIL;
      if (!HAB_EMAIL) {
        return next(new AppError(500, "HAB email not configured"));
      }

      if (email.toLowerCase() !== HAB_EMAIL.toLowerCase()) {
        return next(new AppError(403, "Unauthorized: Not a HAB admin email"));
      }

      // Generate token for HAB admin
      const { adminjwtsecret } = require("../../config/default.js");
      const jwt = require("jsonwebtoken");
      token = jwt.sign({ hab: true, email: email }, adminjwtsecret, {
        expiresIn: "2h",
      });
      redirectPath = "/dashboard";
    } else if (loginType === "hostel") {
      // Hostel login: Find hostel by microsoft_email
      const { Hostel } = require("../hostel/hostelModel.js");
      const hostel = await Hostel.findOne({ microsoft_email: email }).populate(
        "messId"
      );

      if (!hostel) {
        return next(
          new AppError(403, "Unauthorized: No hostel found for this email")
        );
      }

      token = hostel.generateJWT();
      redirectPath = "/hostel/dashboard";
    } else if (loginType === "smc") {
      // SMC login: Check if user is SMC
      const existingUser = await findUserWithEmail(email);
      if (!existingUser) {
        return next(new AppError(401, "User not found"));
      }

      if (!existingUser.isSMC) {
        return next(
          new AppError(403, "Unauthorized: User is not an SMC member")
        );
      }

      token = existingUser.generateJWT();
      redirectPath = "/smc/dashboard";
    }

    // Set token in cookie. We will NOT include the token in the query string
    // to avoid leaking it via referer or browser history. Frontends should
    // validate session using /api/auth/me which reads the httpOnly cookie.
    // Set cookie for the entire site so subsequent /api/auth/me calls can read it
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      // For production (cross-site) we need SameSite=None and Secure; in dev use Lax
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
      maxAge: 2 * 60 * 60 * 1000, // 2 hours
    });

    // Redirect to the appropriate portal based on login type (no token in URL)
    let baseUrl;
    if (loginType === "hab") {
      baseUrl = process.env.HAB_FRONTEND_URL;
    } else if (loginType === "hostel") {
      baseUrl = process.env.HOSTEL_FRONTEND_URL;
    } else if (loginType === "smc") {
      baseUrl = process.env.SMC_FRONTEND_URL;
    } else {
      return next(new AppError(400, "Invalid login type"));
    }

    // In development include token in the redirect query for easier local testing
    // (local dev often runs on different ports and cannot use Secure SameSite=None cookies)
    if (process.env.NODE_ENV !== "production") {
      return res.redirect(
        `${baseUrl}${redirectPath}?token=${encodeURIComponent(token)}`
      );
    }

    return res.redirect(`${baseUrl}${redirectPath}`);
  } catch (err) {
    const loginType = req.query.type || req.query.state || "unknown";
    console.error(`Error in web login (${loginType}):`, err);
    if (err.response?.status === 400) {
      return res.status(400).json({ message: "Invalid authorization code" });
    }
    return next(new AppError(500, `Error occurred during ${loginType} login`));
  }
};

// Return authenticated principal based on token in cookie or Authorization header
const meHandler = async (req, res, next) => {
  try {
    // token can be in cookie or authorization header (Bearer)
    let token = req.cookies?.token;
    if (!token && req.headers?.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith("Bearer ")) token = authHeader.split(" ")[1];
    }

    if (!token) {
      console.log(
        "meHandler: no token provided in cookie or Authorization header"
      );
      return res.status(401).json({ authenticated: false });
    }

    // Try as normal User
    try {
      const user = await User.findByJWT(token);
      if (user) {
        console.log("meHandler: authenticated as user", user._id);
        return res
          .status(200)
          .json({ authenticated: true, type: "user", user });
      }
    } catch (e) {
      // ignore and try other types
    }

    // Try as Hostel (admin-like token for hostel)
    try {
      const { Hostel } = require("../hostel/hostelModel.js");
      const hostel = await Hostel.findByJWT(token);
      if (hostel) {
        return res
          .status(200)
          .json({ authenticated: true, type: "hostel", hostel });
      }
    } catch (e) {
      // ignore and try admin token
    }

    // Try admin HAB token (signed with adminjwtsecret)
    try {
      const { adminjwtsecret } = require("../../config/default.js");
      const jwt = require("jsonwebtoken");
      const decoded = jwt.verify(token, adminjwtsecret);
      if (decoded && decoded.hab) {
        return res
          .status(200)
          .json({ authenticated: true, type: "hab", email: decoded.email });
      }
    } catch (e) {
      // fall through
    }

    return res.status(401).json({ authenticated: false });
  } catch (err) {
    console.error("Error in meHandler:", err);
    return next(new AppError(500, "Server error while validating session"));
  }
};

// Exporting the handlers
// Guest login handler - compares posted credentials with env vars and returns JWT
const guestLoginHandler = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const GUEST_EMAIL = process.env.GUEST_EMAIL;
    const GUEST_PASSWORD = process.env.GUEST_EMAIL_PASSWORD;

    if (!GUEST_EMAIL || !GUEST_PASSWORD) {
      return next(
        new AppError(500, "Guest credentials not configured on server")
      );
    }

    if (
      email.toLowerCase() !== GUEST_EMAIL.toLowerCase() ||
      password !== GUEST_PASSWORD
    ) {
      return res.status(401).json({ message: "Invalid guest credentials" });
    }

    // Find the guest user in DB
    let existingUser = await findUserWithEmail(email);
    if (!existingUser) {
      // Create a guest user using the roll number and allocate hostel similar to normal auth
      const GUEST_ROLL = process.env.GUEST_ROLL;

      // Try to fetch allocation by roll (mirrors mobileRedirectHandler)
      let allocatedHostel = null;
      if (GUEST_ROLL) {
        try {
          allocatedHostel = await getHostelAlloc(GUEST_ROLL);
        } catch (e) {
          console.error("Error fetching hostel allocation for guest roll:", e);
        }
      }

      const userData = {
        name: process.env.GUEST_NAME || "Guest User",
        degree: "BTech",
        rollNumber: GUEST_ROLL,
        email: email,
      };

      if (allocatedHostel) {
        userData.hostel = allocatedHostel._id;
        userData.curr_subscribed_mess = allocatedHostel._id;
      } else {
        return next(new AppError(500, "Guest hostel allocation not found"));
      }

      try {
        const user = new User(userData);
        existingUser = await user.save();
        // send welcome notification (best-effort)
        try {
          await sendNotificationToUser(
            existingUser._id,
            "Welcome to HAB App",
            "Thanks for signing in! You will receive updates here."
          );
        } catch (e) {
          console.log("Failed to send welcome notification to guest:", e);
        }
      } catch (e) {
        console.error("Failed to create guest user:", e);
        return next(new AppError(500, "Failed to create guest user"));
      }
    }

    const token = existingUser.generateJWT();
    return res.status(200).json({ token });
  } catch (err) {
    console.error("Error in guestLoginHandler:", err);
    return next(new AppError(500, "Error during guest login"));
  }
};

// Exporting the handlers
module.exports = {
  loginHandler,
  mobileRedirectHandler,
  logoutHandler,
  guestLoginHandler,
  webLoginHandler,
  meHandler,
};
