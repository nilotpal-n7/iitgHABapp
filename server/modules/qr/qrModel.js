const mongoose = require('mongoose');
const dotenv = require("dotenv")

dotenv.config();

const qrSchema = new mongoose.Schema(
    {
        qr_string: {
            type: String,
            required: true,
            unique: true
        },
        is_scanned: {
            type: Boolean,
            required: true,
            default: false
        }
    }
);

const QR = mongoose.model('QR', qrSchema);

module.exports = {QR};