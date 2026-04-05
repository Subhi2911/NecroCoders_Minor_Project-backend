const mongoose = require('mongoose');

const BinsSchema = new mongoose.Schema({
    binCode: {
        type: String,
        unique: true
    },
    location: {
        type: String,
        required: true
    },
    capacity: {
        type: Number,
        required: true
    },
    currentFillLevel: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['empty', 'half-full', 'full'],
        default: 'empty'
    },
    lastEmptied: {
        type: Date,
        default: Date.now
    },
    locationCoordinates: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    zone: {
        type: String,
        default: "A"
    },
    collections: [
        { date: Date, binId: mongoose.Schema.Types.ObjectId, collectedAmount: Number }
    ],
    authority: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staffs'
    }
}, { timestamps: true });
module.exports = mongoose.model('Bins', BinsSchema);