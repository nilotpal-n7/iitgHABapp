const {User} = require("../modules/user/userModel.js");
const AppError = require('../utils/appError.js');

const authenticateJWT = async function (req, res, next) {
    let token = req.cookies?.token;

    // Check for token in headers if not in cookies
    if (!token && req.headers?.authorization) {
        const authHeader = req.headers.authorization;
        if (authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else {
            console.log('Authorization header format is invalid');
        }
    }
    // Log the source of the tokenN
    if (token) {
        console.log('Token received from client:', token);
    } else {
        console.log('No token provided by the client');
    }

    // If token is missing, send error response
    if (!token) return next(new AppError(403, "Invalid token"));

    try {
        // Validate the token and get user
        const user = await User.findByJWT(token);
        if (!user) return next(new AppError(403, "Not Authenticated"));

        // Attach the user to the request object
        req.user = user;
        return next();
    } catch (err) {
        console.error('Error verifying token:', err);
        return next(new AppError(500, "Server error during authentication"));
    }
};

module.exports = authenticateJWT;
