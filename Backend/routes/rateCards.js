const express = require('express');
const RateCard = require('../models/RateCard');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/role');

const router = express.Router();

// GET /api/rate-cards — list rate cards (admin)
router.get('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const cards = await RateCard.find()
      .populate('zone_from', 'name')
      .populate('zone_to', 'name')
      .sort({ order_type: 1 });
    res.json(cards);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/rate-cards — create rate card (admin)
router.post('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const { zone_from, zone_to, order_type, rate_per_kg } = req.body;
    if (!zone_from || !zone_to || !order_type || rate_per_kg === undefined) {
      return res.status(400).json({ message: 'zone_from, zone_to, order_type, rate_per_kg are required' });
    }

    const card = new RateCard({ zone_from, zone_to, order_type, rate_per_kg });
    await card.save();
    const populated = await card.populate(['zone_from', 'zone_to']);
    res.status(201).json(populated);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Rate card for this zone pair and order type already exists' });
    }
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/rate-cards/:id — update rate card (admin)
router.put('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const { zone_from, zone_to, order_type, rate_per_kg } = req.body;
    const card = await RateCard.findByIdAndUpdate(
      req.params.id,
      { zone_from, zone_to, order_type, rate_per_kg },
      { new: true, runValidators: true }
    ).populate(['zone_from', 'zone_to']);
    if (!card) return res.status(404).json({ message: 'Rate card not found' });
    res.json(card);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Rate card for this zone pair and order type already exists' });
    }
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/rate-cards/:id — delete rate card (admin)
router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const card = await RateCard.findByIdAndDelete(req.params.id);
    if (!card) return res.status(404).json({ message: 'Rate card not found' });
    res.json({ message: 'Rate card deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
