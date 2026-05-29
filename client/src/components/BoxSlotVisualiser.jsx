import React from 'react';

const BOX_DIMS = {
  SMALL: { w: 135, h: 52 },
  LARGE: { w: 180, h: 70 },
};

export default function BoxSlotVisualiser({ size = 'SMALL', divisions = 1, slots = [], onSlotClick }) {
  const { w, h } = BOX_DIMS[size] || BOX_DIMS.SMALL;
  const slotW = w / divisions;

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{ display: 'block', overflow: 'visible' }}
    >
      {/* Outer border background */}
      <rect x="0.5" y="0.5" width={w - 1} height={h - 1} rx="4" fill="#f9fafb" stroke="#d1d5db" strokeWidth="1" />

      {Array.from({ length: divisions }, (_, i) => {
        const slot = slots.find(s => s.slot_index === i);
        const hasFastener = slot && slot.fastener_id;
        const x = i * slotW;
        const isFirst = i === 0;
        const isLast = i === divisions - 1;

        const rectX = x + (isFirst ? 1 : 0);
        const rectW = slotW - (isFirst ? 1 : 0) - (isLast ? 1 : 0);

        return (
          <g
            key={i}
            onClick={() => onSlotClick && onSlotClick(i)}
            style={{ cursor: onSlotClick ? 'pointer' : 'default' }}
          >
            {/* Slot fill */}
            <rect
              x={rectX}
              y={1}
              width={rectW}
              height={h - 2}
              fill={hasFastener ? '#eff6ff' : '#fafafa'}
            />

            {/* Divider line (between slots) */}
            {!isLast && (
              <line
                x1={x + slotW}
                y1={4}
                x2={x + slotW}
                y2={h - 4}
                stroke="#d1d5db"
                strokeWidth="0.75"
              />
            )}

            {/* Slot index chip */}
            <text
              x={x + 5}
              y={9}
              fontSize="5.5"
              fontFamily="monospace"
              fill="#c0c0c0"
            >
              {i + 1}
            </text>

            {hasFastener ? (
              <>
                <text
                  x={x + slotW / 2}
                  y={h / 2 - 2}
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                  fill="#1a1a1a"
                >
                  {slot.metric}
                </text>
                {slot.length_mm != null && (
                  <text
                    x={x + slotW / 2}
                    y={h / 2 + 9}
                    fontSize="6.5"
                    fontFamily="monospace"
                    textAnchor="middle"
                    fill="#6b7280"
                  >
                    ×{slot.length_mm}mm
                  </text>
                )}
                {slot.standard_code && (
                  <text
                    x={x + slotW / 2}
                    y={h - 5}
                    fontSize="5.5"
                    fontFamily="monospace"
                    textAnchor="middle"
                    fill="#9ca3af"
                  >
                    {slot.standard_code}
                  </text>
                )}
              </>
            ) : (
              <>
                <text
                  x={x + slotW / 2}
                  y={h / 2 + 4}
                  fontSize="6"
                  fontFamily="monospace"
                  textAnchor="middle"
                  fill="#d1d5db"
                >
                  — empty —
                </text>
              </>
            )}
          </g>
        );
      })}

      {/* Re-draw outer border on top so it's crisp */}
      <rect
        x="0.5"
        y="0.5"
        width={w - 1}
        height={h - 1}
        rx="4"
        fill="none"
        stroke="#d1d5db"
        strokeWidth="1"
      />
    </svg>
  );
}
