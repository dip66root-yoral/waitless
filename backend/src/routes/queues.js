const express = require('express');
const router = express.Router();
const { db } = require('../db');

// GET /api/queues — list all queues with live stats
router.get('/', (req, res) => {
  try {
    const queues = db.prepare('SELECT * FROM queues WHERE status != ? ORDER BY created_at ASC').all('closed');

    const enriched = queues.map(q => {
      const stats = db.prepare(`
        SELECT
          COUNT(CASE WHEN status = 'waiting' THEN 1 END) as waiting_count,
          COUNT(CASE WHEN status = 'in-progress' THEN 1 END) as serving_count,
          COUNT(CASE WHEN status = 'done' THEN 1 END) as done_count,
          COUNT(*) as total_count
        FROM tokens WHERE queue_id = ?
      `).get(q.id);

      const currentServing = db.prepare(`
        SELECT * FROM tokens WHERE queue_id = ? AND status = 'in-progress'
        ORDER BY updated_at DESC LIMIT 1
      `).get(q.id);

      return { ...q, stats, currentServing };
    });

    res.json({ success: true, data: enriched });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/queues/:id — single queue detail
router.get('/:id', (req, res) => {
  try {
    const queue = db.prepare('SELECT * FROM queues WHERE id = ?').get(req.params.id);
    if (!queue) return res.status(404).json({ success: false, error: 'Queue not found' });

    const tokens = db.prepare(`
      SELECT * FROM tokens WHERE queue_id = ?
      ORDER BY 
        CASE status WHEN 'in-progress' THEN 0 WHEN 'waiting' THEN 1 ELSE 2 END,
        priority DESC,
        created_at ASC
    `).all(req.params.id);

    res.json({ success: true, data: { queue, tokens } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/queues — create new queue
router.post('/', (req, res) => {
  try {
    const { v4: uuidv4 } = require('uuid');
    const { service_name, description, token_prefix, avg_service_time } = req.body;
    if (!service_name) return res.status(400).json({ success: false, error: 'service_name is required' });

    const id = uuidv4();
    db.prepare(`
      INSERT INTO queues (id, service_name, description, token_prefix, avg_service_time)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, service_name, description || '', token_prefix || 'X', avg_service_time || 10);

    const queue = db.prepare('SELECT * FROM queues WHERE id = ?').get(id);
    res.status(201).json({ success: true, data: queue });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/queues/:id/status — update queue status
router.patch('/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'paused', 'closed'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }
    db.prepare(`UPDATE queues SET status = ?, updated_at = datetime('now') WHERE id = ?`)
      .run(status, req.params.id);
    const queue = db.prepare('SELECT * FROM queues WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: queue });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
