const express = require('express');
const auth = require('../middleware/auth');
const Friendship = require('../models/Friendship');
const User = require('../models/User');

const router = express.Router();

// GET /api/friends - Get all friends
router.get('/', auth, async (req, res) => {
  try {
    const friendships = await Friendship.find({
      $or: [{ user_id_1: req.user._id }, { user_id_2: req.user._id }],
      status: 'accepted',
    });

    const friendIds = friendships.map((f) =>
      f.user_id_1.toString() === req.user._id.toString() ? f.user_id_2 : f.user_id_1
    );

    const friends = await User.find({ _id: { $in: friendIds } });
    res.json({ friends: friends.map((f) => f.toJSON()) });
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ error: 'Error fetching friends' });
  }
});

// GET /api/friends/pending - Get pending friend requests
router.get('/pending', auth, async (req, res) => {
  try {
    const pending = await Friendship.find({
      user_id_2: req.user._id,
      status: 'pending',
    }).populate('user_id_1', 'first_name last_name email profile_picture_url');

    res.json({ requests: pending });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching pending requests' });
  }
});

// POST /api/friends/request - Send friend request
router.post('/request', auth, async (req, res) => {
  try {
    const { email } = req.body;
    const friend = await User.findOne({ email });

    if (!friend) {
      return res.status(404).json({ error: 'User not found with this email' });
    }

    if (friend._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }

    // Check if friendship already exists
    const existing = await Friendship.findOne({
      $or: [
        { user_id_1: req.user._id, user_id_2: friend._id },
        { user_id_1: friend._id, user_id_2: req.user._id },
      ],
    });

    if (existing) {
      return res.status(400).json({ error: 'Friendship already exists or request pending' });
    }

    const friendship = new Friendship({
      user_id_1: req.user._id,
      user_id_2: friend._id,
      status: 'pending',
      requested_by: req.user._id,
    });

    await friendship.save();
    res.status(201).json({ friendship: friendship.toJSON() });
  } catch (error) {
    console.error('Friend request error:', error);
    res.status(500).json({ error: 'Error sending friend request' });
  }
});

// PUT /api/friends/:id/accept - Accept friend request
router.put('/:id/accept', auth, async (req, res) => {
  try {
    const friendship = await Friendship.findOneAndUpdate(
      { _id: req.params.id, user_id_2: req.user._id, status: 'pending' },
      { status: 'accepted' },
      { new: true }
    );

    if (!friendship) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    res.json({ friendship: friendship.toJSON() });
  } catch (error) {
    res.status(500).json({ error: 'Error accepting request' });
  }
});

// DELETE /api/friends/:id - Remove friend
router.delete('/:id', auth, async (req, res) => {
  try {
    await Friendship.findOneAndDelete({
      _id: req.params.id,
      $or: [{ user_id_1: req.user._id }, { user_id_2: req.user._id }],
    });
    res.json({ message: 'Friend removed' });
  } catch (error) {
    res.status(500).json({ error: 'Error removing friend' });
  }
});

module.exports = router;
