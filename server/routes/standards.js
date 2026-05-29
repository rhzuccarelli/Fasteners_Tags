const express = require('express');
const path    = require('path');
const fs      = require('fs');
const { spawn } = require('child_process');
const multer  = require('multer');
const db      = require('../db');

const router = express.Router();

// Multer — store raw upload temporarily in uploads/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', '..', 'uploads');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${req.params.id}_original${ext}`);
  },
});
const upload = multer({ storage });

// ─── GET /api/standards ───────────────────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const standards = db.prepare('SELECT * FROM standards ORDER BY code ASC').all();
    res.json(standards);
  } catch (err) {
    console.error('GET /standards error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/standards/:id ───────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  try {
    const standard = db.prepare('SELECT * FROM standards WHERE id = ?').get(req.params.id);
    if (!standard) return res.status(404).json({ error: 'Standard not found' });
    res.json(standard);
  } catch (err) {
    console.error('GET /standards/:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/standards ──────────────────────────────────────────────────────
router.post('/', (req, res) => {
  try {
    const { code, description, drawing_path } = req.body;
    if (!code) return res.status(400).json({ error: 'code is required' });

    const stmt = db.prepare(
      'INSERT INTO standards (code, description, drawing_path) VALUES (?, ?, ?)'
    );
    const result = stmt.run(code, description || null, drawing_path || null);
    const created = db.prepare('SELECT * FROM standards WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: `Standard code "${req.body.code}" already exists` });
    }
    console.error('POST /standards error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/standards/:id ───────────────────────────────────────────────────
router.put('/:id', (req, res) => {
  try {
    const { code, description, drawing_path } = req.body;
    const existing = db.prepare('SELECT * FROM standards WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Standard not found' });

    db.prepare(
      `UPDATE standards SET
        code         = COALESCE(?, code),
        description  = COALESCE(?, description),
        drawing_path = COALESCE(?, drawing_path)
       WHERE id = ?`
    ).run(code || null, description || null, drawing_path || null, req.params.id);

    const updated = db.prepare('SELECT * FROM standards WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: `Standard code "${req.body.code}" already exists` });
    }
    console.error('PUT /standards/:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/standards/:id ────────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM standards WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Standard not found' });

    db.prepare('DELETE FROM standards WHERE id = ?').run(req.params.id);
    res.json({ message: 'Standard deleted', id: Number(req.params.id) });
  } catch (err) {
    console.error('DELETE /standards/:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/standards/:id/drawing ─────────────────────────────────────────
router.post('/:id/drawing', upload.single('drawing'), async (req, res) => {
  try {
    const { id } = req.params;

    const standard = db.prepare('SELECT * FROM standards WHERE id = ?').get(id);
    if (!standard) return res.status(404).json({ error: 'Standard not found' });

    if (!req.file) return res.status(400).json({ error: 'No file uploaded (field name: drawing)' });

    const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
    const inputPath  = req.file.path;
    const outputPath = path.join(uploadsDir, `${id}.png`);
    const ext        = path.extname(req.file.originalname).toLowerCase();

    // Decide if we can attempt conversion
    const convertibleExts = ['.dxf', '.pdf', '.png', '.jpg', '.jpeg'];
    const shouldConvert   = convertibleExts.includes(ext) && ext !== '.png';

    if (!shouldConvert) {
      // Already a PNG or unrecognised — just use as-is
      const servePath = `/uploads/${path.basename(inputPath)}`;
      db.prepare('UPDATE standards SET drawing_path = ? WHERE id = ?').run(servePath, id);
      const updated = db.prepare('SELECT * FROM standards WHERE id = ?').get(id);
      return res.json(updated);
    }

    // Spawn Python converter
    const convertScript = path.join(__dirname, '..', '..', 'scripts', 'convert_drawing.py');
    const py = spawn('python3', [convertScript, inputPath, outputPath]);

    let stderr = '';
    py.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

    py.on('close', (code) => {
      let drawingPath;

      if (code === 0 && fs.existsSync(outputPath)) {
        // Conversion succeeded
        drawingPath = `/uploads/${id}.png`;
      } else {
        // Conversion failed — fall back to original file
        console.warn(`Drawing conversion failed (exit ${code}): ${stderr}`);
        // Only serve original if it's a usable image format
        const imgExts = ['.jpg', '.jpeg', '.gif', '.bmp', '.webp'];
        if (imgExts.includes(ext)) {
          drawingPath = `/uploads/${path.basename(inputPath)}`;
        } else {
          drawingPath = null;
        }
      }

      if (drawingPath) {
        db.prepare('UPDATE standards SET drawing_path = ? WHERE id = ?').run(drawingPath, id);
      }

      const updated = db.prepare('SELECT * FROM standards WHERE id = ?').get(id);
      res.json(updated);
    });

    py.on('error', (spawnErr) => {
      // python3 not available — fall back gracefully
      console.warn('Could not spawn python3:', spawnErr.message);
      const imgExts = ['.jpg', '.jpeg', '.gif', '.bmp', '.webp'];
      let drawingPath = null;
      if (imgExts.includes(ext)) {
        drawingPath = `/uploads/${path.basename(inputPath)}`;
      }
      if (drawingPath) {
        db.prepare('UPDATE standards SET drawing_path = ? WHERE id = ?').run(drawingPath, id);
      }
      const updated = db.prepare('SELECT * FROM standards WHERE id = ?').get(id);
      res.json(updated);
    });
  } catch (err) {
    console.error('POST /standards/:id/drawing error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
