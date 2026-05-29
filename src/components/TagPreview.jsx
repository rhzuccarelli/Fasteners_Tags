import React, { useState } from 'react';

// Rendered at 3× scale: 150×45px for 50×15mm
const S = 3;
const W = 50 * S, H = 15 * S;
// Drawing panel: 3:5 aspect ratio (portrait). Inner image height = H - 8px padding → imgH.
// imgW = imgH * 3/5, panelW = imgW + 8px padding.
const IMG_H = H - 8;
const IMG_W = Math.round(IMG_H * 3 / 5);
const LW = IMG_W + 8;

function SingleTag({ tag }) {
  const [err, setErr] = useState(false);
  const { metric, lengthMm, standardCode, toolType, drawingDataUrl } = tag;

  return (
    <div style={{ width: W, height: H, border: '1px solid #ccc', display: 'flex',
      fontFamily: 'Roboto Mono, monospace', overflow: 'hidden', position: 'relative', background: '#fff' }}>
      {/* Left panel — 3:5 drawing */}
      <div style={{ width: LW, height: '100%', background: '#f0f0f0', flexShrink: 0,
        borderRight: '.5px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {drawingDataUrl && !err
          ? <img src={drawingDataUrl} alt=""
              style={{ width: IMG_W, height: IMG_H, objectFit: 'contain' }}
              onError={() => setErr(true)} />
          : <span style={{ fontFamily: 'monospace', fontSize: 7, color: '#999', textAlign: 'center' }}>{standardCode || '—'}</span>
        }
      </div>
      {/* Right panel */}
      <div style={{ flex: 1, padding: '3px 5px', display: 'flex', flexDirection: 'column',
        justifyContent: 'space-around', overflow: 'hidden' }}>
        <div style={{ fontWeight: 'bold', fontSize: 11, color: '#1a1a1a', lineHeight: 1 }}>{metric}</div>
        {lengthMm != null && (
          <div style={{ fontSize: 9, color: '#555' }}>× {lengthMm} mm</div>
        )}
        {standardCode && <div style={{ fontSize: 8, color: '#444' }}>{standardCode}</div>}
        {toolType && <div style={{ fontSize: 7, color: '#888' }}>{toolType}</div>}
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
  const [imgErr, setImgErr] = useState(false);
  const { standardCode, drawingDataUrl, toolType, divisions = 1, slots = [] } = tag;
  // Left panel: standard drawing (3:5) + code — same proportions as SingleTag
  const colW = (W - LW) / divisions;

  return (
    <div style={{ width: W, height: H, border: '1px solid #ccc', display: 'flex',
      fontFamily: 'Roboto Mono, monospace', overflow: 'hidden', position: 'relative', background: '#fff' }}>
      {/* Left panel — standard drawing shared by all slots */}
      <div style={{ width: LW, height: '100%', background: '#f0f0f0', flexShrink: 0,
        borderRight: '.5px solid #ccc', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 1, padding: '2px 2px' }}>
        {drawingDataUrl && !imgErr
          ? <img src={drawingDataUrl} alt=""
              style={{ width: IMG_W, height: IMG_H, objectFit: 'contain' }}
              onError={() => setImgErr(true)} />
          : null}
        {standardCode && (
          <span style={{ fontSize: 5, color: '#666', textAlign: 'center', lineHeight: 1.1, whiteSpace: 'nowrap' }}>{standardCode}</span>
        )}
        {toolType && (
          <span style={{ fontSize: 4.5, color: '#aaa', textAlign: 'center', whiteSpace: 'nowrap' }}>{toolType}</span>
        )}
      </div>
      {/* Slot columns — metric + length only */}
      {Array.from({ length: divisions }, (_, i) => {
        const slot = slots[i] || {};
        return (
          <div key={i} style={{ width: colW, height: '100%',
            background: i % 2 === 0 ? '#fafafa' : '#fff',
            borderLeft: '.5px solid #e5e5e5',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', padding: '1px', gap: 1, textAlign: 'center' }}>
            {slot.metric ? (
              <>
                <span style={{ fontWeight: 'bold', fontSize: 8, color: '#1a1a1a', lineHeight: 1, whiteSpace: 'nowrap' }}>{slot.metric}</span>
                {slot.lengthMm != null && <span style={{ fontSize: 6.5, color: '#555', whiteSpace: 'nowrap' }}>×{slot.lengthMm}mm</span>}
              </>
            ) : <span style={{ fontSize: 6, color: '#ccc' }}>—</span>}
          </div>
        );
      })}
    </div>
  );
}

export default function TagPreview({ tag, type = 'single' }) {
  if (!tag) return null;
  return type === 'box' ? <BoxTag tag={tag} /> : <SingleTag tag={tag} />;
}
