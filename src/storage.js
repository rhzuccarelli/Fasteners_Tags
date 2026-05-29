// localStorage-backed data layer — no server required

const KEYS = { standards: 'ft_standards', fasteners: 'ft_fasteners', boxes: 'ft_boxes' };

const SEED = [
  { code: 'DIN 912',  description: 'Socket Head Cap Screw' },
  { code: 'DIN 7991', description: 'Countersunk Socket Screw' },
  { code: 'ISO 7046', description: 'Countersunk Phillips Screw' },
  { code: 'DIN 7051', description: 'Chipboard Screw' },
  { code: 'DIN 7997', description: 'Countersunk Wood Screw' },
  { code: 'ISO 4035', description: 'Thin Hexagon Nut' },
  { code: 'DIN 6796', description: 'Conical Spring Washer' },
];

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function load(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}

function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Seed on first load
if (!load(KEYS.standards)) {
  save(KEYS.standards, SEED.map(s => ({
    id: genId(), ...s, drawingDataUrl: null, createdAt: new Date().toISOString(),
  })));
}
if (!load(KEYS.fasteners)) save(KEYS.fasteners, []);
if (!load(KEYS.boxes))     save(KEYS.boxes, []);

// ── Standards ──────────────────────────────────────────────────────────────
export const standardsDb = {
  getAll:   () => load(KEYS.standards) || [],
  getMap:   function() { return Object.fromEntries(this.getAll().map(s => [s.id, s])); },

  add(data) {
    const items = this.getAll();
    if (items.some(i => i.code === data.code)) throw new Error(`"${data.code}" already exists`);
    const item = { id: genId(), ...data, drawingDataUrl: null, createdAt: new Date().toISOString() };
    save(KEYS.standards, [...items, item]);
    return item;
  },

  update(id, data) {
    const items = this.getAll();
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) throw new Error('Not found');
    items[idx] = { ...items[idx], ...data };
    save(KEYS.standards, items);
    return items[idx];
  },

  delete(id) {
    save(KEYS.standards, this.getAll().filter(i => i.id !== id));
    // Clear from fasteners
    const fs = load(KEYS.fasteners) || [];
    save(KEYS.fasteners, fs.map(f => f.standardId === id ? { ...f, standardId: null } : f));
  },
};

// ── Fasteners ──────────────────────────────────────────────────────────────
export const fastenersDb = {
  getAll:   () => load(KEYS.fasteners) || [],
  getMap:   function() { return Object.fromEntries(this.getAll().map(f => [f.id, f])); },

  add(data) {
    const items = this.getAll();
    const item = { id: genId(), ...data, createdAt: new Date().toISOString() };
    save(KEYS.fasteners, [...items, item]);
    return item;
  },

  update(id, data) {
    const items = this.getAll();
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) throw new Error('Not found');
    items[idx] = { ...items[idx], ...data };
    save(KEYS.fasteners, items);
    return items[idx];
  },

  delete(id) {
    save(KEYS.fasteners, this.getAll().filter(i => i.id !== id));
    // Clear from box slots
    const boxes = load(KEYS.boxes) || [];
    save(KEYS.boxes, boxes.map(b => ({
      ...b,
      slots: b.slots.map(s => s.fastenerId === id ? { ...s, fastenerId: null } : s),
    })));
  },
};

// ── Boxes ──────────────────────────────────────────────────────────────────
export const boxesDb = {
  getAll: () => load(KEYS.boxes) || [],

  add(data) {
    const items = this.getAll();
    const divisions = data.divisions || 1;
    const slots = Array.from({ length: divisions }, (_, i) => ({ slotIndex: i, fastenerId: null }));
    const item = { id: genId(), ...data, slots, createdAt: new Date().toISOString() };
    save(KEYS.boxes, [...items, item]);
    return item;
  },

  update(id, data) {
    const items = this.getAll();
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) throw new Error('Not found');
    let slots = items[idx].slots || [];
    if (data.divisions !== undefined && data.divisions !== items[idx].divisions) {
      const n = data.divisions;
      if (n > slots.length) {
        for (let i = slots.length; i < n; i++) slots.push({ slotIndex: i, fastenerId: null });
      } else {
        slots = slots.slice(0, n);
      }
    }
    items[idx] = { ...items[idx], ...data, slots };
    save(KEYS.boxes, items);
    return items[idx];
  },

  setSlot(id, slotIndex, fastenerId) {
    const items = this.getAll();
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) throw new Error('Not found');
    items[idx].slots = items[idx].slots.map(s =>
      s.slotIndex === slotIndex ? { ...s, fastenerId: fastenerId || null } : s
    );
    save(KEYS.boxes, items);
    return items[idx];
  },

  delete(id) {
    save(KEYS.boxes, this.getAll().filter(i => i.id !== id));
  },
};

// ── JSON backup/restore ───────────────────────────────────────────────────
export function exportJSON() {
  const data = {
    standards: load(KEYS.standards) || [],
    fasteners: load(KEYS.fasteners) || [],
    boxes:     load(KEYS.boxes)     || [],
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `fasteners-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.standards) save(KEYS.standards, data.standards);
        if (data.fasteners) save(KEYS.fasteners, data.fasteners);
        if (data.boxes)     save(KEYS.boxes,     data.boxes);
        resolve();
      } catch (err) {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.readAsText(file);
  });
}

// ── Image resize helper ────────────────────────────────────────────────────
export function resizeImageFile(file, maxPx = 180) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const ratio = Math.min(maxPx / img.width, maxPx / img.height, 1);
        const w = Math.round(img.width * ratio);
        const h = Math.round(img.height * ratio);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}
