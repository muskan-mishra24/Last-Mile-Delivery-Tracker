const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/role');

const router = express.Router();

// GET /api/agents — list agents (admin only, with isAvailable filter)
router.get('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const filter = { role: 'delivery_agent' };
    if (req.query.isAvailable !== undefined) {
      filter.isAvailable = req.query.isAvailable === 'true';
    }

    const agents = await User.find(filter)
      .populate('currentZone', 'name')
      .select('-password')
      .sort({ name: 1 });
    res.json(agents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
