const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authMiddleware, optionalAuth } = require('./auth.middleware');

// ─── GET ACTIVE DISCUSSION ───────────────────────────────────
router.get('/discussion', optionalAuth, (req, res) => {
  db.live_discussions.findOne({ active: true }).sort({ createdAt: -1 }).exec((err, discussion) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json({ discussion: discussion || null });
  });
});

// ─── ADMIN: CREATE / OPEN DISCUSSION ────────────────────────
router.post('/discussion', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const { title } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });

  // close any existing active discussions first
  db.live_discussions.update({ active: true }, { $set: { active: false } }, { multi: true }, () => {
    const discussion = {
      title: title.trim(),
      active: true,
      createdBy: req.user.username,
      createdAt: new Date(),
    };
    db.live_discussions.insert(discussion, (err, doc) => {
      if (err) return res.status(500).json({ error: 'Failed to create discussion' });
      res.status(201).json({ discussion: doc });
    });
  });
});

// ─── ADMIN: CLOSE DISCUSSION ─────────────────────────────────
router.delete('/discussion', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  db.live_discussions.update({ active: true }, { $set: { active: false } }, { multi: true }, (err) => {
    if (err) return res.status(500).json({ error: 'Failed to close discussion' });
    res.json({ success: true });
  });
});

// ─── GET MESSAGES (with since param for polling) ─────────────
router.get('/discussion/messages', optionalAuth, (req, res) => {
  const since = req.query.since ? new Date(req.query.since) : new Date(0);
  db.live_discussions.findOne({ active: true }, (err, discussion) => {
    if (err || !discussion) return res.json({ messages: [] });
    db.live_messages
      .find({ discussionId: discussion._id, createdAt: { $gt: since } })
      .sort({ createdAt: 1 })
      .exec((err, messages) => {
        if (err) return res.status(500).json({ error: 'Server error' });
        res.json({ messages });
      });
  });
});

// ─── POST MESSAGE ────────────────────────────────────────────
router.post('/discussion/messages', authMiddleware, (req, res) => {
  const { content, discussionId } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'Message cannot be empty' });
  if (content.length > 300) return res.status(400).json({ error: 'Message too long (max 300 chars)' });

  db.live_discussions.findOne({ _id: discussionId, active: true }, (err, discussion) => {
    if (err || !discussion) return res.status(404).json({ error: 'Discussion not found or closed' });

    db.users.findOne({ _id: req.user.id }, (err, user) => {
      if (err || !user) return res.status(404).json({ error: 'User not found' });

      const message = {
        discussionId: discussion._id,
        userId: req.user.id,
        username: user.username,
        authorName: user.name,
        authorAvatar: user.avatar,
        authorAvatarColor: user.avatarColor,
        authorRole: user.role,
        content: content.trim(),
        createdAt: new Date(),
      };

      db.live_messages.insert(message, (err, doc) => {
        if (err) return res.status(500).json({ error: 'Failed to send message' });
        res.status(201).json({ message: doc });
      });
    });
  });
});

module.exports = router;
