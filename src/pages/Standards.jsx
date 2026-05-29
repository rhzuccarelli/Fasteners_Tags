import React, { useState } from 'react';
import { standardsDb } from '../storage.js';
import StandardCard from '../components/StandardCard.jsx';
import UploadDrawing from '../components/UploadDrawing.jsx';

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

const EMPTY = { code: '', description: '' };

export default function Standards() {
  const [standards, setStandards] = useState(() => standardsDb.getAll());
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [uploadTarget, setUploadTarget] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState('');

  function refresh() { setStandards(standardsDb.getAll()); }

  function openAdd() { setForm(EMPTY); setFormError(''); setAddOpen(true); }
  function openEdit(s) { setForm({ code: s.code, description: s.description || '' }); setFormError(''); setEditTarget(s); }

  function handleSave() {
    if (!form.code.trim()) { setFormError('Code is required.'); return; }
    try {
      if (editTarget) {
        standardsDb.update(editTarget.id, { code: form.code.trim(), description: form.description.trim() || null });
        setEditTarget(null);
      } else {
        standardsDb.add({ code: form.code.trim(), description: form.description.trim() || null });
        setAddOpen(false);
      }
      refresh();
    } catch (err) { setFormError(err.message); }
  }

  function handleDelete() {
    standardsDb.delete(deleteTarget.id);
    setDeleteTarget(null);
    refresh();
  }

  function handleUploadSuccess(standard, dataUrl) {
    standardsDb.update(standard.id, { drawingDataUrl: dataUrl });
    refresh();
    setUploadTarget(null);
  }

  const formFields = (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block font-mono text-xs text-gray-600 mb-1">Code *</label>
        <input className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="e.g. DIN 912" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} />
      </div>
      <div>
        <label className="block font-mono text-xs text-gray-600 mb-1">Description</label>
        <input className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="e.g. Socket Head Cap Screw" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      </div>
      {formError && <p className="font-mono text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{formError}</p>}
      <div className="flex gap-3 justify-end">
        <button onClick={() => { setAddOpen(false); setEditTarget(null); }}
          className="px-4 py-2 text-sm font-mono rounded border border-gray-300 text-gray-700 hover:bg-surface transition-colors">
          Cancel
        </button>
        <button onClick={handleSave}
          className="px-4 py-2 text-sm font-mono font-medium rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors">
          {editTarget ? 'Save Changes' : 'Add Standard'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-mono font-bold text-2xl text-charcoal tracking-wide">Standards Library</h1>
          <p className="font-mono text-sm text-gray-400 mt-1">DIN / ISO fastener references</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-mono font-medium rounded-lg hover:bg-blue-700 transition-colors">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Add Standard
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {standards.map(s => (
          <StandardCard key={s.id} standard={s} onEdit={openEdit}
            onDelete={setDeleteTarget} onUploadDrawing={setUploadTarget} />
        ))}
        {standards.length === 0 && (
          <div className="col-span-full text-center py-16 text-gray-400 font-mono text-sm">No standards yet.</div>
        )}
      </div>

      {addOpen && <Modal title="Add Standard" onClose={() => setAddOpen(false)}>{formFields}</Modal>}
      {editTarget && <Modal title={`Edit — ${editTarget.code}`} onClose={() => setEditTarget(null)}>{formFields}</Modal>}
      {deleteTarget && (
        <Modal title="Delete Standard?" onClose={() => setDeleteTarget(null)}>
          <p className="font-mono text-sm text-gray-600 mb-6">Delete <strong>{deleteTarget.code}</strong>? Cannot be undone.</p>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm font-mono rounded border border-gray-300 text-gray-700 hover:bg-surface transition-colors">Cancel</button>
            <button onClick={handleDelete} className="px-4 py-2 text-sm font-mono font-medium rounded bg-red-600 text-white hover:bg-red-700 transition-colors">Delete</button>
          </div>
        </Modal>
      )}
      {uploadTarget && (
        <UploadDrawing standard={uploadTarget} onClose={() => setUploadTarget(null)}
          onSuccess={dataUrl => handleUploadSuccess(uploadTarget, dataUrl)} />
      )}
    </div>
  );
}
