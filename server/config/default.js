require('dotenv').config()

export const port = process.env.PORT || 3000;
export const mongoURI = process.env.MONGODB_URI;
export const mobileURL = process.env.MOBILE_URL;
export const jwtSecret = process.env.JWT_SECRET;
