const router = require('express').Router();
const Bins = require('../models/Bins');
const Staffs = require('../models/Staffs');
const Collections = require('../models/Collection');

// Get all zones with their bins and staff members
router.get('/', async (req, res) => {
    try {
        const zones = await Bins.distinct("zone");
        res.json(zones);
        console.log("Fetched zones:", zones);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to fetch zones' });
    }
});

//get non assigned bins with zone
router.post('/notauthorized', async (req, res) => {
    try {
        console.log("Received request for unassigned bins with query:", req.body); // ✅ LOG QUERY
        const { zone } = req.body;

        console.log("Zone received:", zone);

        if (!zone) {
            return res.status(400).json({ error: "Zone is required" });
        }

        const unassignedBins = await Bins.find({
            $or: [
                { authority: null },
                { authority: { $exists: false } }
            ],
            zone: zone
        }).select('binCode location zone');

        res.json(unassignedBins);
    } catch (error) {
        console.log(error); // ✅ IMPORTANT
        res.status(500).json({ error: 'Failed to fetch unassigned bins' });
    }
});

// GET all bins of a zone
router.get('/zone-bins', async (req, res) => {
    try {
        const { zone } = req.query;

        if (!zone) {
            return res.status(400).json({ error: "Zone required" });
        }

        const bins = await Bins.find({ zone })
            .select('_id binCode location zone authority');

        res.json(bins);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Failed to fetch bins" });
    }
});

module.exports = router;