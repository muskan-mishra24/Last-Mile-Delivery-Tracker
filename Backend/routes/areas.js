const express = require('express');
const Area = require('../models/Area');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/role');

const router = express.Router();

// GET /api/areas — list areas (authenticated)
router.get('/', auth, async (req, res) => {
  try {
    const areas = await Area.find().populate('zone').sort({ name: 1 });
    res.json(areas);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/areas — create area (admin)
router.post('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const { name, pincode, zone } = req.body;
    if (!name || !pincode || !zone) {
      return res.status(400).json({ message: 'name, pincode, and zone are required' });
    }

    const area = new Area({ name, pincode, zone });
    await area.save();
    const populated = await area.populate('zone');
    res.status(201).json(populated);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Pincode already exists' });
    }
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/areas/:id — update area (admin)
router.put('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const { name, pincode, zone } = req.body;
    const area = await Area.findByIdAndUpdate(
      req.params.id,
      { name, pincode, zone },
      { new: true, runValidators: true }
    ).populate('zone');
    if (!area) return res.status(404).json({ message: 'Area not found' });
    res.json(area);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Pincode already exists' });
    }
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
