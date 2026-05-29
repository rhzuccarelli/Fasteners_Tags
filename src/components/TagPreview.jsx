import React, { useState } from 'react';

// Rendered at 4× scale: 200×60px for 50×15mm
const S = 4;
const W = 50 * S, H = 15 * S, LW = 20 * S;

function SingleTag({ tag }) {
  const [err, setErr] = useState(false);
  const { metric, lengthMm, standardCode, toolType, quantity, drawingDataUrl } = tag;

  return (
    <div style={{ width: W, height: H, border: '1px solid #ccc', display: 'flex',
      fontFamily: 'Roboto Mono, monospace', overflow: 'hidden', position: 'relative', background: '#fff' }}>
      {/* Left panel */}
      <div style={{ width: LW, height: '100%', background: '#f0f0f0', flexShrink: 0,
        borderRight: '.5px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4 }}>
        {drawingDataUrl && !err
          ? <img src={drawingDataUrl} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} onError={() => setErr(true)} />
          : <span style={{ fontFamily: 'monospace', fontSize: 7, color: '#999', textAlign: 'center' }}>{standardCode || '—'}</span>
        }
      </div>
      {/* Right panel */}
      <div style={{ flex: 1, padding: '4px 5px', display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', overflow: 'hidden', position: 'relative' }}>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: 11, color: '#1a1a1a', lineHeight: 1 }}>
            {metric}
            {lengthMm != null && <span style={{ fontWeight: 'normal', fontSize: 9, color: '#555', marginLeft: 3 }}>× {lengthMm}mm</span>}
          </div>
          {standardCode && <div style={{ fontSize: 8, color: '#555', marginTop: 2 }}>{standardCode}</div>}
        </div>
        <div style={{ fontSize: 7, color: '#999' }}>{toolType} · qty {quantity ?? '—'}</div>
        <div style={{ position: 'absolute', bottom: 3, right: 4, fontSize: 5, color: '#ddd' }}>FastenerTracker</div>
      </div>
      {/* Cut tick marks */}
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {[[0,0,6,0],[0,0,0,6],[W,0,W-6,0],[W,0,W,6],[0,H,6,H],[0,H,0,H-6],[W,H,W-6,H],[W,H,W,H-6]]
          .map(([x1,y1,x2,y2],i) => <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#aaa" strokeWidth=".5"/>)}
      </svg>
    </div>
  );
}

function BoxTag({ tag }) {
  const { boxName, divisions = 1, slots = [] } = tag;
  const HEADER = 16;
  const colW = W / divisions;

  return (
    <div style={{ width: W, height: H, border: '1px solid #ccc', fontFamily: 'Roboto Mono, monospace', overflow: 'hidden' }}>
      <div style={{ background: '#1a1a1a', height: HEADER, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#fff', fontSize: 7, fontWeight: 'bold' }}>{boxName}</span>
      </div>
      <div style={{ display: 'flex', height: H - HEADER }}>
        {Array.from({ length: divisions }, (_, i) => {
          const slot = slots[i] || {};
          return (
            <div key={i} style={{ width: colW, height: '100%', background: i % 2 === 0 ? '#f8f8f8' : '#fff',
              borderLeft: i > 0 ? '.5px solid #e5e5e5' : 'none',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 2, overflow: 'hidden' }}>
              {slot.metric ? (
                <>
                  <span style={{ fontWeight: 'bold', fontSize: 8, color: '#1a1a1a', lineHeight: 1 }}>{slot.metric}</span>
                  {slot.lengthMm != null && <span style={{ fontSize: 6, color: '#666' }}>×{slot.lengthMm}</span>}
                  {slot.standardCode && <span style={{ fontSize: 5.5, color: '#aaa' }}>{slot.standardCode}</span>}
                </>
              ) : <span style={{ fontSize: 6, color: '#ccc' }}>—</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TagPreview({ tag, type = 'single' }) {
  if (!tag) return null;
  return type === 'box' ? <BoxTag tag={tag} /> : <SingleTag tag={tag} />;
}
