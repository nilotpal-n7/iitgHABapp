const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
    {
        item: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Item',
            required: true
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        description: {
            type: String,
            required: true
        }
    }
);

const Complaint = mongoose.model('Complaint', complaintSchema);

module.exports = Complaint;