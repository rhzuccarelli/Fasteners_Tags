import React from 'react';
import BoxSlotVisualiser from './BoxSlotVisualiser.jsx';

export default function BoxCard({ box, onEdit, onDelete, onSlotClick }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm card-hover p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-mono font-bold text-charcoal text-base leading-tight">{box.name}</h3>
          {box.location && (
            <p className="font-mono text-xs text-gray-400 mt-0.5">{box.location}</p>
          )}
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-mono text-xs">
            {box.size}
          </span>
          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-xs">
            {box.divisions}×
          </span>
        </div>
      </div>

      {/* Slot visualiser */}
      <div className="flex justify-center py-1">
        <BoxSlotVisualiser
          size={box.size}
          divisions={box.divisions}
          slots={box.slots || []}
          onSlotClick={idx => onSlotClick && onSlotClick(box, idx)}
        />
      </div>

      {/* Slot summary */}
      <div className="flex gap-1 flex-wrap">
        {(box.slots || []).map(slot => (
          <div
            key={slot.slot_index}
            className="flex-1 min-w-0 text-center"
            style={{ minWidth: 0 }}
          >
            {slot.fastener_id ? (
              <div className="bg-blue-50 border border-blue-100 rounded px-1 py-0.5">
                <div className="font-mono font-bold text-blue-800 text-xs leading-none">{slot.metric}</div>
                {slot.length_mm != null && (
                  <div className="font-mono text-blue-500 text-xs">×{slot.length_mm}</div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 border border-dashed border-gray-200 rounded px-1 py-0.5">
                <span className="text-gray-300 text-xs">—</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {box.notes && (
        <p className="text-xs text-gray-400 leading-relaxed truncate">{box.notes}</p>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1 border-t border-gray-100">
        <button
          onClick={() => onEdit(box)}
          className="px-3 py-1.5 text-xs font-mono font-medium rounded border border-gray-300 text-gray-700 hover:bg-surface hover:border-gray-400 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(box)}
          className="px-3 py-1.5 text-xs font-mono font-medium rounded bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors ml-auto"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
