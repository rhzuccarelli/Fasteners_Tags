import React, { useState, useMemo } from 'react';
import { fastenersDb, boxesDb, standardsDb } from '../storage.js';
import { exportTagsPDF } from '../pdf.js';
import TagPreview from '../components/TagPreview.jsx';


function ExportBtn({ onClick, disabled, loading, children }) {
  return (
    <button onClick={onClick} disabled={disabled || loading}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-mono font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
      {loading
        ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>Generating…</>
        : <><svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v8M4 6l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="1" y="11" width="12" height="2" rx="1" fill="currentColor" opacity=".4"/>
          </svg>{children}</>
      }
    </button>
  );
}

export default function PrintTags() {
  const fasteners = useMemo(() => fastenersDb.getAll(), []);
  const boxes     = useMemo(() => boxesDb.getAll(), []);
  const standards = useMemo(() => standardsDb.getAll(), []);

  const standardMap = useMemo(() => Object.fromEntries(standards.map(s => [s.id, s])), [standards]);

  const [selF, setSelF] = useState(new Set());
  const [selB, setSelB] = useState(new Set());
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');

  function toggleF(id) { setSelF(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }); }
  function toggleB(id) { setSelB(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }); }

  function doExport(key, items, type) {
    if (items.length === 0) { setError('Nothing to export.'); return; }
    setLoading(key); setError('');
    try {
      exportTagsPDF(items, type, standardMap);
    } catch (err) {
      setError('PDF generation failed: ' + err.message);
    } finally {
      setLoading('');
    }
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="font-mono font-bold text-2xl text-charcoal tracking-wide">Print Tags</h1>
        <p className="font-mono text-sm text-gray-400 mt-1">Generate 50×15mm PDF labels — all in-browser, no server needed</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg px-4 py-3 font-mono text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Fastener tags */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-mono font-bold text-lg text-charcoal">Fastener Tags</h2>
            <p className="font-mono text-xs text-gray-400 mt-0.5">
              {selF.size > 0 ? `${selF.size} of ${fasteners.length} selected` : `${fasteners.length} fasteners`}
            </p>
          </div>
          <div className="flex gap-3">
            <ExportBtn onClick={() => doExport('sel-f', fasteners.filter(f => selF.has(f.id)), 'fastener')}
              disabled={selF.size === 0} loading={loading === 'sel-f'}>
              Export Selected ({selF.size})
            </ExportBtn>
            <ExportBtn onClick={() => doExport('all-f', fasteners, 'fastener')}
              disabled={fasteners.length === 0} loading={loading === 'all-f'}>
              Export All
            </ExportBtn>
          </div>
        </div>

        {fasteners.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-xl py-12 text-center font-mono text-sm text-gray-400">
            No fasteners yet.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {fasteners.map(f => {
              const std = standardMap[f.standardId];
              return (
                <div key={f.id} onClick={() => toggleF(f.id)}
                  className={`bg-white border rounded-lg p-4 flex items-center gap-5 cursor-pointer transition-colors ${
                    selF.has(f.id) ? 'border-blue-400 ring-1 ring-blue-400 bg-blue-50/20' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="checkbox" checked={selF.has(f.id)} onChange={() => toggleF(f.id)}
                    onClick={e => e.stopPropagation()} className="w-4 h-4 rounded text-blue-600 flex-shrink-0" />
                  <div className="flex-shrink-0">
                    <TagPreview type="single" tag={{ metric: f.metric, lengthMm: f.lengthMm,
                      standardCode: std?.code, toolType: f.toolType, quantity: f.quantity,
                      drawingDataUrl: std?.drawingDataUrl }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono font-bold text-charcoal">{f.metric}</span>
                      {f.lengthMm != null && <span className="font-mono text-sm text-gray-500">× {f.lengthMm}mm</span>}
                    </div>
                    <div className="font-mono text-xs text-gray-400">
                      {std?.code || 'No standard'} · {f.toolType} · qty {f.quantity}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Box tags */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-mono font-bold text-lg text-charcoal">Box Tags</h2>
            <p className="font-mono text-xs text-gray-400 mt-0.5">
              {selB.size > 0 ? `${selB.size} of ${boxes.length} selected` : `${boxes.length} boxes`}
            </p>
          </div>
          <div className="flex gap-3">
            <ExportBtn onClick={() => doExport('sel-b', boxes.filter(b => selB.has(b.id)), 'box')}
              disabled={selB.size === 0} loading={loading === 'sel-b'}>
              Export Selected ({selB.size})
            </ExportBtn>
            <ExportBtn onClick={() => doExport('all-b', boxes, 'box')}
              disabled={boxes.length === 0} loading={loading === 'all-b'}>
              Export All
            </ExportBtn>
          </div>
        </div>

        {boxes.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-xl py-12 text-center font-mono text-sm text-gray-400">
            No boxes yet.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {boxes.map(box => {
              const std = box.standardId ? standardMap[box.standardId] : null;
              const boxTag = {
                standardCode: std?.code ?? null,
                drawingDataUrl: std?.drawingDataUrl ?? null,
                toolType: null,
                divisions: box.divisions,
                slots: box.slots || [],
              };
              const filled = (box.slots || []).filter(s => s.metric).length;
              return (
                <div key={box.id} onClick={() => toggleB(box.id)}
                  className={`bg-white border rounded-lg p-4 flex items-center gap-5 cursor-pointer transition-colors ${
                    selB.has(box.id) ? 'border-blue-400 ring-1 ring-blue-400 bg-blue-50/20' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="checkbox" checked={selB.has(box.id)} onChange={() => toggleB(box.id)}
                    onClick={e => e.stopPropagation()} className="w-4 h-4 rounded text-blue-600 flex-shrink-0" />
                  <div className="flex-shrink-0">
                    <TagPreview type="box" tag={boxTag} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono font-bold text-charcoal">{box.name}</div>
                    <div className="font-mono text-xs text-gray-400">
                      {std?.code || 'No standard'} · {box.divisions} slot{box.divisions !== 1 ? 's' : ''}
                      {box.location && ` · ${box.location}`}
                    </div>
                    <div className="font-mono text-xs text-gray-400 mt-0.5">
                      {filled}/{box.divisions} filled
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
