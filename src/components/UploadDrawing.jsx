import React, { useState, useRef } from 'react';
import { resizeImageFile } from '../storage.js';

export default function UploadDrawing({ standard, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) { setError('Please select a file.'); return; }
    setLoading(true); setError('');
    try {
      const dataUrl = await resizeImageFile(file, 200);
      onSuccess(dataUrl);
      onClose();
    } catch (err) {
      setError('Failed to process image: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 modal-backdrop">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 modal-panel">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-mono font-bold text-charcoal text-base">Upload Drawing — {standard.code}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center gap-2 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors"
            onClick={() => inputRef.current?.click()}>
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" className="text-gray-400">
              <path d="M16 4v16M10 10l6-6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 22v6h24v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {file ? (
              <div className="text-center">
                <p className="font-mono text-sm text-blue-700 font-medium">{file.name}</p>
                <p className="font-mono text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="font-mono text-sm text-gray-600">Click to select image</p>
                <p className="font-mono text-xs text-gray-400 mt-0.5">.png · .jpg · .jpeg · .gif · .webp</p>
              </div>
            )}
            <input ref={inputRef} type="file" accept="image/*" className="hidden"
              onChange={e => { setFile(e.target.files[0] || null); setError(''); }} />
          </div>

          <p className="font-mono text-xs text-gray-400 bg-gray-50 rounded px-3 py-2">
            Images are resized and stored locally in your browser. No server required.
          </p>

          {error && <p className="font-mono text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}

          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-mono rounded border border-gray-300 text-gray-700 hover:bg-surface transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading || !file}
              className="px-4 py-2 text-sm font-mono font-medium rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {loading ? 'Processing…' : 'Save Drawing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
