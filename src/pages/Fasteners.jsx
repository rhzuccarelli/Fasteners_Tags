import React, { useState, useMemo } from 'react';
import { fastenersDb, standardsDb } from '../storage.js';
import FastenerCard from '../components/FastenerCard.jsx';

const METRICS = ['M2','M2.5','M3','M4','M5','M6','M8','M10','M12','M14','M16','M20','M24'];
const TOOL_TYPES = ['Hex','Phillips','Torx','Flat','Nut','Washer','Other'];
const EMPTY = { metric: 'M6', lengthMm: '', standardId: '', toolType: 'Hex', quantity: 0, notes: '' };

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

export default function Fasteners() {
  const [fasteners, setFasteners] = useState(() => fastenersDb.getAll());
  const [standards] = useState(() => standardsDb.getAll());
  const [filters, setFilters] = useState({ metric: '', standardId: '', toolType: '' });
  const [selected, setSelected] = useState(new Set());
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState('');

  const standardMap = useMemo(() => Object.fromEntries(standards.map(s => [s.id, s])), [standards]);

  const filtered = useMemo(() => fasteners.filter(f => {
    if (filters.metric && !f.metric.includes(filters.metric)) return false;
    if (filters.standardId && f.standardId !== filters.standardId) return false;
    if (filters.toolType && f.toolType !== filters.toolType) return false;
    return true;
  }), [fasteners, filters]);

  function refresh() { setFasteners(fastenersDb.getAll()); }

  function openAdd() { setForm(EMPTY); setFormError(''); setAddOpen(true); }
  function openEdit(f) {
    setForm({ metric: f.metric, lengthMm: f.lengthMm ?? '', standardId: f.standardId ?? '',
      toolType: f.toolType, quantity: f.quantity, notes: f.notes || '' });
    setFormError(''); setEditTarget(f);
  }

  function handleSave() {
    if (!form.metric) { setFormError('Metric is required.'); return; }
    const data = {
      metric: form.metric,
      lengthMm: form.lengthMm !== '' ? Number(form.lengthMm) : null,
      standardId: form.standardId || null,
      toolType: form.toolType,
      quantity: Number(form.quantity) || 0,
      notes: form.notes.trim() || null,
    };
    try {
      if (editTarget) { fastenersDb.update(editTarget.id, data); setEditTarget(null); }
      else { fastenersDb.add(data); setAddOpen(false); }
      refresh();
    } catch (err) { setFormError(err.message); }
  }

  function handleDelete() {
    fastenersDb.delete(deleteTarget.id);
    setSelected(prev => { const n = new Set(prev); n.delete(deleteTarget.id); return n; });
    setDeleteTarget(null); refresh();
  }

  function toggleSelect(id, checked) {
    setSelected(prev => { const n = new Set(prev); checked ? n.add(id) : n.delete(id); return n; });
  }

  const formFields = (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block font-mono text-xs text-gray-600 mb-1">Metric *</label>
          <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
            value={form.metric} onChange={e => setForm(f => ({ ...f, metric: e.target.value }))}>
            {METRICS.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="block font-mono text-xs text-gray-600 mb-1">Length (mm)</label>
          <input type="number" min="0" step="0.5" placeholder="optional"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
            value={form.lengthMm} onChange={e => setForm(f => ({ ...f, lengthMm: e.target.value }))} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block font-mono text-xs text-gray-600 mb-1">Standard</label>
          <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
            value={form.standardId} onChange={e => setForm(f => ({ ...f, standardId: e.target.value }))}>
            <option value="">— none —</option>
            {standards.map(s => <option key={s.id} value={s.id}>{s.code}</option>)}
          </select>
        </div>
        <div>
          <label className="block font-mono text-xs text-gray-600 mb-1">Tool Type</label>
          <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
            value={form.toolType} onChange={e => setForm(f => ({ ...f, toolType: e.target.value }))}>
            {TOOL_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block font-mono text-xs text-gray-600 mb-1">Quantity</label>
        <input type="number" min="0"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
          value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
      </div>
      <div>
        <label className="block font-mono text-xs text-gray-600 mb-1">Notes</label>
        <textarea rows={2} placeholder="Optional notes…"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none resize-none"
          value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
      </div>
      {formError && <p className="font-mono text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{formError}</p>}
      <div className="flex gap-3 justify-end">
        <button onClick={() => { setAddOpen(false); setEditTarget(null); }}
          className="px-4 py-2 text-sm font-mono rounded border border-gray-300 text-gray-700 hover:bg-surface transition-colors">Cancel</button>
        <button onClick={handleSave}
          className="px-4 py-2 text-sm font-mono font-medium rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors">
          {editTarget ? 'Save Changes' : 'Add Fastener'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-mono font-bold text-2xl text-charcoal tracking-wide">Fastener Library</h1>
          <p className="font-mono text-sm text-gray-400 mt-1">{filtered.length} fastener{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-mono font-medium rounded-lg hover:bg-blue-700 transition-colors">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Add Fastener
        </button>
      </div>

      {/* Filter + selection bar */}
      <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 mb-6 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <label className="font-mono text-xs text-gray-500">Metric</label>
          <select className="border border-gray-300 rounded px-2 py-1 text-xs font-mono outline-none focus:ring-1 focus:ring-blue-500"
            value={filters.metric} onChange={e => setFilters(f => ({ ...f, metric: e.target.value }))}>
            <option value="">All</option>
            {METRICS.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="font-mono text-xs text-gray-500">Standard</label>
          <select className="border border-gray-300 rounded px-2 py-1 text-xs font-mono outline-none focus:ring-1 focus:ring-blue-500"
            value={filters.standardId} onChange={e => setFilters(f => ({ ...f, standardId: e.target.value }))}>
            <option value="">All</option>
            {standards.map(s => <option key={s.id} value={s.id}>{s.code}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="font-mono text-xs text-gray-500">Tool</label>
          <select className="border border-gray-300 rounded px-2 py-1 text-xs font-mono outline-none focus:ring-1 focus:ring-blue-500"
            value={filters.toolType} onChange={e => setFilters(f => ({ ...f, toolType: e.target.value }))}>
            <option value="">All</option>
            {TOOL_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {selected.size > 0 && (
            <span className="font-mono text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded px-2 py-0.5">
              {selected.size} selected
            </span>
          )}
          <button onClick={() => setSelected(new Set(filtered.map(f => f.id)))}
            className="text-xs font-mono text-gray-500 hover:text-charcoal">Select All</button>
          <button onClick={() => setSelected(new Set())}
            className="text-xs font-mono text-gray-500 hover:text-charcoal">Clear</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(f => (
          <FastenerCard key={f.id} fastener={f} standard={standardMap[f.standardId]}
            selected={selected.has(f.id)} onSelect={c => toggleSelect(f.id, c)}
            onEdit={openEdit} onDelete={setDeleteTarget} />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16 text-gray-400 font-mono text-sm">
            No fasteners match the current filters.
          </div>
        )}
      </div>

      {addOpen && <Modal title="Add Fastener" onClose={() => setAddOpen(false)}>{formFields}</Modal>}
      {editTarget && <Modal title={`Edit — ${editTarget.metric}`} onClose={() => setEditTarget(null)}>{formFields}</Modal>}
      {deleteTarget && (
        <Modal title="Delete Fastener?" onClose={() => setDeleteTarget(null)}>
          <p className="font-mono text-sm text-gray-600 mb-6">
            Delete <strong>{deleteTarget.metric}{deleteTarget.lengthMm != null ? ` × ${deleteTarget.lengthMm}mm` : ''}</strong>?
          </p>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm font-mono rounded border border-gray-300 text-gray-700 hover:bg-surface transition-colors">Cancel</button>
            <button onClick={handleDelete} className="px-4 py-2 text-sm font-mono font-medium rounded bg-red-600 text-white hover:bg-red-700 transition-colors">Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
