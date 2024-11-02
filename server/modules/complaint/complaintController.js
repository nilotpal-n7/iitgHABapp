const Complaint = require('./complaintModel');
const Item = require('../item/itemModel');
const {User} = require('../user/userModel');

const submitComplaint = async (req, res) => {
    try {
        const complaint = await Complaint.create(req.body);
        const item = await Item.findById(req.body.item);
        const user = await User.findById(req.body.user);

        item.complaints.push(complaint._id);
        user.complaints.push(complaint._id);

        await item.save();
        await user.save();

        res.status(201).json({ message: 'Complaint submitted successfully', complaint });
    } catch (err) {
        res.status(500).json({ message: 'Error submitting complaint', error: err.message });
    }
};

const updateComplaint = async (req, res) => {
    try {
        const complaint = await Complaint.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ message: 'Complaint updated successfully', complaint });
    } catch (err) {
        res.status(500).json({ message: 'Error updating complaint', error: err.message });
    }
};

module.exports = {
    submitComplaint,
    updateComplaint
};