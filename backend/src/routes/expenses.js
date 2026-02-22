const express = require('express');
const auth = require('../middleware/auth');
const Expense = require('../models/Expense');

const router = express.Router();

// GET /api/expenses - Get user's expenses
router.get('/', auth, async (req, res) => {
  try {
    const { group_id } = req.query;
    const query = {
      $or: [
        { created_by: req.user._id },
        { 'payers.user_id': req.user._id },
        { 'splits.user_id': req.user._id },
      ],
    };

    if (group_id) {
      query.group_id = group_id;
    }

    const expenses = await Expense.find(query)
      .populate('created_by', 'first_name last_name email')
      .populate('payers.user_id', 'first_name last_name email')
      .populate('splits.user_id', 'first_name last_name email')
      .populate('group_id', 'name')
      .sort({ date: -1 });

    res.json({ expenses: expenses.map((e) => e.toJSON()) });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ error: 'Error fetching expenses' });
  }
});

// GET /api/expenses/:id - Get expense by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('created_by', 'first_name last_name email profile_picture_url')
      .populate('payers.user_id', 'first_name last_name email')
      .populate('splits.user_id', 'first_name last_name email')
      .populate('group_id', 'name');

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json({ expense: expense.toJSON() });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching expense' });
  }
});

// POST /api/expenses - Create expense
router.post('/', auth, async (req, res) => {
  try {
    const { description, amount, currency, category, date, group_id, notes, payers, splits } = req.body;

    const expense = new Expense({
      description,
      amount,
      currency: currency || 'USD',
      category: category || 'general',
      date: date || new Date(),
      group_id,
      notes,
      created_by: req.user._id,
      payers: payers || [{ user_id: req.user._id, amount_paid: amount }],
      splits: splits || [],
    });

    await expense.save();

    const populated = await Expense.findById(expense._id)
      .populate('created_by', 'first_name last_name email')
      .populate('payers.user_id', 'first_name last_name email')
      .populate('splits.user_id', 'first_name last_name email');

    res.status(201).json({ expense: populated.toJSON() });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ error: 'Error creating expense' });
  }
});

// PUT /api/expenses/:id - Update expense
router.put('/:id', auth, async (req, res) => {
  try {
    const allowedUpdates = [
      'description', 'amount', 'currency', 'category',
      'date', 'notes', 'payers', 'splits',
    ];
    const updates = {};
    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, created_by: req.user._id },
      updates,
      { new: true }
    )
      .populate('created_by', 'first_name last_name email')
      .populate('payers.user_id', 'first_name last_name email')
      .populate('splits.user_id', 'first_name last_name email');

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found or unauthorized' });
    }

    res.json({ expense: expense.toJSON() });
  } catch (error) {
    res.status(500).json({ error: 'Error updating expense' });
  }
});

// DELETE /api/expenses/:id - Delete expense
router.delete('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      created_by: req.user._id,
    });

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found or unauthorized' });
    }

    res.json({ message: 'Expense deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting expense' });
  }
});

module.exports = router;
