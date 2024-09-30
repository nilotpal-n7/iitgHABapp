require("dotenv/config");

module.exports = {
    port: process.env.PORT || 3000,
    mongoURI: process.env.MONGODB_URI,
    // don't know about mobileURL and clientURL so omitting this also
    jwtSecret: process.env.JWT_SECRET,
    // aeskey unknown here so omitting
    // adminjwtsecret unknown so omitting
};
