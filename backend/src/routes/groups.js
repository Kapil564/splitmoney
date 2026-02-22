const express = require('express');
const auth = require('../middleware/auth');
const Group = require('../models/Group');

const router = express.Router();

// GET /api/groups - Get user's groups
router.get('/', auth, async (req, res) => {
  try {
    const groups = await Group.find({
      'members.user_id': req.user._id,
    }).populate('members.user_id', 'first_name last_name email profile_picture_url');

    res.json({ groups: groups.map((g) => g.toJSON()) });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ error: 'Error fetching groups' });
  }
});

// GET /api/groups/:id - Get group by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const group = await Group.findOne({
      _id: req.params.id,
      'members.user_id': req.user._id,
    }).populate('members.user_id', 'first_name last_name email profile_picture_url');

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.json({ group: group.toJSON() });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching group' });
  }
});

// POST /api/groups - Create group
router.post('/', auth, async (req, res) => {
  try {
    const { name, type, currency, simplify_debts, member_ids } = req.body;

    const members = [{ user_id: req.user._id }];
    if (member_ids && Array.isArray(member_ids)) {
      member_ids.forEach((id) => {
        if (id !== req.user._id.toString()) {
          members.push({ user_id: id });
        }
      });
    }

    const group = new Group({
      name,
      type: type || 'other',
      currency: currency || 'USD',
      created_by: req.user._id,
      simplify_debts: simplify_debts || false,
      members,
    });

    await group.save();
    const populated = await Group.findById(group._id).populate(
      'members.user_id',
      'first_name last_name email profile_picture_url'
    );

    res.status(201).json({ group: populated.toJSON() });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ error: 'Error creating group' });
  }
});

// PUT /api/groups/:id - Update group
router.put('/:id', auth, async (req, res) => {
  try {
    const allowedUpdates = ['name', 'type', 'image_url', 'currency', 'simplify_debts'];
    const updates = {};
    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const group = await Group.findOneAndUpdate(
      { _id: req.params.id, created_by: req.user._id },
      updates,
      { new: true }
    ).populate('members.user_id', 'first_name last_name email profile_picture_url');

    if (!group) {
      return res.status(404).json({ error: 'Group not found or unauthorized' });
    }

    res.json({ group: group.toJSON() });
  } catch (error) {
    res.status(500).json({ error: 'Error updating group' });
  }
});

// POST /api/groups/:id/members - Add member to group
router.post('/:id/members', auth, async (req, res) => {
  try {
    const { user_id } = req.body;
    const group = await Group.findOne({
      _id: req.params.id,
      'members.user_id': req.user._id,
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const alreadyMember = group.members.some((m) => m.user_id.toString() === user_id);
    if (alreadyMember) {
      return res.status(400).json({ error: 'User is already a member' });
    }

    group.members.push({ user_id });
    await group.save();

    const populated = await Group.findById(group._id).populate(
      'members.user_id',
      'first_name last_name email profile_picture_url'
    );

    res.json({ group: populated.toJSON() });
  } catch (error) {
    res.status(500).json({ error: 'Error adding member' });
  }
});

// DELETE /api/groups/:id - Delete group
router.delete('/:id', auth, async (req, res) => {
  try {
    const group = await Group.findOneAndDelete({
      _id: req.params.id,
      created_by: req.user._id,
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found or unauthorized' });
    }

    res.json({ message: 'Group deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting group' });
  }
});

module.exports = router;
