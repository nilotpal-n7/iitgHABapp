require("dotenv").config();

module.exports = {
<<<<<<< HEAD
    port: process.env.PORT || 3000,
    mongoURI: process.env.MONGODB_URI,
    mobileURL: process.env.MOBILE_URL,
    // don't know about  clientURL so omitting this also
    jwtSecret: process.env.JWT_SECRET,
    // aeskey unknown here so omitting
    adminjwtsecret: process.env.ADMIN_JWT_SECRET,
};
=======
  port: process.env.PORT || 3000,
  mongoURI: process.env.MONGODB_URI,
  mobileURL: process.env.MOBILE_URL,
  // don't know about  clientURL so omitting this also
  jwtSecret: process.env.JWT_SECRET,
  // aeskey unknown here so omitting
  adminjwtsecret: process.env.ADMIN_JWT_SECRET,
};
>>>>>>> 01a3e615c63fef5c50d01c60cb5624d57ac6dca8
