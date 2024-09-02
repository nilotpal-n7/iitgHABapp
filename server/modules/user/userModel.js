const mongoose = require('mongoose');

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

const User = mongoose.model('User', userSchema);

module.exports = User;