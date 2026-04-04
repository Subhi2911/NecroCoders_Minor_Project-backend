const router = require('express').Router();
const Staffs = require('../models/Staffs');
const Bins = require('../models/Bins');
const { nanoid } = require('nanoid');

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
        //const { name, phone, bins } = req.body;
        const staffId = `STF-${nanoid(8)}`; // Generate a unique staff ID

        const staff = new Staffs({ ...req.body, staffId });
        await staff.save();

        // assign bins
        await Bins.updateMany(
            { _id: { $in: req.body.assignedBins } },
            { $set: { authority: staff._id } }
        );
        await staff.save();
        res.status(201).json(staff);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create staff member' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const staff = await Staffs.findById(req.params.id);
        if (!staff) {
            return res.status(404).json({ error: 'Staff member not found' });
        }

        // unassign bins (set to null, NOT unset)
        await Bins.updateMany(
            { authority: staff._id },
            { $set: { authority: null } }
        );

        // delete staff using MODEL
        await Staffs.findByIdAndDelete(req.params.id);

        res.json({ message: 'Staff member deleted successfully' });

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to delete staff member' });
    }
});


router.put('/:id', async (req, res) => {
    try {
        const { name, phone } = req.body;
        const staff = await Staffs.findByIdAndUpdate(req.params.id, { name, phone }, { new: true });
        if (!staff) return res.status(404).json({ error: 'Staff member not found' });
        res.json(staff);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update staff member' });
    }
});


module.exports = router;