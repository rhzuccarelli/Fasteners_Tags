const express = require('express');
const db = require('../db');

const router = express.Router();

// ─── Helper: fetch a box with its populated slots ─────────────────────────────
function getBoxWithSlots(boxId) {
  const box = db.prepare('SELECT * FROM boxes WHERE id = ?').get(boxId);
  if (!box) return null;

  const slots = db.prepare(`
    SELECT
      bs.id,
      bs.box_id,
      bs.slot_index,
      bs.fastener_id,
      f.metric,
      f.length_mm,
      f.tool_type,
      f.quantity,
      f.notes         AS fastener_notes,
      s.code          AS standard_code,
      s.description   AS standard_description,
      s.drawing_path  AS drawing_path
    FROM box_slots bs
    LEFT JOIN fasteners f ON bs.fastener_id = f.id
    LEFT JOIN standards s ON f.standard_id  = s.id
    WHERE bs.box_id = ?
    ORDER BY bs.slot_index ASC
  `).all(boxId);

  return { ...box, slots };
}

// ─── GET /api/boxes ───────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const boxes = db.prepare('SELECT * FROM boxes ORDER BY name ASC').all();
    const result = boxes.map((b) => getBoxWithSlots(b.id));
    res.json(result);
  } catch (err) {
    console.error('GET /boxes error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/boxes/:id ───────────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  try {
    const box = getBoxWithSlots(req.params.id);
    if (!box) return res.status(404).json({ error: 'Box not found' });
    res.json(box);
  } catch (err) {
    console.error('GET /boxes/:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/boxes ──────────────────────────────────────────────────────────
router.post('/', (req, res) => {
  try {
    const { name, size, divisions, location, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const divCount = divisions != null ? Math.max(1, Number(divisions)) : 1;

    const createBox = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO boxes (name, size, divisions, location, notes)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        name,
        size || 'SMALL',
        divCount,
        location || null,
        notes || null
      );

      const boxId = result.lastInsertRowid;

      const insertSlot = db.prepare(
        'INSERT INTO box_slots (box_id, slot_index, fastener_id) VALUES (?, ?, NULL)'
      );
      for (let i = 0; i < divCount; i++) {
        insertSlot.run(boxId, i);
      }

      return boxId;
    });

    const newId = createBox();
    const box   = getBoxWithSlots(newId);
    res.status(201).json(box);
  } catch (err) {
    console.error('POST /boxes error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/boxes/:id ───────────────────────────────────────────────────────
router.put('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM boxes WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Box not found' });

    const {
      name      = existing.name,
      size      = existing.size,
      divisions,
      location  = existing.location,
      notes     = existing.notes,
    } = req.body;

    const newDivCount = divisions != null ? Math.max(1, Number(divisions)) : existing.divisions;

    const updateBox = db.transaction(() => {
      db.prepare(`
        UPDATE boxes SET name = ?, size = ?, divisions = ?, location = ?, notes = ?
        WHERE id = ?
      `).run(name, size, newDivCount, location || null, notes || null, req.params.id);

      if (newDivCount !== existing.divisions) {
        if (newDivCount > existing.divisions) {
          // Add missing slots
          const insertSlot = db.prepare(
            'INSERT OR IGNORE INTO box_slots (box_id, slot_index, fastener_id) VALUES (?, ?, NULL)'
          );
          for (let i = existing.divisions; i < newDivCount; i++) {
            insertSlot.run(req.params.id, i);
          }
        } else {
          // Remove excess slots (highest indices first)
          db.prepare(
            'DELETE FROM box_slots WHERE box_id = ? AND slot_index >= ?'
          ).run(req.params.id, newDivCount);
        }
      }
    });

    updateBox();
    const updated = getBoxWithSlots(req.params.id);
    res.json(updated);
  } catch (err) {
    console.error('PUT /boxes/:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/boxes/:id ────────────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM boxes WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Box not found' });

    // box_slots will cascade-delete due to ON DELETE CASCADE
    db.prepare('DELETE FROM boxes WHERE id = ?').run(req.params.id);
    res.json({ message: 'Box deleted', id: Number(req.params.id) });
  } catch (err) {
    console.error('DELETE /boxes/:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/boxes/:boxId/slots/:slotIndex ───────────────────────────────────
// Body: { fastener_id } — null to unassign
router.put('/:boxId/slots/:slotIndex', (req, res) => {
  try {
    const { boxId, slotIndex } = req.params;
    const { fastener_id } = req.body;

    const box = db.prepare('SELECT * FROM boxes WHERE id = ?').get(boxId);
    if (!box) return res.status(404).json({ error: 'Box not found' });

    const slot = db.prepare(
      'SELECT * FROM box_slots WHERE box_id = ? AND slot_index = ?'
    ).get(boxId, Number(slotIndex));

    if (!slot) return res.status(404).json({ error: `Slot ${slotIndex} not found in box` });

    // Validate fastener_id if provided
    if (fastener_id != null) {
      const fastener = db.prepare('SELECT id FROM fasteners WHERE id = ?').get(Number(fastener_id));
      if (!fastener) return res.status(404).json({ error: 'Fastener not found' });
    }

    db.prepare(
      'UPDATE box_slots SET fastener_id = ? WHERE box_id = ? AND slot_index = ?'
    ).run(
      fastener_id != null ? Number(fastener_id) : null,
      Number(boxId),
      Number(slotIndex)
    );

    const updatedBox = getBoxWithSlots(boxId);
    res.json(updatedBox);
  } catch (err) {
    console.error('PUT /boxes/:boxId/slots/:slotIndex error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
