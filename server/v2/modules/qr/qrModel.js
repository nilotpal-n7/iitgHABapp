const mongoose = require("mongoose");

const qrSchema = new mongoose.Schema({
  qr_string: {
    type: String,
    required: true,
  },
  qr_base64: {
    type: String,
    required: true,
  },
});

const QR = mongoose.model("QR", qrSchema);

module.exports = { QR };

