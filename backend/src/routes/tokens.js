const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { db, recalculateQueue } = require('../db');

let io; // will be injected by index.js
router.setIO = (socketIO) => { io = socketIO; };

// GET /api/tokens/:id — get single token with position
router.get('/:id', (req, res) => {
  try {
    const token = db.prepare('SELECT * FROM tokens WHERE id = ?').get(req.params.id);
    if (!token) return res.status(404).json({ success: false, error: 'Token not found' });

    const queue = db.prepare('SELECT * FROM queues WHERE id = ?').get(token.queue_id);
    const ahead = db.prepare(`
      SELECT COUNT(*) as count FROM tokens
      WHERE queue_id = ? AND status = 'waiting' AND position < ?
    `).get(token.queue_id, token.position);

    res.json({ success: true, data: { token, queue, peopleAhead: ahead.count } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/tokens — create a new token
router.post('/', (req, res) => {
  try {
    const {
      queue_id, user_name, phone, request_text,
      service_type, urgency = 'medium', request_category = 'walk-in',
      estimated_service_duration = 10, notes
    } = req.body;

    if (!queue_id || !user_name) {
      return res.status(400).json({ success: false, error: 'queue_id and user_name are required' });
    }

    const queue = db.prepare('SELECT * FROM queues WHERE id = ?').get(queue_id);
    if (!queue) return res.status(404).json({ success: false, error: 'Queue not found' });

    // Generate token number
    const lastToken = db.prepare(`
      SELECT token_number FROM tokens WHERE queue_id = ? ORDER BY created_at DESC LIMIT 1
    `).get(queue_id);

    let nextNum = 1;
    if (lastToken) {
      const match = lastToken.token_number.match(/(\d+)$/);
      if (match) nextNum = parseInt(match[1]) + 1;
    }
    const token_number = `${queue.token_prefix}-${String(nextNum).padStart(3, '0')}`;

    // Priority map
    const priorityMap = { high: 3, medium: 2, low: 1 };
    const priority = priorityMap[urgency] || 2;

    // Get current position (after all waiting high-priority tokens)
    const waitingCount = db.prepare(`
      SELECT COUNT(*) as c FROM tokens WHERE queue_id = ? AND status = 'waiting'
    `).get(queue_id).c;

    const id = uuidv4();
    db.prepare(`
      INSERT INTO tokens (
        id, queue_id, token_number, user_name, phone, request_text,
        service_type, urgency, request_category, estimated_service_duration,
        notes, priority, status, estimated_wait_time, position
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, 'waiting', ?, ?
      )
    `).run(
      id, queue_id, token_number, user_name, phone || null, request_text || null,
      service_type || null, urgency, request_category, estimated_service_duration,
      notes || null, priority, (waitingCount + 1) * queue.avg_service_time, waitingCount + 1
    );

    recalculateQueue(queue_id);

    const token = db.prepare('SELECT * FROM tokens WHERE id = ?').get(id);

    // Emit socket event
    if (io) {
      io.to(queue_id).emit('queue:updated', { queue_id });
    }

    res.status(201).json({ success: true, data: token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/tokens/:queueId/next — call next token (provider action)
router.post('/queue/:queueId/next', (req, res) => {
  try {
    const { queueId } = req.params;

    // Mark current in-progress as done
    db.prepare(`
      UPDATE tokens SET status = 'done', updated_at = datetime('now')
      WHERE queue_id = ? AND status = 'in-progress'
    `).run(queueId);

    // Get next waiting token (sorted by priority DESC, created_at ASC)
    const next = db.prepare(`
      SELECT * FROM tokens WHERE queue_id = ? AND status = 'waiting'
      ORDER BY priority DESC, created_at ASC LIMIT 1
    `).get(queueId);

    if (!next) {
      recalculateQueue(queueId);
      if (io) io.to(queueId).emit('queue:updated', { queue_id: queueId, message: 'Queue is now empty' });
      return res.json({ success: true, data: null, message: 'No more tokens in queue' });
    }

    // Move next to in-progress
    db.prepare(`
      UPDATE tokens SET status = 'in-progress', position = 0, estimated_wait_time = 0, updated_at = datetime('now')
      WHERE id = ?
    `).run(next.id);

    recalculateQueue(queueId);

    const updatedToken = db.prepare('SELECT * FROM tokens WHERE id = ?').get(next.id);

    // Emit events
    if (io) {
      io.to(queueId).emit('token:called', { token: updatedToken });
      io.to(queueId).emit('queue:updated', { queue_id: queueId });
      // Notify the specific user
      io.to(`token:${next.id}`).emit('your:turn', { token: updatedToken });
    }

    res.json({ success: true, data: updatedToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/tokens/:id/status — update token status
router.patch('/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    if (!['waiting', 'in-progress', 'done', 'skipped'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const token = db.prepare('SELECT * FROM tokens WHERE id = ?').get(req.params.id);
    if (!token) return res.status(404).json({ success: false, error: 'Token not found' });

    db.prepare(`
      UPDATE tokens SET status = ?, updated_at = datetime('now') WHERE id = ?
    `).run(status, req.params.id);

    recalculateQueue(token.queue_id);

    const updated = db.prepare('SELECT * FROM tokens WHERE id = ?').get(req.params.id);

    if (io) {
      io.to(token.queue_id).emit('queue:updated', { queue_id: token.queue_id });
      if (status === 'in-progress') {
        io.to(`token:${token.id}`).emit('your:turn', { token: updated });
      }
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/tokens/:queueId/skip — skip current token
router.post('/queue/:queueId/skip', (req, res) => {
  try {
    const { queueId } = req.params;

    const current = db.prepare(`
      SELECT * FROM tokens WHERE queue_id = ? AND status = 'in-progress' LIMIT 1
    `).get(queueId);

    if (!current) {
      return res.status(404).json({ success: false, error: 'No token currently being served' });
    }

    // Mark as skipped and re-queue at end
    db.prepare(`
      UPDATE tokens SET status = 'skipped', updated_at = datetime('now') WHERE id = ?
    `).run(current.id);

    // Call next
    const next = db.prepare(`
      SELECT * FROM tokens WHERE queue_id = ? AND status = 'waiting'
      ORDER BY priority DESC, created_at ASC LIMIT 1
    `).get(queueId);

    if (next) {
      db.prepare(`
        UPDATE tokens SET status = 'in-progress', position = 0, estimated_wait_time = 0, updated_at = datetime('now')
        WHERE id = ?
      `).run(next.id);
      if (io) {
        io.to(`token:${next.id}`).emit('your:turn', { token: next });
      }
    }

    recalculateQueue(queueId);

    if (io) io.to(queueId).emit('queue:updated', { queue_id: queueId });

    res.json({ success: true, message: 'Token skipped', nextToken: next || null });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/tokens/queue/:queueId — get all tokens for a queue
router.get('/queue/:queueId', (req, res) => {
  try {
    const tokens = db.prepare(`
      SELECT * FROM tokens WHERE queue_id = ?
      ORDER BY
        CASE status WHEN 'in-progress' THEN 0 WHEN 'waiting' THEN 1 ELSE 2 END,
        priority DESC, created_at ASC
    `).all(req.params.queueId);

    const stats = db.prepare(`
      SELECT
        COUNT(CASE WHEN status = 'waiting' THEN 1 END) as waiting,
        COUNT(CASE WHEN status = 'in-progress' THEN 1 END) as serving,
        COUNT(CASE WHEN status = 'done' THEN 1 END) as done,
        COUNT(CASE WHEN status = 'skipped' THEN 1 END) as skipped
      FROM tokens WHERE queue_id = ?
    `).get(req.params.queueId);

    res.json({ success: true, data: { tokens, stats } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
