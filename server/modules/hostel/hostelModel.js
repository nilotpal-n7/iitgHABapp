//const axios =require("axios");
const mongoose = require('mongoose');
//const jwt = require("jsonwebtoken")
const dotenv = require("dotenv")

dotenv.config();

const userTimeStampSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }, 
        // timestamp: {
        //     type: Date,
        //     default: Date.now
        // },
        reason_for_change: {
            type: String,
            default: ""
        }
    }
);

const hostelSchema = new mongoose.Schema(
    {
        hostel_name: {
            type: String,
            required: true
        },
        
        users: {
            type: [userTimeStampSchema],
            default: [],
            required: true
        },

        curr_cap: {
            type: Number,
            default: 0,
            required: true
        }
    }
);

const Hostel = mongoose.model('Hostel', hostelSchema);

module.exports = {Hostel};