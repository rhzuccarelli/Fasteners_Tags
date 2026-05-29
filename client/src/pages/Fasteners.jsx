import React, { useEffect, useState, useCallback } from 'react';
import FastenerCard from '../components/FastenerCard.jsx';

const METRICS = ['M2', 'M2.5', 'M3', 'M4', 'M5', 'M6', 'M8', 'M10', 'M12', 'M14', 'M16', 'M20', 'M24'];
const TOOL_TYPES = ['Hex', 'Phillips', 'Torx', 'Flat', 'Nut', 'Washer', 'Other'];

const EMPTY_FORM = {
  metric: 'M6',
  length_mm: '',
  standard_id: '',
  tool_type: 'Hex',
  quantity: 0,
  notes: '',
};

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 modal-backdrop">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 modal-panel">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-mono font-bold text-charcoal text-base">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function Fasteners() {
  const [fasteners, setFasteners] = useState([]);
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({ metric: '', standard_id: '', tool_type: '' });
  const [selected, setSelected] = useState(new Set());

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    loadStandards();
    loadFasteners();
  }, []);

  useEffect(() => {
    loadFasteners();
  }, [filters]);

  async function loadStandards() {
    const res = await fetch('/api/standards');
    setStandards(await res.json());
  }

  async function loadFasteners() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.metric) params.set('metric', filters.metric);
    if (filters.standard_id) params.set('standard_id', filters.standard_id);
    if (filters.tool_type) params.set('tool_type', filters.tool_type);
    const res = await fetch(`/api/fasteners?${params}`);
    setFasteners(await res.json());
    setLoading(false);
  }

  function openAdd() {
    setForm(EMPTY_FORM);
    setFormError('');
    setAddOpen(true);
  }

  function openEdit(fastener) {
    setForm({
      metric: fastener.metric,
      length_mm: fastener.length_mm ?? '',
      standard_id: fastener.standard_id ?? '',
      tool_type: fastener.tool_type,
      quantity: fastener.quantity,
      notes: fastener.notes || '',
    });
    setFormError('');
    setEditTarget(fastener);
  }

  async function handleSave() {
    if (!form.metric) { setFormError('Metric is required.'); return; }
    setSaving(true);
    setFormError('');
    try {
      const body = {
        metric: form.metric,
        length_mm: form.length_mm !== '' ? Number(form.length_mm) : null,
        standard_id: form.standard_id !== '' ? Number(form.standard_id) : null,
        tool_type: form.tool_type,
        quantity: Number(form.quantity),
        notes: form.notes || null,
      };
      const isEdit = !!editTarget;
      const res = await fetch(
        isEdit ? `/api/fasteners/${editTarget.id}` : '/api/fasteners',
        { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      );
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || `HTTP ${res.status}`); }
      await loadFasteners();
      setAddOpen(false);
      setEditTarget(null);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await fetch(`/api/fasteners/${deleteTarget.id}`, { method: 'DELETE' });
    await loadFasteners();
    setSelected(prev => { const n = new Set(prev); n.delete(deleteTarget.id); return n; });
    setDeleteTarget(null);
  }

  const toggleSelect = useCallback((id, checked) => {
    setSelected(prev => {
      const n = new Set(prev);
      checked ? n.add(id) : n.delete(id);
      return n;
    });
  }, []);

  function selectAll() { setSelected(new Set(fasteners.map(f => f.id))); }
  function selectNone() { setSelected(new Set()); }

  const formFields = (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block font-mono text-xs text-gray-600 mb-1">Metric *</label>
          <select
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
            value={form.metric}
            onChange={e => setForm(f => ({ ...f, metric: e.target.value }))}
          >
            {METRICS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="block font-mono text-xs text-gray-600 mb-1">Length (mm)</label>
          <input
            type="number"
            min="0"
            step="0.5"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="optional"
            value={form.length_mm}
            onChange={e => setForm(f => ({ ...f, length_mm: e.target.value }))}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block font-mono text-xs text-gray-600 mb-1">Standard</label>
          <select
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
            value={form.standard_id}
            onChange={e => setForm(f => ({ ...f, standard_id: e.target.value }))}
          >
            <option value="">— none —</option>
            {standards.map(s => <option key={s.id} value={s.id}>{s.code}</option>)}
          </select>
        </div>
        <div>
          <label className="block font-mono text-xs text-gray-600 mb-1">Tool Type *</label>
          <select
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
            value={form.tool_type}
            onChange={e => setForm(f => ({ ...f, tool_type: e.target.value }))}
          >
            {TOOL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block font-mono text-xs text-gray-600 mb-1">Quantity</label>
        <input
          type="number"
          min="0"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
          value={form.quantity}
          onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
        />
      </div>
      <div>
        <label className="block font-mono text-xs text-gray-600 mb-1">Notes</label>
        <textarea
          rows={2}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none resize-none"
          placeholder="Optional notes…"
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
        />
      </div>
      {formError && (
        <p className="font-mono text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{formError}</p>
      )}
      <div className="flex gap-3 justify-end pt-1">
        <button
          onClick={() => { setAddOpen(false); setEditTarget(null); }}
          className="px-4 py-2 text-sm font-mono rounded border border-gray-300 text-gray-700 hover:bg-surface transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 text-sm font-mono font-medium rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Add Fastener'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-mono font-bold text-2xl text-charcoal tracking-wide">Fastener Library</h1>
          <p className="font-mono text-sm text-gray-400 mt-1">{fasteners.length} fastener{fasteners.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-mono font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Add Fastener
        </button>
      </div>

      {/* Filters + selection toolbar */}
      <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 mb-6 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <label className="font-mono text-xs text-gray-500">Metric</label>
          <select
            className="border border-gray-300 rounded px-2 py-1 text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none"
            value={filters.metric}
            onChange={e => setFilters(f => ({ ...f, metric: e.target.value }))}
          >
            <option value="">All</option>
            {METRICS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="font-mono text-xs text-gray-500">Standard</label>
          <select
            className="border border-gray-300 rounded px-2 py-1 text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none"
            value={filters.standard_id}
            onChange={e => setFilters(f => ({ ...f, standard_id: e.target.value }))}
          >
            <option value="">All</option>
            {standards.map(s => <option key={s.id} value={s.id}>{s.code}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="font-mono text-xs text-gray-500">Tool</label>
          <select
            className="border border-gray-300 rounded px-2 py-1 text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none"
            value={filters.tool_type}
            onChange={e => setFilters(f => ({ ...f, tool_type: e.target.value }))}
          >
            <option value="">All</option>
            {TOOL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {selected.size > 0 && (
            <span className="font-mono text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded px-2 py-0.5">
              {selected.size} selected
            </span>
          )}
          <button onClick={selectAll} className="text-xs font-mono text-gray-500 hover:text-charcoal transition-colors">
            Select All
          </button>
          <button onClick={selectNone} className="text-xs font-mono text-gray-500 hover:text-charcoal transition-colors">
            Clear
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 font-mono text-sm text-gray-400">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {fasteners.map(f => (
            <FastenerCard
              key={f.id}
              fastener={f}
              selected={selected.has(f.id)}
              onSelect={checked => toggleSelect(f.id, checked)}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          ))}
          {fasteners.length === 0 && (
            <div className="col-span-full text-center py-16 text-gray-400 font-mono text-sm">
              No fasteners match the current filters.
            </div>
          )}
        </div>
      )}

      {addOpen && <Modal title="Add Fastener" onClose={() => setAddOpen(false)}>{formFields}</Modal>}
      {editTarget && <Modal title={`Edit — ${editTarget.metric}`} onClose={() => setEditTarget(null)}>{formFields}</Modal>}
      {deleteTarget && (
        <Modal title="Delete Fastener?" onClose={() => setDeleteTarget(null)}>
          <p className="font-mono text-sm text-gray-600 mb-6">
            Delete <strong>{deleteTarget.metric}{deleteTarget.length_mm ? ` × ${deleteTarget.length_mm}mm` : ''}</strong>? This cannot be undone.
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
