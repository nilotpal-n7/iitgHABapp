const User = require("../modules/user/userModel.js");
const AppError = require('../utils/appError.js');

const authenticateJWT = async function (req, res, next) {
    let token = req.cookies.token;
    if (!token) token = req.headers?.authorization?.split(" ")[1];
    if (!token) return next(new AppError(403, "Invalid token"));
    console.log(token);
    const user = await User.findByJWT(token);
    if (!user) return next(new AppError(403, "Not Authenticated"));
    req.user = user;
    return next();
};

module.exports = authenticateJWT;