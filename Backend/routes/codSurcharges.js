const express = require('express');
const CODSurcharge = require('../models/CODSurcharge');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/role');

const router = express.Router();

// GET /api/cod-surcharges — list COD surcharges (admin)
router.get('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const surcharges = await CODSurcharge.find().sort({ order_type: 1 });
    res.json(surcharges);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/cod-surcharges — create COD surcharge (admin)
router.post('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const { order_type, percentage } = req.body;
    if (!order_type || percentage === undefined) {
      return res.status(400).json({ message: 'order_type and percentage are required' });
    }

    const surcharge = new CODSurcharge({ order_type, percentage });
    await surcharge.save();
    res.status(201).json(surcharge);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'COD surcharge for this order type already exists' });
    }
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/cod-surcharges/:id — update COD surcharge (admin)
router.put('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const { order_type, percentage } = req.body;
    const surcharge = await CODSurcharge.findByIdAndUpdate(
      req.params.id,
      { order_type, percentage },
      { new: true, runValidators: true }
    );
    if (!surcharge) return res.status(404).json({ message: 'COD surcharge not found' });
    res.json(surcharge);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'COD surcharge for this order type already exists' });
    }
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
