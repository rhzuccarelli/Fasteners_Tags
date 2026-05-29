import React, { useEffect, useState } from 'react';
import TagPreview from '../components/TagPreview.jsx';

function ExportButton({ onClick, loading, children, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-mono font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {loading ? (
        <>
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Generating…
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v8M4 6l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M1 11h12v2H1z" fill="currentColor" opacity="0.4" />
          </svg>
          {children}
        </>
      )}
    </button>
  );
}

async function exportTags(type, ids) {
  const res = await fetch('/api/export/tags', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, ids }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `HTTP ${res.status}`);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'fastener-tags.pdf';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function PrintTags() {
  const [fasteners, setFasteners] = useState([]);
  const [boxes, setBoxes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedFasteners, setSelectedFasteners] = useState(new Set());
  const [selectedBoxes, setSelectedBoxes] = useState(new Set());

  const [exportLoading, setExportLoading] = useState('');
  const [exportError, setExportError] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const [fRes, bRes] = await Promise.all([
      fetch('/api/fasteners'),
      fetch('/api/boxes'),
    ]);
    setFasteners(await fRes.json());
    setBoxes(await bRes.json());
    setLoading(false);
  }

  function toggleFastener(id) {
    setSelectedFasteners(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  function toggleBox(id) {
    setSelectedBoxes(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  async function doExport(key, type, ids) {
    setExportLoading(key);
    setExportError('');
    try {
      await exportTags(type, ids);
    } catch (err) {
      setExportError(err.message);
    } finally {
      setExportLoading('');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 font-mono text-sm text-gray-400">
        Loading…
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="font-mono font-bold text-2xl text-charcoal tracking-wide">Print Tags</h1>
        <p className="font-mono text-sm text-gray-400 mt-1">Generate 50×15mm PDF tags — single fastener or full box labels</p>
      </div>

      {exportError && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg px-4 py-3 font-mono text-sm text-red-700">
          <strong>Export failed:</strong> {exportError}
        </div>
      )}

      {/* ── Single Fastener Tags ───────────────────────────────────── */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-mono font-bold text-lg text-charcoal">Fastener Tags</h2>
            <p className="font-mono text-xs text-gray-400 mt-0.5">
              {selectedFasteners.size > 0
                ? `${selectedFasteners.size} of ${fasteners.length} selected`
                : `${fasteners.length} fasteners`}
            </p>
          </div>
          <div className="flex gap-3">
            <ExportButton
              onClick={() => doExport('sel-f', 'selected', [...selectedFasteners])}
              loading={exportLoading === 'sel-f'}
              disabled={selectedFasteners.size === 0}
            >
              Export Selected ({selectedFasteners.size})
            </ExportButton>
            <ExportButton
              onClick={() => doExport('all-f', 'fasteners', [])}
              loading={exportLoading === 'all-f'}
              disabled={fasteners.length === 0}
            >
              Export All
            </ExportButton>
          </div>
        </div>

        {fasteners.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-xl py-12 text-center font-mono text-sm text-gray-400">
            No fasteners yet.
          </div>
        ) : (
          <div className="grid gap-3">
            {fasteners.map(f => (
              <div
                key={f.id}
                className={`bg-white border rounded-lg p-4 flex items-center gap-5 cursor-pointer transition-colors ${
                  selectedFasteners.has(f.id) ? 'border-blue-400 ring-1 ring-blue-400 bg-blue-50/30' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => toggleFastener(f.id)}
              >
                <input
                  type="checkbox"
                  checked={selectedFasteners.has(f.id)}
                  onChange={() => toggleFastener(f.id)}
                  onClick={e => e.stopPropagation()}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 flex-shrink-0"
                />

                {/* Tag preview */}
                <div className="flex-shrink-0">
                  <TagPreview
                    tag={{
                      metric: f.metric,
                      length_mm: f.length_mm,
                      standard_code: f.standard_code,
                      tool_type: f.tool_type,
                      quantity: f.quantity,
                      drawing_path: f.drawing_path,
                    }}
                    type="single"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono font-bold text-charcoal">{f.metric}</span>
                    {f.length_mm != null && (
                      <span className="font-mono text-sm text-gray-500">× {f.length_mm}mm</span>
                    )}
                  </div>
                  <div className="font-mono text-xs text-gray-400">
                    {f.standard_code || 'No standard'} · {f.tool_type} · qty {f.quantity}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Box Tags ──────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-mono font-bold text-lg text-charcoal">Box Tags</h2>
            <p className="font-mono text-xs text-gray-400 mt-0.5">
              {selectedBoxes.size > 0
                ? `${selectedBoxes.size} of ${boxes.length} selected`
                : `${boxes.length} boxes`}
            </p>
          </div>
          <div className="flex gap-3">
            <ExportButton
              onClick={() => doExport('sel-b', 'boxes', [...selectedBoxes])}
              loading={exportLoading === 'sel-b'}
              disabled={selectedBoxes.size === 0}
            >
              Export Selected ({selectedBoxes.size})
            </ExportButton>
            <ExportButton
              onClick={() => doExport('all-b', 'boxes', [])}
              loading={exportLoading === 'all-b'}
              disabled={boxes.length === 0}
            >
              Export All
            </ExportButton>
          </div>
        </div>

        {boxes.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-xl py-12 text-center font-mono text-sm text-gray-400">
            No boxes yet.
          </div>
        ) : (
          <div className="grid gap-3">
            {boxes.map(box => (
              <div
                key={box.id}
                className={`bg-white border rounded-lg p-4 flex items-center gap-5 cursor-pointer transition-colors ${
                  selectedBoxes.has(box.id) ? 'border-blue-400 ring-1 ring-blue-400 bg-blue-50/30' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => toggleBox(box.id)}
              >
                <input
                  type="checkbox"
                  checked={selectedBoxes.has(box.id)}
                  onChange={() => toggleBox(box.id)}
                  onClick={e => e.stopPropagation()}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 flex-shrink-0"
                />

                {/* Box tag preview */}
                <div className="flex-shrink-0">
                  <TagPreview
                    tag={{
                      box_name: box.name,
                      divisions: box.divisions,
                      slots: box.slots || [],
                    }}
                    type="box"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="font-mono font-bold text-charcoal">{box.name}</div>
                  <div className="font-mono text-xs text-gray-400">
                    {box.size} · {box.divisions} slot{box.divisions !== 1 ? 's' : ''}
                    {box.location && ` · ${box.location}`}
                  </div>
                  <div className="font-mono text-xs text-gray-400 mt-0.5">
                    {(box.slots || []).filter(s => s.fastener_id).length} / {box.divisions} filled
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
