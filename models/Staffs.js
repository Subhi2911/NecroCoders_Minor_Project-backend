const mongoose = require('mongoose');

const StaffsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    phone: {
        type: Number,
        required: true
    },
    joinDate: {
        type: Date,
        default: Date.now
    },
    assignedBins: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bins'
    }]
}, { timestamps: true });   

module.exports = mongoose.model('Staffs', StaffsSchema);