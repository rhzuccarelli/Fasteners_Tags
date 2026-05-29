import React, { useState, useMemo } from 'react';
import { boxesDb, fastenersDb, standardsDb } from '../storage.js';
import BoxCard from '../components/BoxCard.jsx';
import BoxSlotVisualiser from '../components/BoxSlotVisualiser.jsx';

const EMPTY = { name: '', size: 'SMALL', divisions: 2, location: '', notes: '' };

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

function AssignModal({ box, slotIndex, fasteners, standardMap, onAssign, onClose }) {
  const [search, setSearch] = useState('');
  const slot = box.slots?.find(s => s.slotIndex === slotIndex);
  const items = fasteners.filter(f => {
    const q = search.toLowerCase();
    return f.metric.toLowerCase().includes(q) ||
      (standardMap[f.standardId]?.code || '').toLowerCase().includes(q) ||
      f.toolType.toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 modal-backdrop">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-5 modal-panel">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-mono font-bold text-charcoal text-sm">Slot {slotIndex + 1} — {box.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <input autoFocus placeholder="Search fasteners…"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none mb-3"
          value={search} onChange={e => setSearch(e.target.value)} />
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {slot?.fastenerId && (
            <button onClick={() => onAssign(null)}
              className="w-full text-left px-3 py-2 rounded text-xs font-mono text-red-600 hover:bg-red-50 transition-colors">
              ✕ Clear slot
            </button>
          )}
          {items.length === 0 && <p className="text-center py-4 font-mono text-xs text-gray-400">No fasteners found.</p>}
          {items.map(f => {
            const std = standardMap[f.standardId];
            return (
              <button key={f.id} onClick={() => onAssign(f.id)}
                className={`w-full text-left px-3 py-2 rounded transition-colors ${
                  slot?.fastenerId === f.id ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-50 text-gray-700'}`}>
                <span className="font-mono font-bold text-sm">{f.metric}</span>
                {f.lengthMm != null && <span className="font-mono text-xs text-gray-400 ml-1">× {f.lengthMm}mm</span>}
                {std && <span className="font-mono text-xs text-gray-400 ml-2">{std.code}</span>}
                <span className="font-mono text-xs text-gray-300 ml-2">{f.toolType}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function Boxes() {
  const [boxes, setBoxes] = useState(() => boxesDb.getAll());
  const [fasteners] = useState(() => fastenersDb.getAll());
  const [standards] = useState(() => standardsDb.getAll());
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [assignTarget, setAssignTarget] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState('');

  const fastenerMap = useMemo(() => Object.fromEntries(fasteners.map(f => [f.id, f])), [fasteners]);
  const standardMap = useMemo(() => Object.fromEntries(standards.map(s => [s.id, s])), [standards]);

  function refresh() { setBoxes(boxesDb.getAll()); }
  function openAdd() { setForm(EMPTY); setFormError(''); setAddOpen(true); }
  function openEdit(b) {
    setForm({ name: b.name, size: b.size, divisions: b.divisions, location: b.location || '', notes: b.notes || '' });
    setFormError(''); setEditTarget(b);
  }

  function handleSave() {
    if (!form.name.trim()) { setFormError('Name is required.'); return; }
    const data = { name: form.name.trim(), size: form.size, divisions: Number(form.divisions),
      location: form.location.trim() || null, notes: form.notes.trim() || null };
    try {
      if (editTarget) { boxesDb.update(editTarget.id, data); setEditTarget(null); }
      else { boxesDb.add(data); setAddOpen(false); }
      refresh();
    } catch (err) { setFormError(err.message); }
  }

  function handleDelete() { boxesDb.delete(deleteTarget.id); setDeleteTarget(null); refresh(); }

  function handleAssign(fastenerId) {
    const { box, slotIndex } = assignTarget;
    boxesDb.setSlot(box.id, slotIndex, fastenerId);
    setAssignTarget(null); refresh();
  }

  function suggestGrouping() {
    const sorted = [...fasteners].sort((a, b) => {
      const ak = `${a.metric}_${a.standardId}`;
      const bk = `${b.metric}_${b.standardId}`;
      return ak.localeCompare(bk);
    });
    let idx = 0;
    for (const box of boxes) {
      for (let i = 0; i < box.divisions; i++) {
        boxesDb.setSlot(box.id, i, sorted[idx]?.id || null);
        idx++;
      }
    }
    refresh();
  }

  const formFields = (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block font-mono text-xs text-gray-600 mb-1">Name *</label>
        <input className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="e.g. Small Screws A" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
      </div>
      <div>
        <label className="block font-mono text-xs text-gray-600 mb-2">Size</label>
        <div className="flex gap-2">
          {['SMALL','LARGE'].map(s => (
            <button key={s} type="button" onClick={() => setForm(f => ({ ...f, size: s }))}
              className={`flex-1 py-2 text-xs font-mono font-medium rounded border transition-colors ${
                form.size === s ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:bg-surface'}`}>
              {s}
              <span className="block text-xs opacity-60 font-normal mt-0.5">{s === 'SMALL' ? '270×110mm' : '360×150mm'}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block font-mono text-xs text-gray-600 mb-2">Divisions</label>
        <div className="flex gap-2 mb-3">
          {[1,2,3,4].map(d => (
            <button key={d} type="button" onClick={() => setForm(f => ({ ...f, divisions: d }))}
              className={`flex-1 py-2 text-xs font-mono font-medium rounded border transition-colors ${
                form.divisions === d ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:bg-surface'}`}>
              {d}
            </button>
          ))}
        </div>
        <div className="flex justify-center">
          <BoxSlotVisualiser size={form.size} divisions={form.divisions} slots={[]} />
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
        <div className="flex gap-3">
          <button onClick={suggestGrouping}
            className="px-4 py-2 text-sm font-mono font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-surface transition-colors">
            Suggest Grouping
          </button>
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-mono font-medium rounded-lg hover:bg-blue-700 transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Add Box
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {boxes.map(box => (
          <BoxCard key={box.id} box={box} fastenerMap={fastenerMap} standardMap={standardMap}
            onEdit={openEdit} onDelete={setDeleteTarget}
            onSlotClick={(b, i) => setAssignTarget({ box: b, slotIndex: i })} />
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
      {assignTarget && (
        <AssignModal box={assignTarget.box} slotIndex={assignTarget.slotIndex}
          fasteners={fasteners} standardMap={standardMap}
          onAssign={handleAssign} onClose={() => setAssignTarget(null)} />
      )}
    </div>
  );
}
