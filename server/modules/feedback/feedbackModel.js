const mongoose = require('mongoose');


const ratingOptions = ['Very Poor', 'Poor', 'Average', 'Good', 'Very Good'];''

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
  },

  // Extra fields if user is SMC
  smcFields: {
    type: {
      hygiene: { type: String, enum: ratingOptions },
      wasteDisposal: { type: String, enum: ratingOptions },
      qualityOfIngredients: { type: String, enum: ratingOptions },
      UniformAndPunctuality: { type: String, enum: ratingOptions },
    },
    default: null,
  },
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback;
