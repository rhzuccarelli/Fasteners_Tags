import React, { useState } from 'react';

/* Scale factor: 1mm = 4px → tag 50×15mm → 200×60px */
const SCALE = 4;
const W = 50 * SCALE; // 200px
const H = 15 * SCALE; // 60px
const LEFT_W = 20 * SCALE; // 80px

function SingleTag({ tag }) {
  const [imgErr, setImgErr] = useState(false);
  const src = tag.drawing_path;

  return (
    <div
      className="tag-preview-wrapper relative"
      style={{
        width: W,
        height: H,
        border: '1px solid #ccc',
        display: 'flex',
        fontFamily: "'Roboto Mono', monospace",
        fontSize: '6px',
        background: '#fff',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Corner tick marks */}
      <svg
        width={W}
        height={H}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}
      >
        {[
          [0, 0, 6, 0], [0, 0, 0, 6],
          [W, 0, W - 6, 0], [W, 0, W, 6],
          [0, H, 6, H], [0, H, 0, H - 6],
          [W, H, W - 6, H], [W, H, W, H - 6],
        ].map(([x1, y1, x2, y2], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#aaa" strokeWidth="0.5" />
        ))}
      </svg>

      {/* Left panel – drawing */}
      <div
        style={{
          width: LEFT_W,
          height: '100%',
          background: '#f0f0f0',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRight: '0.5px solid #ccc',
          padding: '4px',
          boxSizing: 'border-box',
        }}
      >
        {src && !imgErr ? (
          <img
            src={src}
            alt=""
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            onError={() => setImgErr(true)}
          />
        ) : (
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: '7px',
              color: '#999',
              textAlign: 'center',
              lineHeight: 1.2,
            }}
          >
            {tag.standard_code || 'DXF'}
          </span>
        )}
      </div>

      {/* Right panel – text */}
      <div
        style={{
          flex: 1,
          padding: '4px 5px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxSizing: 'border-box',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#1a1a1a', lineHeight: 1 }}>
            {tag.metric}
            {tag.length_mm != null && (
              <span style={{ fontWeight: 'normal', fontSize: '9px', color: '#555', marginLeft: 3 }}>
                × {tag.length_mm}mm
              </span>
            )}
          </div>
          {tag.standard_code && (
            <div style={{ fontSize: '8px', color: '#555', marginTop: 2 }}>{tag.standard_code}</div>
          )}
        </div>
        <div style={{ fontSize: '7px', color: '#999' }}>
          {tag.tool_type} · qty {tag.quantity ?? '—'}
        </div>

        {/* Watermark */}
        <div
          style={{
            position: 'absolute',
            bottom: 3,
            right: 4,
            fontSize: '5px',
            color: '#ddd',
            fontFamily: 'monospace',
          }}
        >
          FastenerTracker
        </div>
      </div>
    </div>
  );
}

function BoxTag({ tag }) {
  const { box_name, divisions = 1, slots = [] } = tag;
  const HEADER_H = 16;
  const COL_W = W / divisions;

  return (
    <div
      className="tag-preview-wrapper"
      style={{
        width: W,
        height: H,
        border: '1px solid #ccc',
        fontFamily: "'Roboto Mono', monospace",
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: '#1a1a1a',
          height: HEADER_H,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ color: '#fff', fontSize: '7px', fontWeight: 'bold', letterSpacing: '0.05em' }}>
          {box_name}
        </span>
      </div>

      {/* Slots row */}
      <div style={{ display: 'flex', height: H - HEADER_H }}>
        {Array.from({ length: divisions }, (_, i) => {
          const slot = slots[i];
          const hasFastener = slot && slot.metric;
          const bg = i % 2 === 0 ? '#f8f8f8' : '#fff';

          return (
            <div
              key={i}
              style={{
                width: COL_W,
                height: '100%',
                background: bg,
                borderLeft: i > 0 ? '0.5px solid #e5e5e5' : 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2px',
                boxSizing: 'border-box',
                overflow: 'hidden',
              }}
            >
              {hasFastener ? (
                <>
                  <span style={{ fontWeight: 'bold', fontSize: '8px', color: '#1a1a1a', lineHeight: 1 }}>
                    {slot.metric}
                  </span>
                  {slot.length_mm != null && (
                    <span style={{ fontSize: '6px', color: '#666' }}>×{slot.length_mm}</span>
                  )}
                  {slot.standard_code && (
                    <span style={{ fontSize: '5.5px', color: '#aaa' }}>{slot.standard_code}</span>
                  )}
                </>
              ) : (
                <span style={{ fontSize: '6px', color: '#ccc' }}>—</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TagPreview({ tag, type = 'single' }) {
  if (!tag) return null;
  if (type === 'box') return <BoxTag tag={tag} />;
  return <SingleTag tag={tag} />;
}
