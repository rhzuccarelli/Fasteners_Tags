import React, { useState } from 'react';

const TOOL_BADGES = {
  Hex:      { bg: 'bg-blue-100',   text: 'text-blue-800'   },
  Phillips: { bg: 'bg-green-100',  text: 'text-green-800'  },
  Torx:     { bg: 'bg-orange-100', text: 'text-orange-800' },
  Flat:     { bg: 'bg-gray-100',   text: 'text-gray-700'   },
  Nut:      { bg: 'bg-purple-100', text: 'text-purple-800' },
  Washer:   { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  Other:    { bg: 'bg-gray-100',   text: 'text-gray-600'   },
};

function DrawingThumb({ drawingPath, code }) {
  const [err, setErr] = useState(false);
  if (drawingPath && !err) {
    return (
      <div className="w-14 h-14 bg-surface rounded border border-gray-200 flex-shrink-0 overflow-hidden flex items-center justify-center">
        <img
          src={drawingPath}
          alt={code}
          className="max-w-full max-h-full object-contain"
          onError={() => setErr(true)}
        />
      </div>
    );
  }
  return (
    <div className="w-14 h-14 bg-surface rounded border border-dashed border-gray-300 flex-shrink-0 flex items-center justify-center">
      <span className="font-mono text-gray-400 text-xs font-semibold text-center leading-tight px-1">
        {code || '?'}
      </span>
    </div>
  );
}

export default function FastenerCard({ fastener, selected, onSelect, onEdit, onDelete }) {
  const badge = TOOL_BADGES[fastener.tool_type] || TOOL_BADGES.Other;

  return (
    <div
      className={`bg-white border rounded-lg shadow-sm card-hover p-4 flex flex-col gap-3 ${
        selected ? 'border-blue-400 ring-1 ring-blue-400' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start gap-3">
        <label className="flex items-center mt-1 cursor-pointer flex-shrink-0">
          <input
            type="checkbox"
            checked={selected}
            onChange={e => onSelect(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
          />
        </label>
        <DrawingThumb drawingPath={fastener.drawing_path} code={fastener.standard_code} />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-mono font-bold text-charcoal text-lg leading-none">
              {fastener.metric}
            </span>
            {fastener.length_mm != null && (
              <span className="font-mono text-gray-500 text-sm">× {fastener.length_mm}mm</span>
            )}
          </div>
          {fastener.standard_code && (
            <p className="font-mono text-xs text-gray-400 mt-0.5">{fastener.standard_code}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className={`px-2 py-0.5 rounded text-xs font-mono font-medium ${badge.bg} ${badge.text}`}>
          {fastener.tool_type}
        </span>
        <span
          className={`px-2 py-0.5 rounded text-xs font-mono font-medium ${
            fastener.quantity === 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
          }`}
        >
          qty: {fastener.quantity}
        </span>
        {fastener.quantity === 0 && (
          <span className="text-xs text-red-500 font-mono">⚠ out of stock</span>
        )}
      </div>

      {fastener.notes && (
        <p className="text-xs text-gray-400 leading-relaxed truncate">{fastener.notes}</p>
      )}

      <div className="flex gap-2 pt-1 border-t border-gray-100">
        <button
          onClick={() => onEdit(fastener)}
          className="px-3 py-1.5 text-xs font-mono font-medium rounded border border-gray-300 text-gray-700 hover:bg-surface hover:border-gray-400 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(fastener)}
          className="px-3 py-1.5 text-xs font-mono font-medium rounded bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors ml-auto"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
