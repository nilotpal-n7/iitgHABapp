const axios = require("axios");
const qs = require("querystring");
const appConfig = require("../../config/default.js");
const User = require("../user/userModel.js");
const { getUserFromToken } = require("../user/userModel.js"); // Assuming getUserFromToken is a named export

const clientid = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_VALUE;
const redirect_uri = process.env.REDIRECT_URI;

// Not used
const loginHandler = (req, res) => {
    res.redirect(
        `https://login.microsoftonline.com/850aa78d-94e1-4bc6-9cf3-8c11b530701c/oauth2/v2.0/authorize?client_id=${clientid}&response_type=code&redirect_uri=${redirect_uri}&scope=offline_access%20user.read&state=random-state&prompt=consent`
    );
};

const getDepartment = async (access_token) => {
    const config = {
        method: "get",
        url: "https://graph.microsoft.com/beta/me/profile",
        headers: {
            Authorization: `Bearer ${access_token}`,
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
            Host: "graph.microsoft.com",
        },
    };
    const response = await axios.get(config.url, {
        headers: config.headers,
    });
    return response.data.positions[0].detail.company.department;
};

// Function to calculate semester (if needed)

const mobileRedirectHandler = async (req, res, next) => {
    const { code } = req.query;

    const data = qs.stringify({
        client_secret: clientSecret,
        client_id: clientid,
        redirect_uri: "https://www.coursehubiitg.in/api/auth/login/redirect/mobile",
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

    if (!response.data) throw new AppError(500, "Something went wrong");

    const AccessToken = response.data.access_token;
    const RefreshToken = response.data.refresh_token;

    const userFromToken = await getUserFromToken(AccessToken);

    if (!userFromToken || !userFromToken.data) throw new AppError(401, "Access Denied");

    const roll = userFromToken.data.surname;
    if (!roll) throw new AppError(401, "Sign in using Institute Account");

    let existingUser = await findUserWithEmail(userFromToken.data.mail); // find with email

    if (!existingUser) {
        const department = await getDepartment(AccessToken);

        const userData = {
            name: userFromToken.data.displayName,
            degree: userFromToken.data.jobTitle,
            rollNumber: userFromToken.data.surname,
            email: userFromToken.data.mail,
            // branch: department, // calculate branch
            department: department,
        };

        const { error } = validateUser(userData);
        if (error) throw new AppError(500, error.message);

        const user = new User(userData);
        existingUser = await user.save();
    }

    const token = existingUser.generateJWT();

    // const encryptedToken = EncryptText(token);

    return res.redirect(`${appConfig.mobileURL}://success?token=${token}`);
};

const logoutHandler = (req, res, next) => {
    // res.clearCookie("token");
    res.cookie("token", "loggedout", {
        maxAge: 0,
        sameSite: "lax",
        secure: false,
        expires: new Date(Date.now()),
        httpOnly: true,
    });
    res.redirect(appConfig.clientURL);
};

// Exporting the handlers
module.exports = {
    loginHandler,
    mobileRedirectHandler,
    logoutHandler
};
