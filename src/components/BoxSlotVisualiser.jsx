import React from 'react';

const DIMS = { SMALL: { w: 135, h: 52 }, LARGE: { w: 180, h: 70 } };

export default function BoxSlotVisualiser({ size = 'SMALL', divisions = 1, slots = [], onSlotClick }) {
  const { w, h } = DIMS[size] || DIMS.SMALL;
  const slotW = w / divisions;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <rect x=".5" y=".5" width={w - 1} height={h - 1} rx="4" fill="#f9fafb" stroke="#d1d5db" strokeWidth="1" />

      {Array.from({ length: divisions }, (_, i) => {
        const slot = slots.find(s => s.slotIndex === i);
        const hasFastener = !!(slot?.metric);
        const x = i * slotW;

        return (
          <g key={i} onClick={() => onSlotClick?.(i)} style={{ cursor: onSlotClick ? 'pointer' : 'default' }}>
            <rect x={x + (i === 0 ? 1 : 0)} y={1}
              width={slotW - (i === 0 ? 1 : 0) - (i === divisions - 1 ? 1 : 0)}
              height={h - 2}
              fill={hasFastener ? '#eff6ff' : '#fafafa'} />

            {i < divisions - 1 && (
              <line x1={x + slotW} y1={4} x2={x + slotW} y2={h - 4} stroke="#d1d5db" strokeWidth=".75" />
            )}

            <text x={x + 4} y={9} fontSize="5.5" fontFamily="monospace" fill="#bbb">{i + 1}</text>

            {hasFastener ? (
              <>
                <text x={x + slotW / 2} y={h / 2 - 2} fontSize="10" fontFamily="monospace"
                  fontWeight="bold" textAnchor="middle" fill="#1a1a1a">{slot.metric}</text>
                {slot.lengthMm != null && (
                  <text x={x + slotW / 2} y={h / 2 + 9} fontSize="6.5" fontFamily="monospace"
                    textAnchor="middle" fill="#6b7280">×{slot.lengthMm}mm</text>
                )}
                {slot.standardCode && (
                  <text x={x + slotW / 2} y={h - 5} fontSize="5.5" fontFamily="monospace"
                    textAnchor="middle" fill="#9ca3af">{slot.standardCode}</text>
                )}
              </>
            ) : (
              <text x={x + slotW / 2} y={h / 2 + 4} fontSize="6" fontFamily="monospace"
                textAnchor="middle" fill="#d1d5db">— empty —</text>
            )}
          </g>
        );
      })}

      <rect x=".5" y=".5" width={w - 1} height={h - 1} rx="4" fill="none" stroke="#d1d5db" strokeWidth="1" />
    </svg>
  );
}
