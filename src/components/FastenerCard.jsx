import React, { useState } from 'react';

const BADGES = {
  Hex:      'bg-blue-100 text-blue-800',
  Phillips: 'bg-green-100 text-green-800',
  Torx:     'bg-orange-100 text-orange-800',
  Flat:     'bg-gray-100 text-gray-700',
  Nut:      'bg-purple-100 text-purple-800',
  Washer:   'bg-yellow-100 text-yellow-800',
  Other:    'bg-gray-100 text-gray-600',
};

function Thumb({ dataUrl, code }) {
  const [err, setErr] = useState(false);
  if (dataUrl && !err) return (
    <div className="w-12 h-12 bg-surface rounded border border-gray-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
      <img src={dataUrl} alt="" className="max-w-full max-h-full object-contain" onError={() => setErr(true)} />
    </div>
  );
  return (
    <div className="w-12 h-12 bg-surface rounded border border-dashed border-gray-300 flex-shrink-0 flex items-center justify-center">
      <span className="font-mono text-gray-400 text-xs text-center px-1 leading-tight">{code || '?'}</span>
    </div>
  );
}

export default function FastenerCard({ fastener, standard, selected, onSelect, onEdit, onDelete }) {
  const badgeCls = BADGES[fastener.toolType] || BADGES.Other;
  return (
    <div className={`bg-white border rounded-lg shadow-sm card-hover p-4 flex flex-col gap-3 ${selected ? 'border-blue-400 ring-1 ring-blue-400' : 'border-gray-200'}`}>
      <div className="flex items-start gap-3">
        <label className="mt-1 flex-shrink-0 cursor-pointer">
          <input type="checkbox" checked={selected} onChange={e => onSelect(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-blue-600" />
        </label>
        <Thumb dataUrl={standard?.drawingDataUrl} code={standard?.code} />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="font-mono font-bold text-charcoal text-lg leading-none">{fastener.metric}</span>
            {fastener.lengthMm != null && <span className="font-mono text-gray-500 text-sm">× {fastener.lengthMm}mm</span>}
          </div>
          {standard && <p className="font-mono text-xs text-gray-400 mt-0.5">{standard.code}</p>}
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        <span className={`px-2 py-0.5 rounded text-xs font-mono font-medium ${badgeCls}`}>{fastener.toolType}</span>
      </div>
      {fastener.notes && <p className="text-xs text-gray-400 truncate">{fastener.notes}</p>}
      <div className="flex gap-2 pt-1 border-t border-gray-100">
        <button onClick={() => onEdit(fastener)}
          className="px-3 py-1.5 text-xs font-mono font-medium rounded border border-gray-300 text-gray-700 hover:bg-surface transition-colors">
          Edit
        </button>
        <button onClick={() => onDelete(fastener)}
          className="px-3 py-1.5 text-xs font-mono font-medium rounded bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors ml-auto">
          Delete
        </button>
      </div>
    </div>
  );
}
