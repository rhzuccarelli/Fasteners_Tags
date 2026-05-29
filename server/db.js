const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'fasteners.db');

const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS standards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    drawing_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS fasteners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metric TEXT NOT NULL,
    length_mm REAL,
    standard_id INTEGER REFERENCES standards(id),
    tool_type TEXT NOT NULL DEFAULT 'Other',
    quantity INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS boxes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    size TEXT NOT NULL DEFAULT 'SMALL',
    divisions INTEGER NOT NULL DEFAULT 1,
    location TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS box_slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    box_id INTEGER NOT NULL REFERENCES boxes(id) ON DELETE CASCADE,
    slot_index INTEGER NOT NULL,
    fastener_id INTEGER REFERENCES fasteners(id) ON DELETE SET NULL,
    UNIQUE(box_id, slot_index)
  );
`);

// Seed standards (INSERT OR IGNORE so re-runs are safe)
const seedStandards = db.prepare(
  'INSERT OR IGNORE INTO standards (code, description) VALUES (?, ?)'
);

const standardsData = [
  ['DIN 912',  'Socket Head Cap Screw'],
  ['DIN 7991', 'Countersunk Socket Screw'],
  ['ISO 7046', 'Countersunk Phillips Screw'],
  ['DIN 7051', 'Chipboard Screw'],
  ['DIN 7997', 'Countersunk Wood Screw'],
  ['ISO 4035', 'Thin Hexagon Nut'],
  ['DIN 6796', 'Conical Spring Washer'],
];

const seedMany = db.transaction((rows) => {
  for (const [code, description] of rows) {
    seedStandards.run(code, description);
  }
});

seedMany(standardsData);

module.exports = db;
