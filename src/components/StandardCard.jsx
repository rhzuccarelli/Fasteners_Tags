import React, { useState } from 'react';

function DrawingThumb({ dataUrl, code }) {
  const [err, setErr] = useState(false);
  if (dataUrl && !err) {
    return (
      <div className="w-full h-28 bg-surface rounded overflow-hidden flex items-center justify-center border border-gray-200">
        <img src={dataUrl} alt={code} className="max-w-full max-h-full object-contain" onError={() => setErr(true)} />
      </div>
    );
  }
  return (
    <div className="w-full h-28 bg-surface rounded flex items-center justify-center border border-dashed border-gray-300">
      <span className="font-mono text-gray-400 text-sm font-semibold tracking-wider">{code}</span>
    </div>
  );
}

export default function StandardCard({ standard, onEdit, onDelete, onUploadDrawing }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm card-hover p-4 flex flex-col gap-3">
      <DrawingThumb dataUrl={standard.drawingDataUrl} code={standard.code} />
      <div>
        <h3 className="font-mono font-bold text-charcoal text-base tracking-wide">{standard.code}</h3>
        {standard.description && <p className="text-gray-500 text-xs mt-0.5">{standard.description}</p>}
      </div>
      <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-100">
        <button onClick={() => onEdit(standard)}
          className="px-3 py-1.5 text-xs font-mono font-medium rounded border border-gray-300 text-gray-700 hover:bg-surface transition-colors">
          Edit
        </button>
        <button onClick={() => onUploadDrawing(standard)}
          className="px-3 py-1.5 text-xs font-mono font-medium rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors">
          {standard.drawingDataUrl ? 'Replace Drawing' : 'Upload Drawing'}
        </button>
        <button onClick={() => onDelete(standard)}
          className="px-3 py-1.5 text-xs font-mono font-medium rounded bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors ml-auto">
          Delete
        </button>
      </div>
    </div>
  );
}
