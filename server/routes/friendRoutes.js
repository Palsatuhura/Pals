const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const { authenticateToken } = require('../middleware/auth');

// Add friend
router.post('/add', async (req, res) => {
  console.log('friendRoutes: POST /add route hit');
  try {
    const { userId, friendSessionId } = req.body;

    // Find friend by session ID
    const friend = await User.findOne({ sessionId: friendSessionId });
    if (!friend) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Add friend to user's friends list
    const user = await User.findById(userId);
    if (!user.friends.includes(friendSessionId)) {
      user.friends.push(friendSessionId);
      await user.save();
    }

    // Add user to friend's friends list
    if (!friend.friends.includes(user.sessionId)) {
      friend.friends.push(user.sessionId);
      await friend.save();
    }

    res.json({ message: 'Friend added successfully' });
  } catch (error) {
    console.error('friendRoutes: Error adding friend:', error);
    res.status(500).json({ message: 'Error adding friend', error: error.message });
  }
});

// Get user's friends
router.get('/:sessionId', async (req, res) => {
  console.log('friendRoutes: GET /:sessionId route hit');
  try {
    const user = await User.findOne({ sessionId: req.params.sessionId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const friends = await User.find({
      sessionId: { $in: user.friends }
    });

    res.json(friends);
  } catch (error) {
    console.error('friendRoutes: Error fetching friends:', error);
    res.status(500).json({ message: 'Error fetching friends', error: error.message });
  }
});

// Get user's friends (authenticated)
router.get('/', authenticateToken, async (req, res) => {
  console.log('friendRoutes: GET / route hit');
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const friends = await User.find({
      sessionId: { $in: user.friends }
    }, 'name sessionId status lastSeen');

    res.json(friends);
  } catch (error) {
    console.error('friendRoutes: Error fetching friends:', error);
    res.status(500).json({ message: 'Error fetching friends', error: error.message });
  }
});

// Get user's friends (authenticated)
router.get('/api/friends', authenticateToken, async (req, res) => {
  console.log('friendRoutes: GET /api/friends route hit');
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const friends = await User.find({
      sessionId: { $in: user.friends }
    }, 'name sessionId status lastSeen');

    res.json(friends);
  } catch (error) {
    console.error('friendRoutes: Error fetching friends:', error);
    res.status(500).json({ message: 'Error fetching friends', error: error.message });
  }
});

// Remove friend
router.delete('/:friendId', authenticateToken, async (req, res) => {
  console.log('friendRoutes: DELETE /:friendId route hit');
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    const friend = await User.findById(req.params.friendId);

    if (!friend) {
      return res.status(404).json({ message: 'Friend not found' });
    }

    // Remove from both users' friends lists
    user.friends = user.friends.filter(id => id !== friend.sessionId);
    friend.friends = friend.friends.filter(id => id !== user.sessionId);

    await user.save();
    await friend.save();

    // Notify both users through WebSocket
    const io = req.app.get('io');
    io.to(user.sessionId).emit('friendRemoved', { friendId: friend._id });
    io.to(friend.sessionId).emit('friendRemoved', { friendId: user._id });

    res.json({ message: 'Friend removed successfully' });
  } catch (error) {
    console.error('friendRoutes: Error removing friend:', error);
    res.status(500).json({ message: 'Error removing friend', error: error.message });
  }
});

module.exports = router;
