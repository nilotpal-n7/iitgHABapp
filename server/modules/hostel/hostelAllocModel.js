const mongoose = require('mongoose');

const UserAllocHostelSchema = new mongoose.Schema({
  rollNo: {
    type: String,
    required: true,
    unique: true,
  },
  hostel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
  },
});

const UserAllocHostel = mongoose.model('UserAllocHostel', UserAllocHostelSchema);

module.exports = UserAllocHostel;