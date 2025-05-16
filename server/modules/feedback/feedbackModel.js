const mongoose = require('mongoose');

const ratingOptions = ['very poor', 'poor', 'average', 'good', 'very good'];

const feedbackSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  breakfast: {
    type: String,
    enum: ratingOptions,
    required: true
  },
  lunch: {
    type: String,
    enum: ratingOptions,
    required: true
  },
  dinner: {
    type: String,
    enum: ratingOptions,
    required: true
  },
  comment: {
    type: String,
    default: ''
  }
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback;
