const express = require('express');
const db = require('../db');

const router = express.Router();

// ─── GET /api/fasteners ───────────────────────────────────────────────────────
// Query params: metric, standard_id, tool_type
router.get('/', (req, res) => {
  try {
    const { metric, standard_id, tool_type } = req.query;

    const conditions = [];
    const params     = [];

    if (metric) {
      conditions.push('f.metric LIKE ?');
      params.push(`%${metric}%`);
    }
    if (standard_id) {
      conditions.push('f.standard_id = ?');
      params.push(Number(standard_id));
    }
    if (tool_type) {
      conditions.push('f.tool_type = ?');
      params.push(tool_type);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT
        f.*,
        s.code         AS standard_code,
        s.description  AS standard_description,
        s.drawing_path AS drawing_path
      FROM fasteners f
      LEFT JOIN standards s ON f.standard_id = s.id
      ${where}
      ORDER BY f.metric ASC, f.length_mm ASC
    `;

    const fasteners = db.prepare(sql).all(...params);
    res.json(fasteners);
  } catch (err) {
    console.error('GET /fasteners error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/fasteners/:id ───────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  try {
    const fastener = db.prepare(`
      SELECT
        f.*,
        s.code         AS standard_code,
        s.description  AS standard_description,
        s.drawing_path AS drawing_path
      FROM fasteners f
      LEFT JOIN standards s ON f.standard_id = s.id
      WHERE f.id = ?
    `).get(req.params.id);

    if (!fastener) return res.status(404).json({ error: 'Fastener not found' });
    res.json(fastener);
  } catch (err) {
    console.error('GET /fasteners/:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/fasteners ──────────────────────────────────────────────────────
router.post('/', (req, res) => {
  try {
    const { metric, length_mm, standard_id, tool_type, quantity, notes } = req.body;

    if (!metric) return res.status(400).json({ error: 'metric is required' });

    const stmt = db.prepare(`
      INSERT INTO fasteners (metric, length_mm, standard_id, tool_type, quantity, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      metric,
      length_mm != null ? Number(length_mm) : null,
      standard_id != null ? Number(standard_id) : null,
      tool_type || 'Other',
      quantity != null ? Number(quantity) : 0,
      notes || null
    );

    const created = db.prepare(`
      SELECT f.*, s.code AS standard_code, s.description AS standard_description, s.drawing_path
      FROM fasteners f
      LEFT JOIN standards s ON f.standard_id = s.id
      WHERE f.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(created);
  } catch (err) {
    console.error('POST /fasteners error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/fasteners/:id ───────────────────────────────────────────────────
router.put('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM fasteners WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Fastener not found' });

    const {
      metric      = existing.metric,
      length_mm   = existing.length_mm,
      standard_id = existing.standard_id,
      tool_type   = existing.tool_type,
      quantity    = existing.quantity,
      notes       = existing.notes,
    } = req.body;

    db.prepare(`
      UPDATE fasteners
      SET metric = ?, length_mm = ?, standard_id = ?, tool_type = ?, quantity = ?, notes = ?
      WHERE id = ?
    `).run(
      metric,
      length_mm != null ? Number(length_mm) : null,
      standard_id != null ? Number(standard_id) : null,
      tool_type,
      Number(quantity),
      notes || null,
      req.params.id
    );

    const updated = db.prepare(`
      SELECT f.*, s.code AS standard_code, s.description AS standard_description, s.drawing_path
      FROM fasteners f
      LEFT JOIN standards s ON f.standard_id = s.id
      WHERE f.id = ?
    `).get(req.params.id);

    res.json(updated);
  } catch (err) {
    console.error('PUT /fasteners/:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/fasteners/:id ────────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM fasteners WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Fastener not found' });

    db.prepare('DELETE FROM fasteners WHERE id = ?').run(req.params.id);
    res.json({ message: 'Fastener deleted', id: Number(req.params.id) });
  } catch (err) {
    console.error('DELETE /fasteners/:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
