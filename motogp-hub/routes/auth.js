const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');

const JWT_SECRET = process.env.JWT_SECRET || 'motogp_hub_secret_2024';

// Register
router.post('/register', (req, res) => {
  const { username, email, password, name } = req.body;

  // Validation
  if (!username || !email || !password || !name)
    return res.status(400).json({ error: 'All fields are required' });
  if (username.length < 3 || username.length > 20)
    return res.status(400).json({ error: 'Username must be 3–20 characters' });
  if (!/^[a-zA-Z0-9_]+$/.test(username))
    return res.status(400).json({ error: 'Username can only contain letters, numbers, underscores' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'Invalid email address' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const colors = ['#E63946','#2A9D8F','#E9C46A','#F4A261','#264653','#6A0572','#0077B6','#00B4D8'];
  const avatarColor = colors[Math.floor(Math.random() * colors.length)];
  const avatar = name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();

  bcrypt.hash(password, 10, (err, hash) => {
    if (err) return res.status(500).json({ error: 'Server error' });

    const newUser = {
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: hash,
      name,
      role: 'fan',
      avatar,
      avatarColor,
      bio: '',
      followers: 0,
      createdAt: new Date()
    };

    db.users.insert(newUser, (err, doc) => {
      if (err) {
        if (err.message.includes('unique')) {
          return res.status(409).json({ error: 'Username or email already taken' });
        }
        return res.status(500).json({ error: 'Could not create account' });
      }
      const token = jwt.sign({ id: doc._id, username: doc.username, role: doc.role }, JWT_SECRET, { expiresIn: '7d' });
      res.status(201).json({
        token,
        user: { id: doc._id, username: doc.username, name: doc.name, role: doc.role, avatar: doc.avatar, avatarColor: doc.avatarColor }
      });
    });
  });
});

// Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password required' });

  db.users.findOne({ username: username.toLowerCase() }, (err, user) => {
    if (err || !user) return res.status(401).json({ error: 'Invalid credentials' });

    bcrypt.compare(password, user.password, (err, match) => {
      if (err || !match) return res.status(401).json({ error: 'Invalid credentials' });

      const token = jwt.sign({ id: user._id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
      res.json({
        token,
        user: { id: user._id, username: user.username, name: user.name, role: user.role, avatar: user.avatar, avatarColor: user.avatarColor }
      });
    });
  });
});

// Get current user profile
router.get('/me', require('./auth.middleware').authMiddleware, (req, res) => {
  db.users.findOne({ _id: req.user.id }, (err, user) => {
    if (err || !user) return res.status(404).json({ error: 'User not found' });
    const { password, ...safe } = user;
    res.json(safe);
  });
});

module.exports = router;
