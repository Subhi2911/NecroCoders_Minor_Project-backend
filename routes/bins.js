const router = require('express').Router();
const Bins = require('../models/Bins');
const Alerts = require('../models/Alerts');
require('../models/Staffs');
const { nanoid } = require('nanoid');

// Get all bins
router.get('/', async (req, res) => {
    try {
        const bins = await Bins.find()
            .populate('authority', 'name phone');

        res.json(bins);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch bins' });
    }
});

//all unassigned bins
router.get('/unassigned', async (req, res) => {
    try {
        console.log("Fetching unassigned bins...");
        const bins = await Bins.find({
            $or: [
                { authority: null },
                { authority: { $exists: false } },
            ]
        });

        res.status(200).json(bins);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Failed to fetch bins" });
    }
});

// Get a specific bin by ID
router.get('/:id', async (req, res) => {
    try {
        const bin = await Bins.findById(req.params.id);
        if (!bin) return res.status(404).json({ error: 'Bin not found' });
        res.json(bin.populate('authority', 'name email phone'));
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
        res.json(bin.populate('authority', 'name email phone'));
    } catch (error) {
        res.status(500).json({ error: 'Failed to update bin' });
    }
});

//assign existing bin to new authority
const Staffs = require('../models/Staffs');

router.put('/assign-authority/:binId', async (req, res) => {
    try {
        const { authorityId } = req.body;

        const bin = await Bins.findById(req.params.binId);
        if (!bin) return res.status(404).json({ error: 'Bin not found' });

        // remove bin from old authority (if exists)
        if (bin.authority) {
            await Staffs.findByIdAndUpdate(
                bin.authority,
                { $pull: { assignedBins: bin._id } }
            );
        }

        // assign new authority
        bin.authority = authorityId;
        await bin.save();

        // add bin to new authority
        await Staffs.findByIdAndUpdate(
            authorityId,
            { $addToSet: { assignedBins: bin._id } }
        );

        await bin.populate('authority', 'name phone');

        res.json(bin);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to assign authority to bin' });
    }
});


//add new bins

router.post('/add-bin', async (req, res) => {
    try {
        const { location, capacity, authority, zone } = req.body;
        console.log(location, capacity, authority,zone);
        const newBin = new Bins({
            binCode: `BIN-${nanoid(8)}`,
            location,
            capacity,
            authority,
            locationCoordinates: {
                type: 'Point',
                coordinates: [28.61, 77.20] // default coordinates, can be updated later
            },
            zone: zone || null, // default zone, can be updated later
            currentFillLevel: 0,
            status: 'empty'
        });


        await newBin.save();
        const populatedBin = await Bins.findById(newBin._id).populate('authority', 'name phone');
        res.status(201).json(populatedBin);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to create bin' });
    }
});



router.delete("/:id", async (req, res) => {
    await Bins.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});





module.exports = router;