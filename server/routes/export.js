const express = require('express');
const path    = require('path');
const fs      = require('fs');
const { spawn } = require('child_process');
const db      = require('../db');

const router = express.Router();

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

// ─── Helper: read a PNG file and base64-encode it ─────────────────────────────
function encodeDrawing(drawingPath) {
  if (!drawingPath) return null;

  // drawingPath is a URL path like /uploads/1.png — resolve to filesystem path
  const relativePart = drawingPath.startsWith('/')
    ? drawingPath.slice(1)          // strip leading slash → uploads/1.png
    : drawingPath;

  const absPath = path.join(__dirname, '..', '..', relativePart);

  try {
    if (fs.existsSync(absPath)) {
      return fs.readFileSync(absPath).toString('base64');
    }
  } catch (_) {
    // ignore read errors — drawing simply won't be embedded
  }
  return null;
}

// ─── Helper: build tag objects for a list of fastener rows ───────────────────
function buildFastenerTags(fasteners) {
  return fasteners.map((f) => ({
    metric:        f.metric,
    length_mm:     f.length_mm,
    standard_code: f.standard_code || null,
    tool_type:     f.tool_type,
    quantity:      f.quantity,
    drawing_path:  f.drawing_path || null,
    drawing_b64:   encodeDrawing(f.drawing_path),
  }));
}

// ─── Helper: fetch fasteners with standards ───────────────────────────────────
function fetchFastenersWithStandards(ids) {
  const placeholders = ids.map(() => '?').join(', ');
  return db.prepare(`
    SELECT
      f.*,
      s.code         AS standard_code,
      s.description  AS standard_description,
      s.drawing_path AS drawing_path
    FROM fasteners f
    LEFT JOIN standards s ON f.standard_id = s.id
    WHERE f.id IN (${placeholders})
    ORDER BY f.metric ASC, f.length_mm ASC
  `).all(...ids);
}

// ─── Helper: fetch all fasteners with standards ───────────────────────────────
function fetchAllFasteners() {
  return db.prepare(`
    SELECT
      f.*,
      s.code         AS standard_code,
      s.description  AS standard_description,
      s.drawing_path AS drawing_path
    FROM fasteners f
    LEFT JOIN standards s ON f.standard_id = s.id
    ORDER BY f.metric ASC, f.length_mm ASC
  `).all();
}

// ─── Helper: build tag objects for a list of box rows ────────────────────────
function buildBoxTags(boxes) {
  return boxes.map((box) => {
    const slots = db.prepare(`
      SELECT
        bs.slot_index,
        bs.fastener_id,
        f.metric,
        f.length_mm,
        f.tool_type,
        f.quantity,
        s.code         AS standard_code,
        s.description  AS standard_description,
        s.drawing_path AS drawing_path
      FROM box_slots bs
      LEFT JOIN fasteners  f ON bs.fastener_id = f.id
      LEFT JOIN standards  s ON f.standard_id  = s.id
      WHERE bs.box_id = ?
      ORDER BY bs.slot_index ASC
    `).all(box.id);

    return {
      box_id:    box.id,
      box_name:  box.name,
      box_size:  box.size,
      location:  box.location || null,
      divisions: box.divisions,
      slots: slots.map((sl) => ({
        slot_index:    sl.slot_index,
        fastener_id:   sl.fastener_id || null,
        metric:        sl.metric       || null,
        length_mm:     sl.length_mm    || null,
        tool_type:     sl.tool_type    || null,
        quantity:      sl.quantity     || null,
        standard_code: sl.standard_code || null,
        drawing_path:  sl.drawing_path  || null,
        drawing_b64:   encodeDrawing(sl.drawing_path),
      })),
    };
  });
}

// ─── Helper: fetch boxes by ids (or all) ─────────────────────────────────────
function fetchBoxes(ids) {
  if (ids && ids.length > 0) {
    const placeholders = ids.map(() => '?').join(', ');
    return db.prepare(
      `SELECT * FROM boxes WHERE id IN (${placeholders}) ORDER BY name ASC`
    ).all(...ids);
  }
  return db.prepare('SELECT * FROM boxes ORDER BY name ASC').all();
}

// ─── POST /api/export/tags ────────────────────────────────────────────────────
// Body: { type: "fasteners" | "boxes" | "selected", ids: [...] }
// Spawns python3 scripts/generate_tags.py, writes JSON to stdin, reads PDF from stdout.
router.post('/tags', (req, res) => {
  try {
    const { type = 'fasteners', ids = [] } = req.body;

    let payload;

    if (type === 'boxes') {
      // Export one or all boxes
      const boxes = fetchBoxes(ids && ids.length > 0 ? ids.map(Number) : []);
      payload = {
        type: 'box',
        tags: buildBoxTags(boxes),
      };
    } else if (type === 'selected' && ids && ids.length > 0) {
      // Export specific fasteners by id
      const fasteners = fetchFastenersWithStandards(ids.map(Number));
      payload = {
        type: 'single',
        tags: buildFastenerTags(fasteners),
      };
    } else {
      // Export all fasteners
      const fasteners = fetchAllFasteners();
      payload = {
        type: 'single',
        tags: buildFastenerTags(fasteners),
      };
    }

    const payloadStr = JSON.stringify(payload);
    const scriptPath = path.join(__dirname, '..', '..', 'scripts', 'generate_tags.py');

    const py = spawn('python3', [scriptPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const pdfChunks = [];
    let stderrBuf   = '';

    py.stdout.on('data', (chunk) => pdfChunks.push(chunk));
    py.stderr.on('data', (chunk) => { stderrBuf += chunk.toString(); });

    py.on('error', (spawnErr) => {
      console.error('Failed to spawn generate_tags.py:', spawnErr.message);
      if (!res.headersSent) {
        res.status(500).json({
          error: 'PDF generation unavailable — python3/generate_tags.py not found',
          detail: spawnErr.message,
        });
      }
    });

    py.on('close', (code) => {
      if (res.headersSent) return;

      if (code !== 0) {
        console.error(`generate_tags.py exited with code ${code}:\n${stderrBuf}`);
        return res.status(500).json({
          error: 'PDF generation failed',
          detail: stderrBuf,
        });
      }

      const pdfBuffer = Buffer.concat(pdfChunks);

      if (pdfBuffer.length === 0) {
        return res.status(500).json({
          error: 'PDF generation produced no output',
          detail: stderrBuf,
        });
      }

      res.set({
        'Content-Type':        'application/pdf',
        'Content-Disposition': 'attachment; filename="fastener-tags.pdf"',
        'Content-Length':      pdfBuffer.length,
      });
      res.end(pdfBuffer);
    });

    // Write payload JSON to stdin then close the pipe
    py.stdin.write(payloadStr);
    py.stdin.end();

  } catch (err) {
    console.error('POST /export/tags error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
});

module.exports = router;
