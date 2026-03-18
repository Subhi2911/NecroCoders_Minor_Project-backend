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

// Get a specific bin by ID
router.get('/:id', async (req, res) => {
    try {
        const bin = await Bins.findById(req.params.id);
        if (!bin) return res.status(404).json({ error: 'Bin not found' });
        res.json(bin);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch bin' });
    }
});

// Update a bin's fill level and status
router.put('/:id', async (req, res) => {
    try {
        const { currentFillLevel } = req.body;
        const bin = await Bins.findById(req.params.id);
        if (!bin) return res.status(404).json({ error: 'Bin not found' });
        bin.currentFillLevel = currentFillLevel;
        if (currentFillLevel >= bin.capacity) {
            bin.status = 'full';
            await Alerts.create({
                binId: bin._id,
                alertType: 'overflow',
                message: `Bin at ${bin.location} is overflowing!`
            });
        } else if (currentFillLevel >= bin.capacity / 2) {
            bin.status = 'half-full';
        } else {
            bin.status = 'empty';
        }
        await bin.save();
        res.json(bin);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update bin' });
    }
});

module.exports = router;