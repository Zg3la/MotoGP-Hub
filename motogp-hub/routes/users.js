const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authMiddleware, optionalAuth } = require('./auth.middleware');

// Get all drivers
router.get('/drivers', optionalAuth, (req, res) => {
  db.users.find({ role: 'driver' }, (err, drivers) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch drivers' });

    const safe = drivers.map(({ password, email, ...d }) => d);

    if (!req.user) return res.json(safe);

    // Check which drivers the current user follows
    db.follows.find({ followerId: req.user.id }, (err, follows) => {
      const followSet = new Set((follows || []).map(f => f.followingId));
      const enriched = safe.map(d => ({ ...d, isFollowing: followSet.has(d._id) }));
      res.json(enriched);
    });
  });
});

// Get user profile by username
router.get('/:username', optionalAuth, (req, res) => {
  db.users.findOne({ username: req.params.username }, (err, user) => {
    if (err || !user) return res.status(404).json({ error: 'User not found' });
    const { password, email, ...safe } = user;

    if (!req.user) return res.json({ ...safe, isFollowing: false });

    db.follows.findOne({ followerId: req.user.id, followingId: user._id }, (err, follow) => {
      res.json({ ...safe, isFollowing: !!follow });
    });
  });
});

// Get user's posts
router.get('/:username/posts', (req, res) => {
  const requestingUser = req.headers.authorization ? (() => {
    try { const jwt = require('jsonwebtoken'); return jwt.verify(req.headers.authorization.split(' ')[1], process.env.JWT_SECRET || 'motogp_hub_secret_2024'); } catch { return null; }
  })() : null;

  db.users.findOne({ username: req.params.username }, (err, user) => {
    if (err || !user) return res.status(404).json({ error: 'User not found' });
    // Owner sees all posts, others only see approved
    const isOwner = requestingUser && requestingUser.id === user._id;
    const isAdmin = requestingUser && requestingUser.role === 'admin';
    const query = (isOwner || isAdmin) ? { userId: user._id } : { userId: user._id, status: 'approved' };
    db.posts.find(query).sort({ createdAt: -1 }).exec((err, posts) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch posts' });
      res.json(posts);
    });
  });
});

// Follow/Unfollow a user
router.post('/:username/follow', authMiddleware, (req, res) => {
  db.users.findOne({ username: req.params.username }, (err, target) => {
    if (err || !target) return res.status(404).json({ error: 'User not found' });
    if (target._id === req.user.id) return res.status(400).json({ error: 'Cannot follow yourself' });

    db.follows.findOne({ followerId: req.user.id, followingId: target._id }, (err, existing) => {
      if (existing) {
        // Unfollow
        db.follows.remove({ _id: existing._id }, {}, () => {
          db.users.update({ _id: target._id }, { $inc: { followers: -1 } }, {}, () => {
            db.users.findOne({ _id: target._id }, (e, u) => {
              const { password, email, ...safe } = u;
              res.json({ ...safe, isFollowing: false });
            });
          });
        });
      } else {
        // Follow
        db.follows.insert({ followerId: req.user.id, followingId: target._id, createdAt: new Date() }, () => {
          db.users.update({ _id: target._id }, { $inc: { followers: 1 } }, {}, () => {
            db.users.findOne({ _id: target._id }, (e, u) => {
              const { password, email, ...safe } = u;
              res.json({ ...safe, isFollowing: true });
            });
          });
        });
      }
    });
  });
});

// Update own profile bio
router.patch('/me/bio', authMiddleware, (req, res) => {
  const { bio } = req.body;
  if (bio === undefined) return res.status(400).json({ error: 'Bio required' });
  if (bio.length > 200) return res.status(400).json({ error: 'Bio too long (max 200 chars)' });

  db.users.update({ _id: req.user.id }, { $set: { bio } }, {}, (err) => {
    if (err) return res.status(500).json({ error: 'Failed to update bio' });
    res.json({ success: true });
  });
});

module.exports = router;
