import React from 'react';
import BoxSlotVisualiser from './BoxSlotVisualiser.jsx';

export default function BoxCard({ box, standardMap, onEdit, onDelete, onSlotClick }) {
  const standard = box.standardId ? standardMap[box.standardId] : null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm card-hover p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-mono font-bold text-charcoal text-base leading-tight">{box.name}</h3>
          {standard
            ? <p className="font-mono text-xs text-blue-600 mt-0.5">{standard.code} — {standard.description}</p>
            : <p className="font-mono text-xs text-gray-400 mt-0.5">No standard</p>}
          {box.location && <p className="font-mono text-xs text-gray-400 mt-0.5">{box.location}</p>}
        </div>
        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-xs flex-shrink-0">{box.divisions}×</span>
      </div>

      <div className="flex justify-center py-1">
        <BoxSlotVisualiser divisions={box.divisions} slots={box.slots || []}
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
