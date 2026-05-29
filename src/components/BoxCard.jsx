import React from 'react';
import BoxSlotVisualiser from './BoxSlotVisualiser.jsx';

export default function BoxCard({ box, fastenerMap, standardMap, onEdit, onDelete, onSlotClick }) {
  const enriched = (box.slots || []).map(s => {
    const f = s.fastenerId ? fastenerMap[s.fastenerId] : null;
    const std = f?.standardId ? standardMap[f.standardId] : null;
    return f ? { ...s, metric: f.metric, lengthMm: f.lengthMm ?? null, standardCode: std?.code ?? null } : s;
  });

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm card-hover p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-mono font-bold text-charcoal text-base leading-tight">{box.name}</h3>
          {box.location && <p className="font-mono text-xs text-gray-400 mt-0.5">{box.location}</p>}
        </div>
        <div className="flex gap-1.5">
          <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-mono text-xs">{box.size}</span>
          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-xs">{box.divisions}×</span>
        </div>
      </div>

      <div className="flex justify-center py-1">
        <BoxSlotVisualiser size={box.size} divisions={box.divisions} slots={enriched}
          onSlotClick={i => onSlotClick?.(box, i)} />
      </div>

      {box.notes && <p className="text-xs text-gray-400 truncate">{box.notes}</p>}

      <div className="flex gap-2 pt-1 border-t border-gray-100">
        <button onClick={() => onEdit(box)}
          className="px-3 py-1.5 text-xs font-mono font-medium rounded border border-gray-300 text-gray-700 hover:bg-surface transition-colors">
          Edit
        </button>
        <button onClick={() => onDelete(box)}
          className="px-3 py-1.5 text-xs font-mono font-medium rounded bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors ml-auto">
          Delete
        </button>
      </div>
    </div>
  );
}
