const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authMiddleware, optionalAuth } = require('./auth.middleware');

// ─── GET FEED (approved only) ───────────────────────────────
router.get('/', optionalAuth, (req, res) => {
  const page  = parseInt(req.query.page)  || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip  = (page - 1) * limit;

  db.posts.find({ status: 'approved' }).sort({ createdAt: -1 }).skip(skip).limit(limit).exec((err, posts) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch posts' });

    if (!req.user) return res.json({ posts, hasMore: posts.length === limit });

    db.likes.find({ userId: req.user.id, postId: { $in: posts.map(p => p._id) } }, (err, userLikes) => {
      const likeMap = {};
      (userLikes || []).forEach(l => { likeMap[l.postId] = l.type; });
      const enriched = posts.map(p => ({ ...p, userVote: likeMap[p._id] || null }));
      res.json({ posts: enriched, hasMore: posts.length === limit });
    });
  });
});

// ─── CREATE POST (goes to pending) ─────────────────────────
router.post('/', authMiddleware, (req, res) => {
  const { content } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'Post content cannot be empty' });
  if (content.length > 500)        return res.status(400).json({ error: 'Post too long (max 500 characters)' });

  db.users.findOne({ _id: req.user.id }, (err, user) => {
    if (err || !user) return res.status(404).json({ error: 'User not found' });

    // Admins & drivers get auto-approved; regular fans go to pending
    const status = (user.role === 'admin' || user.role === 'driver') ? 'approved' : 'pending';

    const newPost = {
      userId: req.user.id, username: user.username,
      authorName: user.name, authorAvatar: user.avatar,
      authorAvatarColor: user.avatarColor, authorRole: user.role,
      content: content.trim(), status,
      likes: 0, dislikes: 0, commentCount: 0,
      createdAt: new Date()
    };

    db.posts.insert(newPost, (err, doc) => {
      if (err) return res.status(500).json({ error: 'Failed to create post' });
      res.status(201).json(doc);
    });
  });
});

// ─── DELETE POST ────────────────────────────────────────────
router.delete('/:id', authMiddleware, (req, res) => {
  db.posts.findOne({ _id: req.params.id }, (err, post) => {
    if (err || !post) return res.status(404).json({ error: 'Post not found' });
    const isOwn   = post.userId === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwn && !isAdmin) return res.status(403).json({ error: 'Not authorized' });

    db.posts.remove({ _id: req.params.id }, {}, (err) => {
      if (err) return res.status(500).json({ error: 'Failed to delete post' });
      db.comments.remove({ postId: req.params.id }, { multi: true });
      db.likes.remove({ postId: req.params.id }, { multi: true });
      res.json({ success: true });
    });
  });
});

// ─── VOTE ───────────────────────────────────────────────────
router.post('/:id/vote', authMiddleware, (req, res) => {
  const { type } = req.body;
  if (!['like','dislike'].includes(type)) return res.status(400).json({ error: 'Invalid vote type' });

  db.likes.findOne({ postId: req.params.id, userId: req.user.id }, (err, existing) => {
    if (err) return res.status(500).json({ error: 'Server error' });

    if (existing) {
      if (existing.type === type) {
        // toggle off
        db.likes.remove({ _id: existing._id }, {}, () => {
          const upd = type === 'like' ? { $inc:{likes:-1} } : { $inc:{dislikes:-1} };
          db.posts.update({ _id: req.params.id }, upd, {}, () => {
            db.posts.findOne({ _id: req.params.id }, (e,p) => res.json({ ...p, userVote: null }));
          });
        });
      } else {
        // switch
        db.likes.update({ _id: existing._id }, { $set:{ type } }, {}, () => {
          const upd = type === 'like' ? { $inc:{likes:1,dislikes:-1} } : { $inc:{likes:-1,dislikes:1} };
          db.posts.update({ _id: req.params.id }, upd, {}, () => {
            db.posts.findOne({ _id: req.params.id }, (e,p) => res.json({ ...p, userVote: type }));
          });
        });
      }
    } else {
      db.likes.insert({ postId: req.params.id, userId: req.user.id, type, createdAt: new Date() }, () => {
        const upd = type === 'like' ? { $inc:{likes:1} } : { $inc:{dislikes:1} };
        db.posts.update({ _id: req.params.id }, upd, {}, () => {
          db.posts.findOne({ _id: req.params.id }, (e,p) => res.json({ ...p, userVote: type }));
        });
      });
    }
  });
});

// ─── COMMENTS ───────────────────────────────────────────────
router.get('/:id/comments', (req, res) => {
  db.comments.find({ postId: req.params.id }).sort({ createdAt: 1 }).exec((err, comments) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch comments' });
    res.json(comments);
  });
});

router.post('/:id/comments', authMiddleware, (req, res) => {
  const { content } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'Comment cannot be empty' });
  if (content.length > 300)        return res.status(400).json({ error: 'Comment too long (max 300 chars)' });

  db.users.findOne({ _id: req.user.id }, (err, user) => {
    if (err || !user) return res.status(404).json({ error: 'User not found' });

    const comment = {
      postId: req.params.id, userId: req.user.id, username: user.username,
      authorName: user.name, authorAvatar: user.avatar,
      authorAvatarColor: user.avatarColor,
      content: content.trim(), createdAt: new Date()
    };

    db.comments.insert(comment, (err, doc) => {
      if (err) return res.status(500).json({ error: 'Failed to add comment' });
      db.posts.update({ _id: req.params.id }, { $inc:{ commentCount:1 } }, {});
      res.status(201).json(doc);
    });
  });
});

router.delete('/:postId/comments/:commentId', authMiddleware, (req, res) => {
  db.comments.findOne({ _id: req.params.commentId }, (err, comment) => {
    if (err || !comment) return res.status(404).json({ error: 'Comment not found' });
    const isOwn   = comment.userId === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwn && !isAdmin) return res.status(403).json({ error: 'Not authorized' });

    db.comments.remove({ _id: req.params.commentId }, {}, (err) => {
      if (err) return res.status(500).json({ error: 'Failed to delete comment' });
      db.posts.update({ _id: req.params.postId }, { $inc:{ commentCount:-1 } }, {});
      res.json({ success: true });
    });
  });
});

// ─── ADMIN: GET PENDING POSTS ────────────────────────────────
router.get('/admin/pending', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  db.posts.find({ status: 'pending' }).sort({ createdAt: 1 }).exec((err, posts) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch pending posts' });
    res.json(posts);
  });
});

// ─── ADMIN: APPROVE POST ─────────────────────────────────────
router.patch('/admin/:id/approve', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  db.posts.update({ _id: req.params.id }, { $set:{ status:'approved' } }, {}, (err) => {
    if (err) return res.status(500).json({ error: 'Failed to approve post' });
    db.posts.findOne({ _id: req.params.id }, (e, p) => res.json(p));
  });
});

// ─── ADMIN: REJECT POST ──────────────────────────────────────
router.delete('/admin/:id/reject', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  db.posts.remove({ _id: req.params.id }, {}, (err) => {
    if (err) return res.status(500).json({ error: 'Failed to reject post' });
    res.json({ success: true });
  });
});

module.exports = router;
