const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db');
const { onlineUsers } = require('../socket');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'waitless_super_secret_key_2024';
const JWT_EXPIRES = '7d';

/* ─── POST /api/auth/register ─────────────────────── */
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!name || !password) {
      return res.status(400).json({ error: 'Name and password are required' });
    }
    if (!email && !phone) {
      return res.status(400).json({ error: 'Email or phone is required' });
    }

    // Check duplicate
    if (email) {
      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (existing) return res.status(409).json({ error: 'Email already registered' });
    }
    if (phone) {
      const existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
      if (existing) return res.status(409).json({ error: 'Phone already registered' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const id = uuidv4();
    const userRole = role === 'provider' ? 'provider' : 'user';

    db.prepare(
      'INSERT INTO users (id, name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, name.trim(), email || null, phone || null, password_hash, userRole);

    const user = { id, name, email: email || null, phone: phone || null, role: userRole };
    const token = jwt.sign({ userId: id, role: userRole }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

    return res.status(201).json({ token, user });
  } catch (err) {
    console.error('[Auth] Register error:', err);
    return res.status(500).json({ error: 'Registration failed' });
  }
});

/* ─── POST /api/auth/login ───────────────────────── */
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Identifier and password are required' });
    }

    // Find by email or phone
    const user = db.prepare(
      'SELECT * FROM users WHERE email = ? OR phone = ?'
    ).get(identifier, identifier);

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    if (user.is_active === 0) {
      return res.status(403).json({ error: 'Your account has been suspended.' });
    }

    db.prepare('UPDATE users SET last_login_at = datetime("now") WHERE id = ?').run(user.id);

    const tokenPayload = { userId: user.id, role: user.role };
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES });

    return res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role },
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    return res.status(500).json({ error: 'Login failed' });
  }
});

/* ─── GET /api/auth/me ───────────────────────────── */
router.get('/me', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, name, email, phone, role FROM users WHERE id = ?').get(decoded.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ user });
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
});
/* ─── GET /api/auth/users ─────────────────────────── */
router.get('/users', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if the requester is an admin
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admins only' });
    }

    const rows = db.prepare('SELECT id, name, email, phone, role, is_active, created_at, last_login_at FROM users ORDER BY created_at DESC').all();
    
    // Attach online status
    const users = rows.map(u => ({
      ...u,
      is_online: onlineUsers.has(u.id)
    }));

    return res.json({ users });
  } catch (err) {
    console.error('[Auth] Users error:', err);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/* ─── PATCH /api/auth/users/:id/status ────────────────────── */
router.patch('/users/:id/status', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admins only' });
    }

    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive must be a boolean' });
    }

    const info = db.prepare('UPDATE users SET is_active = ? WHERE id = ?').run(isActive ? 1 : 0, req.params.id);
    if (info.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ success: true, is_active: isActive });
  } catch (err) {
    console.error('[Auth] Update user status error:', err);
    return res.status(500).json({ error: 'Failed to update user status' });
  }
});

/* ─── GET /api/auth/support-tickets ────────────────────── */
router.get('/support-tickets', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admins only' });
    }

    const tickets = db.prepare('SELECT * FROM support_tickets ORDER BY created_at DESC').all();
    return res.json({ tickets });
  } catch (err) {
    console.error('[Auth] Support tickets error:', err);
    return res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

/* ─── PATCH /api/auth/support-tickets/:id/resolve ──────── */
router.patch('/support-tickets/:id/resolve', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admins only' });
    }

    const info = db.prepare('UPDATE support_tickets SET status = ? WHERE id = ?').run('closed', req.params.id);
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('[Auth] Update ticket status error:', err);
    return res.status(500).json({ error: 'Failed to update ticket status' });
  }
});

module.exports = router;
