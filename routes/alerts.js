const router = require('express').Router();
const Bins = require('../models/Bins');
const Alerts = require('../models/Alerts');
// Get all bins
router.get('/', async (req, res) => {
    try {
        const bins = await Bins.find();
        res.json(bins);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch bins' });
    }   
});

module.exports = router;