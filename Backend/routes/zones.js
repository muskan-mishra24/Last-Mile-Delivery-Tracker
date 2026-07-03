const express = require('express');
const Zone = require('../models/Zone');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/role');

const router = express.Router();

// GET /api/zones — list zones (authenticated)
router.get('/', auth, async (req, res) => {
  try {
    const zones = await Zone.find().sort({ name: 1 });
    res.json(zones);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/zones — create zone (admin)
router.post('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Zone name is required' });

    const zone = new Zone({ name, description });
    await zone.save();
    res.status(201).json(zone);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Zone name already exists' });
    }
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/zones/:id — update zone (admin)
router.put('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const { name, description } = req.body;
    const zone = await Zone.findByIdAndUpdate(
      req.params.id,
      { name, description },
      { new: true, runValidators: true }
    );
    if (!zone) return res.status(404).json({ message: 'Zone not found' });
    res.json(zone);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Zone name already exists' });
    }
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
