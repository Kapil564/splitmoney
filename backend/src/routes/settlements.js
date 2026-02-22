const express = require('express');
const auth = require('../middleware/auth');
const Settlement = require('../models/Settlement');

const router = express.Router();

// GET /api/settlements - Get user's settlements
router.get('/', auth, async (req, res) => {
  try {
    const { group_id } = req.query;
    const query = {
      $or: [{ from_user_id: req.user._id }, { to_user_id: req.user._id }],
    };

    if (group_id) {
      query.group_id = group_id;
    }

    const settlements = await Settlement.find(query)
      .populate('from_user_id', 'first_name last_name email')
      .populate('to_user_id', 'first_name last_name email')
      .populate('group_id', 'name')
      .sort({ created_at: -1 });

    res.json({ settlements: settlements.map((s) => s.toJSON()) });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching settlements' });
  }
});

// POST /api/settlements - Record settlement
router.post('/', auth, async (req, res) => {
  try {
    const { to_user_id, amount, currency, payment_method, group_id, notes } = req.body;

    const settlement = new Settlement({
      from_user_id: req.user._id,
      to_user_id,
      amount,
      currency: currency || 'USD',
      payment_method,
      group_id,
      notes,
    });

    await settlement.save();

    const populated = await Settlement.findById(settlement._id)
      .populate('from_user_id', 'first_name last_name email')
      .populate('to_user_id', 'first_name last_name email');

    res.status(201).json({ settlement: populated.toJSON() });
  } catch (error) {
    console.error('Create settlement error:', error);
    res.status(500).json({ error: 'Error recording settlement' });
  }
});

module.exports = router;
