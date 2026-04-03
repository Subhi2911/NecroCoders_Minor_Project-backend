const router = require('express').Router();
const Staffs = require('../models/Staffs');
const Bins = require('../models/Bins');

// Get all staff members
router.get('/', async (req, res) => {
    try {
        const staffs = await Staffs.find().populate('assignedBins', 'location status');
        res.json(staffs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch staff members' });
    }
});

// Get a specific staff member by ID
router.get('/:id', async (req, res) => {
    try {
        const staff = await Staffs.findById(req.params.id).populate('assignedBins', 'location status');
        if (!staff) return res.status(404).json({ error: 'Staff member not found' });
        res.json(staff);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch staff member' });
    }
});

//create a new staff member
router.post('/', async (req, res) => {
    try {
        const { name, phone } = req.body;
        const newStaff = new Staffs({ name, phone });
        await newStaff.save();
        res.status(201).json(newStaff);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create staff member' });
    }
});


module.exports = router;