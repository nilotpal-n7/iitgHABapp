const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
    {
        qrCode: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        description: {
            type: String
        },
        location: {
            type: String
        },
        status: {
            type: String,
            enum: ['submitted', 'in_progress', 'resolved']  
        },
        complainUpdate: {
            type: String
        },
        complaints: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Complaint' 
        }],
        currentAuthority: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        hostel: {
            type: String
        }
        
    }

);

const Item = mongoose.model('Item', itemSchema);

module.exports = Item;