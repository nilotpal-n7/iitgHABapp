const mongoose = require('mongoose');
const jwt = require("jsonwebtoken")
const dotenv = require("dotenv")

dotenv.config()

const JWT_SECRET_KEY = process.env.JWT_SECRET || "40814aa2964e4ca60ad6a0f019be83019bd54730ee3f5020b02aed8fcff1f354";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        year: {
            type: Number
        },
        hostel: {
            type:  String
        },
        outlookID: {
            type: String,
            required: true
        },
        role: {
            type: String,
            enum: ['student', 'hab', 'welfare_secy', 'gen_secy'], // may add more roles
            required: true
        },
        complaints: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Complaint'
        }],
        phoneNumber: {
            type: String
        },
        rooomNumber: {
            type: String
        },
        rollNumber: {
            type: String
        }

    }
);

userSchema.methods.generateJWT = function () {
    var user = this;
    var token = jwt.sign({ user: user._id }, JWT_SECRET_KEY, {
        expiresIn: "24d"
    });
    return token;
};

userSchema.statics.findByJWT = async function (token) {
    try {
        var user = this;
        var decoded = jwt.verify(token, JWT_SECRET_KEY);
        const id = decoded.user;
        const fetchedUser = user.findOne({_id: id});
        if (!fetchedUser) return false;
        return fetchedUser;

    } catch(error) {
        return false;
    }
};

const User = mongoose.model('User', userSchema);

module.exports = User;