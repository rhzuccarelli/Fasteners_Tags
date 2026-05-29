// jsPDF-based tag generator — runs entirely in the browser

import { jsPDF } from 'jspdf';

const TAG_W = 50;   // mm
const TAG_H = 15;   // mm
const GAP   = 5;    // mm between tags
const MARGIN = 10;  // mm page margin
const PAGE_W = 210;
const PAGE_H = 297;

const COLS         = Math.floor((PAGE_W - 2 * MARGIN + GAP) / (TAG_W + GAP)); // 3
const ROWS_PER_PAGE = Math.floor((PAGE_H - 2 * MARGIN + GAP) / (TAG_H + GAP)); // 13
const PER_PAGE     = COLS * ROWS_PER_PAGE;

// ── Single fastener tag (50×15mm) ─────────────────────────────────────────
function drawSingleTag(doc, x, y, tag) {
  const LEFT_W = 20;
  const { metric, lengthMm, standardCode, toolType, quantity, drawingDataUrl } = tag;

  // Left panel
  doc.setFillColor(240, 240, 240);
  doc.rect(x, y, LEFT_W, TAG_H, 'F');

  // Drawing thumbnail
  if (drawingDataUrl) {
    try {
      doc.addImage(drawingDataUrl, 'JPEG', x + 1.5, y + 1.5, LEFT_W - 3, TAG_H - 3, '', 'FAST');
    } catch (_) {
      doc.setFontSize(5); doc.setTextColor(150, 150, 150);
      doc.text(standardCode || '', x + LEFT_W / 2, y + TAG_H / 2 + 1, { align: 'center' });
    }
  } else {
    doc.setFontSize(5); doc.setTextColor(150, 150, 150);
    doc.text(standardCode || '—', x + LEFT_W / 2, y + TAG_H / 2 + 1, { align: 'center' });
  }

  // Divider
  doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.15);
  doc.line(x + LEFT_W, y, x + LEFT_W, y + TAG_H);

  // Right panel text
  const rx = x + LEFT_W + 2;

  doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(26, 26, 26);
  doc.text(metric || '', rx, y + 5.5);

  if (lengthMm != null) {
    const mw = doc.getTextWidth(metric || '');
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(85, 85, 85);
    doc.text(`× ${lengthMm}mm`, rx + mw + 0.8, y + 5.5);
  }

  if (standardCode) {
    doc.setFontSize(6.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(102, 102, 102);
    doc.text(standardCode, rx, y + 8.5);
  }

  doc.setFontSize(6); doc.setTextColor(153, 153, 153);
  doc.text(`${toolType || ''} · qty ${quantity ?? '—'}`, rx, y + 11.5);

  // Watermark
  doc.setFontSize(4.5); doc.setTextColor(215, 215, 215);
  const wm = 'FastenerTracker';
  doc.text(wm, x + TAG_W - doc.getTextWidth(wm) - 1, y + TAG_H - 1.5);

  // Border
  doc.setDrawColor(180, 180, 180); doc.setLineWidth(0.15);
  doc.rect(x, y, TAG_W, TAG_H);

  // Corner cut ticks
  const T = 1.5;
  doc.setDrawColor(160, 160, 160); doc.setLineWidth(0.15);
  [[x, y, -T, 0], [x, y, 0, -T],
   [x + TAG_W, y, T, 0], [x + TAG_W, y, 0, -T],
   [x, y + TAG_H, -T, 0], [x, y + TAG_H, 0, T],
   [x + TAG_W, y + TAG_H, T, 0], [x + TAG_W, y + TAG_H, 0, T]].forEach(([px, py, dx, dy]) => {
    doc.line(px, py, px + dx, py + dy);
  });
}

// ── Box tag (50×15mm) ─────────────────────────────────────────────────────
function drawBoxTag(doc, x, y, tag) {
  const HEADER_H = 4;
  const BODY_H = TAG_H - HEADER_H;
  const { boxName, divisions = 1, slots = [] } = tag;
  const colW = TAG_W / divisions;

  // Header
  doc.setFillColor(26, 26, 26);
  doc.rect(x, y, TAG_W, HEADER_H, 'F');
  doc.setFontSize(6); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
  doc.text((boxName || '').slice(0, 30), x + TAG_W / 2, y + 2.8, { align: 'center' });

  for (let i = 0; i < divisions; i++) {
    const cx = x + i * colW;
    const slot = slots[i] || {};
    const even = i % 2 === 0;
    doc.setFillColor(even ? 248 : 255, even ? 248 : 255, even ? 248 : 255);
    doc.rect(cx, y + HEADER_H, colW, BODY_H, 'F');

    if (i > 0) {
      doc.setDrawColor(229, 229, 229); doc.setLineWidth(0.1);
      doc.line(cx, y + HEADER_H + 0.5, cx, y + TAG_H - 0.5);
    }

    const thumbW = Math.min(colW * 0.38, 8);
    if (slot.drawingDataUrl) {
      try {
        doc.addImage(slot.drawingDataUrl, 'JPEG', cx + 0.5, y + HEADER_H + 0.5,
          thumbW, BODY_H - 1, '', 'FAST');
      } catch (_) {}
    }

    const tx = cx + thumbW + 1;
    if (slot.metric) {
      doc.setFontSize(6); doc.setFont('helvetica', 'bold'); doc.setTextColor(26, 26, 26);
      doc.text(slot.metric, tx, y + HEADER_H + 3.5);
      if (slot.lengthMm != null) {
        doc.setFontSize(5); doc.setFont('helvetica', 'normal'); doc.setTextColor(102, 102, 102);
        doc.text(`×${slot.lengthMm}`, tx, y + HEADER_H + 6);
      }
      if (slot.standardCode) {
        doc.setFontSize(5); doc.setTextColor(153, 153, 153);
        doc.text(slot.standardCode, tx, y + TAG_H - 1.5);
      }
    } else {
      doc.setFontSize(5); doc.setTextColor(204, 204, 204);
      doc.text('—', cx + colW / 2, y + HEADER_H + BODY_H / 2 + 1, { align: 'center' });
    }
  }

  doc.setDrawColor(60, 60, 60); doc.setLineWidth(0.2);
  doc.rect(x, y, TAG_W, TAG_H);
}

// ── Public export function ────────────────────────────────────────────────
export function exportTagsPDF(items, type, fastenerMap, standardMap) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  items.forEach((item, i) => {
    const pageNum   = Math.floor(i / PER_PAGE);
    const posOnPage = i % PER_PAGE;
    if (pageNum > 0 && posOnPage === 0) doc.addPage();

    const col = posOnPage % COLS;
    const row = Math.floor(posOnPage / COLS);
    const tx  = MARGIN + col * (TAG_W + GAP);
    const ty  = MARGIN + row * (TAG_H + GAP);

    if (type === 'box') {
      const enrichedSlots = (item.slots || []).map(s => {
        const f = s.fastenerId ? fastenerMap[s.fastenerId] : null;
        const std = f?.standardId ? standardMap[f.standardId] : null;
        return f ? {
          ...s,
          metric: f.metric,
          lengthMm: f.lengthMm ?? null,
          standardCode: std?.code ?? null,
          drawingDataUrl: std?.drawingDataUrl ?? null,
        } : s;
      });
      drawBoxTag(doc, tx, ty, { boxName: item.name, divisions: item.divisions, slots: enrichedSlots });
    } else {
      const std = item.standardId ? standardMap[item.standardId] : null;
      drawSingleTag(doc, tx, ty, {
        metric: item.metric,
        lengthMm: item.lengthMm ?? null,
        standardCode: std?.code ?? null,
        toolType: item.toolType,
        quantity: item.quantity,
        drawingDataUrl: std?.drawingDataUrl ?? null,
      });
    }
  });

  doc.save('fastener-tags.pdf');
}
