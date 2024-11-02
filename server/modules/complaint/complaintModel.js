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
        },
        createdOn: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ['submitted', 'in_progress', 'resolved'],
            default: 'submitted'
        }
    }
);

const Complaint = mongoose.model('Complaint', complaintSchema);

module.exports = Complaint;