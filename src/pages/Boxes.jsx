import React, { useState, useMemo } from 'react';
import { boxesDb, standardsDb } from '../storage.js';
import BoxCard from '../components/BoxCard.jsx';
import BoxSlotVisualiser from '../components/BoxSlotVisualiser.jsx';

const METRICS = ['M2','M2.5','M3','M4','M5','M6','M8','M10','M12','M14','M16','M20','M24'];
const EMPTY = { name: '', standardId: '', divisions: 2, location: '', notes: '' };

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 modal-backdrop">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 modal-panel">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-mono font-bold text-charcoal text-base">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function SlotModal({ box, slotIndex, onSave, onClose }) {
  const slot = box.slots?.find(s => s.slotIndex === slotIndex) || {};
  const [metric, setMetric] = useState(slot.metric || 'M6');
  const [lengthMm, setLengthMm] = useState(slot.lengthMm ?? '');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 modal-backdrop">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xs mx-4 p-5 modal-panel">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-mono font-bold text-charcoal text-sm">Slot {slotIndex + 1}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div className="flex flex-col gap-3">
          <div>
            <label className="block font-mono text-xs text-gray-600 mb-1">Metric</label>
            <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
              value={metric} onChange={e => setMetric(e.target.value)}>
              {METRICS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block font-mono text-xs text-gray-600 mb-1">Length (mm)</label>
            <input type="number" min="0" step="0.5" placeholder="optional"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
              value={lengthMm} onChange={e => setLengthMm(e.target.value)} />
          </div>
          <div className="flex gap-3 justify-end pt-1">
            <button onClick={() => onSave(null)}
              className="px-3 py-1.5 text-xs font-mono rounded border border-red-200 text-red-600 hover:bg-red-50 transition-colors">
              Clear
            </button>
            <button onClick={() => onSave({ metric, lengthMm: lengthMm !== '' ? Number(lengthMm) : null })}
              className="px-4 py-1.5 text-sm font-mono font-medium rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors">
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Boxes() {
  const [boxes, setBoxes] = useState(() => boxesDb.getAll());
  const [standards] = useState(() => standardsDb.getAll());
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [slotTarget, setSlotTarget] = useState(null); // { box, slotIndex }
  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState('');

  const standardMap = useMemo(() => Object.fromEntries(standards.map(s => [s.id, s])), [standards]);

  function refresh() { setBoxes(boxesDb.getAll()); }
  function openAdd() { setForm(EMPTY); setFormError(''); setAddOpen(true); }
  function openEdit(b) {
    setForm({ name: b.name, standardId: b.standardId || '', divisions: b.divisions, location: b.location || '', notes: b.notes || '' });
    setFormError(''); setEditTarget(b);
  }

  function handleSave() {
    if (!form.name.trim()) { setFormError('Name is required.'); return; }
    const data = {
      name: form.name.trim(),
      standardId: form.standardId || null,
      divisions: Number(form.divisions),
      location: form.location.trim() || null,
      notes: form.notes.trim() || null,
    };
    try {
      if (editTarget) { boxesDb.update(editTarget.id, data); setEditTarget(null); }
      else { boxesDb.add(data); setAddOpen(false); }
      refresh();
    } catch (err) { setFormError(err.message); }
  }

  function handleDelete() { boxesDb.delete(deleteTarget.id); setDeleteTarget(null); refresh(); }

  function handleSlotSave(value) {
    const { box, slotIndex } = slotTarget;
    boxesDb.setSlot(box.id, slotIndex, value || { metric: null, lengthMm: null });
    setSlotTarget(null); refresh();
  }

  const formFields = (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block font-mono text-xs text-gray-600 mb-1">Name *</label>
        <input className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="e.g. M3 Socket Heads" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
      </div>
      <div>
        <label className="block font-mono text-xs text-gray-600 mb-1">Standard</label>
        <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
          value={form.standardId} onChange={e => setForm(f => ({ ...f, standardId: e.target.value }))}>
          <option value="">— none —</option>
          {standards.map(s => <option key={s.id} value={s.id}>{s.code} — {s.description}</option>)}
        </select>
      </div>
      <div>
        <label className="block font-mono text-xs text-gray-600 mb-2">Divisions</label>
        <div className="flex gap-2 mb-3">
          {[1,2,3,4,5,6].map(d => (
            <button key={d} type="button" onClick={() => setForm(f => ({ ...f, divisions: d }))}
              className={`flex-1 py-2 text-xs font-mono font-medium rounded border transition-colors ${
                form.divisions === d ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:bg-surface'}`}>
              {d}
            </button>
          ))}
        </div>
        <div className="flex justify-center">
          <BoxSlotVisualiser divisions={form.divisions} slots={[]} />
        </div>
      </div>
      <div>
        <label className="block font-mono text-xs text-gray-600 mb-1">Location</label>
        <input className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="e.g. Shelf 3" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
      </div>
      <div>
        <label className="block font-mono text-xs text-gray-600 mb-1">Notes</label>
        <textarea rows={2} className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none resize-none"
          value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
      </div>
      {formError && <p className="font-mono text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{formError}</p>}
      <div className="flex gap-3 justify-end">
        <button onClick={() => { setAddOpen(false); setEditTarget(null); }}
          className="px-4 py-2 text-sm font-mono rounded border border-gray-300 text-gray-700 hover:bg-surface transition-colors">Cancel</button>
        <button onClick={handleSave}
          className="px-4 py-2 text-sm font-mono font-medium rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors">
          {editTarget ? 'Save Changes' : 'Add Box'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-mono font-bold text-2xl text-charcoal tracking-wide">Box Organiser</h1>
          <p className="font-mono text-sm text-gray-400 mt-1">{boxes.length} box{boxes.length !== 1 ? 'es' : ''}</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-mono font-medium rounded-lg hover:bg-blue-700 transition-colors">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Add Box
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {boxes.map(box => (
          <BoxCard key={box.id} box={box} standardMap={standardMap}
            onEdit={openEdit} onDelete={setDeleteTarget}
            onSlotClick={(b, i) => setSlotTarget({ box: b, slotIndex: i })} />
        ))}
        {boxes.length === 0 && (
          <div className="col-span-full text-center py-16 text-gray-400 font-mono text-sm">
            No boxes yet. Add one to organise your fasteners.
          </div>
        )}
      </div>

      {addOpen && <Modal title="Add Box" onClose={() => setAddOpen(false)}>{formFields}</Modal>}
      {editTarget && <Modal title={`Edit — ${editTarget.name}`} onClose={() => setEditTarget(null)}>{formFields}</Modal>}
      {deleteTarget && (
        <Modal title="Delete Box?" onClose={() => setDeleteTarget(null)}>
          <p className="font-mono text-sm text-gray-600 mb-6">Delete <strong>{deleteTarget.name}</strong>?</p>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm font-mono rounded border border-gray-300 text-gray-700 hover:bg-surface transition-colors">Cancel</button>
            <button onClick={handleDelete} className="px-4 py-2 text-sm font-mono font-medium rounded bg-red-600 text-white hover:bg-red-700 transition-colors">Delete</button>
          </div>
        </Modal>
      )}
      {slotTarget && (
        <SlotModal box={slotTarget.box} slotIndex={slotTarget.slotIndex}
          onSave={handleSlotSave} onClose={() => setSlotTarget(null)} />
      )}
    </div>
  );
}
