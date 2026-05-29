import React, { useEffect, useState } from 'react';
import StandardCard from '../components/StandardCard.jsx';
import UploadDrawing from '../components/UploadDrawing.jsx';

const EMPTY_FORM = { code: '', description: '' };

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 modal-backdrop">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 modal-panel">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-mono font-bold text-charcoal text-base">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
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

export default function Standards() {
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [uploadTarget, setUploadTarget] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/standards');
      const data = await res.json();
      setStandards(data);
    } catch (err) {
      setError('Failed to load standards.');
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setForm(EMPTY_FORM);
    setFormError('');
    setAddOpen(true);
  }

  function openEdit(standard) {
    setForm({ code: standard.code, description: standard.description || '' });
    setFormError('');
    setEditTarget(standard);
  }

  async function handleSave() {
    if (!form.code.trim()) { setFormError('Code is required.'); return; }
    setSaving(true);
    setFormError('');
    try {
      const isEdit = !!editTarget;
      const res = await fetch(
        isEdit ? `/api/standards/${editTarget.id}` : '/api/standards',
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: form.code.trim(), description: form.description.trim() || null }),
        }
      );
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `HTTP ${res.status}`);
      }
      await load();
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
    try {
      await fetch(`/api/standards/${deleteTarget.id}`, { method: 'DELETE' });
      await load();
    } catch (_) {}
    setDeleteTarget(null);
  }

  function handleUploadSuccess(updated) {
    setStandards(prev => prev.map(s => s.id === updated.id ? updated : s));
  }

  const formFields = (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block font-mono text-xs text-gray-600 mb-1">Code *</label>
        <input
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          placeholder="e.g. DIN 912"
          value={form.code}
          onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
        />
      </div>
      <div>
        <label className="block font-mono text-xs text-gray-600 mb-1">Description</label>
        <input
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          placeholder="e.g. Socket Head Cap Screw"
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
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
          {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Add Standard'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-8 max-w-6xl">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-mono font-bold text-2xl text-charcoal tracking-wide">Standards Library</h1>
          <p className="font-mono text-sm text-gray-400 mt-1">DIN / ISO fastener references</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-mono font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Add Standard
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20 text-gray-400 font-mono text-sm">
          Loading…
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 font-mono text-sm mb-6">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {standards.map(s => (
            <StandardCard
              key={s.id}
              standard={s}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
              onUploadDrawing={setUploadTarget}
            />
          ))}
          {standards.length === 0 && (
            <div className="col-span-full text-center py-16 text-gray-400 font-mono text-sm">
              No standards yet. Add one to get started.
            </div>
          )}
        </div>
      )}

      {addOpen && (
        <Modal title="Add Standard" onClose={() => setAddOpen(false)}>
          {formFields}
        </Modal>
      )}
      {editTarget && (
        <Modal title={`Edit — ${editTarget.code}`} onClose={() => setEditTarget(null)}>
          {formFields}
        </Modal>
      )}
      {deleteTarget && (
        <Modal title="Delete Standard?" onClose={() => setDeleteTarget(null)}>
          <p className="font-mono text-sm text-gray-600 mb-6">
            Delete <strong>{deleteTarget.code}</strong>? This cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setDeleteTarget(null)}
              className="px-4 py-2 text-sm font-mono rounded border border-gray-300 text-gray-700 hover:bg-surface transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm font-mono font-medium rounded bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </Modal>
      )}
      {uploadTarget && (
        <UploadDrawing
          standard={uploadTarget}
          onClose={() => setUploadTarget(null)}
          onSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
}
