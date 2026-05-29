import React from 'react';

const W = 180, H = 60;

export default function BoxSlotVisualiser({ divisions = 1, slots = [], onSlotClick }) {
  const slotW = W / divisions;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      <rect x=".5" y=".5" width={W - 1} height={H - 1} rx="4" fill="#f9fafb" stroke="#d1d5db" strokeWidth="1" />

      {Array.from({ length: divisions }, (_, i) => {
        const slot = slots.find(s => s.slotIndex === i) || {};
        const filled = !!(slot.metric);
        const x = i * slotW;

        return (
          <g key={i} onClick={() => onSlotClick?.(i)} style={{ cursor: onSlotClick ? 'pointer' : 'default' }}>
            <rect x={x + (i === 0 ? 1 : 0)} y={1}
              width={slotW - (i === 0 ? 1 : 0) - (i === divisions - 1 ? 1 : 0)}
              height={H - 2}
              fill={filled ? '#eff6ff' : '#fafafa'} />

            {i < divisions - 1 && (
              <line x1={x + slotW} y1={4} x2={x + slotW} y2={H - 4} stroke="#d1d5db" strokeWidth=".75" />
            )}

            <text x={x + 4} y={9} fontSize="5.5" fontFamily="monospace" fill="#bbb">{i + 1}</text>

            {filled ? (
              <>
                <text x={x + slotW / 2} y={H / 2 - 2} fontSize="11" fontFamily="monospace"
                  fontWeight="bold" textAnchor="middle" fill="#1a1a1a">{slot.metric}</text>
                {slot.lengthMm != null && (
                  <text x={x + slotW / 2} y={H / 2 + 10} fontSize="7" fontFamily="monospace"
                    textAnchor="middle" fill="#6b7280">×{slot.lengthMm}mm</text>
                )}
              </>
            ) : (
              <text x={x + slotW / 2} y={H / 2 + 4} fontSize="6" fontFamily="monospace"
                textAnchor="middle" fill="#d1d5db">— empty —</text>
            )}
          </g>
        );
      })}

      <rect x=".5" y=".5" width={W - 1} height={H - 1} rx="4" fill="none" stroke="#d1d5db" strokeWidth="1" />
    </svg>
  );
}
