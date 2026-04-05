const mongoose = require('mongoose');

const CollectionSchema = new mongoose.Schema({
    bin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bins',
        required: true
    },
    collectedAmount: {
        type: Number,
        required: true
    },
    collectedAt: {
        type: Date,
        default: Date.now
    },
    zone: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('Collections', CollectionSchema);