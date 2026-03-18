const mongoodb = require('mongoose');

const AlertsSchema = new mongoodb.Schema({
    binId: {
        type: mongoodb.Schema.Types.ObjectId,
        ref: 'Bins',
        required: true
    },
    alertType: {
        type: String,
        enum: ['overflow', 'damage', 'theft'],
        required: true  
    },
    message: {
        type: String,
        required: true
    },
    isResolved: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoodb.model('Alerts', AlertsSchema);