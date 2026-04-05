const mongoose = require('mongoose');

const StaffsSchema = new mongoose.Schema({
    staffId:{
        type: String,
        unique: true
    },
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
    }],
    totalTasks:{
        type: Number,
        default: 0
    },
    completedTasks:{
        type: Number,
        default: 0
    },
    zone: {
        type: String,
        default: "A"
    }

}, { timestamps: true });   

module.exports = mongoose.model('Staffs', StaffsSchema);