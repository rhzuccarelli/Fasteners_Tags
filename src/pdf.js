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

// Drawing panel uses 3:5 portrait aspect ratio.
// Inner drawing height = TAG_H - 2mm padding; width = height * 3/5.
const DRAW_PAD = 1.5;
const DRAW_H = TAG_H - 2 * DRAW_PAD;
const DRAW_W = DRAW_H * 3 / 5;
const LEFT_W = DRAW_W + 2 * DRAW_PAD;

// ── Single fastener tag (50×15mm) ─────────────────────────────────────────
function drawSingleTag(doc, x, y, tag) {
  const { metric, lengthMm, standardCode, toolType, drawingDataUrl } = tag;

  // Left panel background
  doc.setFillColor(240, 240, 240);
  doc.rect(x, y, LEFT_W, TAG_H, 'F');

  // Drawing thumbnail — 3:5 portrait
  if (drawingDataUrl) {
    try {
      doc.addImage(drawingDataUrl, 'JPEG', x + DRAW_PAD, y + DRAW_PAD, DRAW_W, DRAW_H, '', 'FAST');
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

  // Right panel text — evenly spaced rows
  const rx = x + LEFT_W + 2;
  const rows = [
    { val: metric,                          size: 9,   bold: true,  color: [26, 26, 26] },
    lengthMm != null
      ? { val: `× ${lengthMm} mm`,          size: 7.5, bold: false, color: [85, 85, 85] }
      : null,
    standardCode
      ? { val: standardCode,                size: 6.5, bold: false, color: [102, 102, 102] }
      : null,
    toolType
      ? { val: toolType,                    size: 6,   bold: false, color: [153, 153, 153] }
      : null,
  ].filter(Boolean);
  const rowH = TAG_H / (rows.length + 1);
  rows.forEach(({ val, size, bold, color }, idx) => {
    const ry = y + rowH * (idx + 1);
    doc.setFontSize(size);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setTextColor(...color);
    doc.text(val, rx, ry);
  });

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

// ── Box tag (50×15mm) — left panel: standard drawing+code; right: slot columns ──
function drawBoxTag(doc, x, y, tag) {
  const { standardCode, drawingDataUrl, toolType, divisions = 1, slots = [] } = tag;
  const slotAreaX = x + LEFT_W;
  const slotAreaW = TAG_W - LEFT_W;
  const colW = slotAreaW / divisions;

  // Left panel — standard drawing (3:5) shared by all slots
  doc.setFillColor(240, 240, 240);
  doc.rect(x, y, LEFT_W, TAG_H, 'F');

  if (drawingDataUrl) {
    try {
      doc.addImage(drawingDataUrl, 'JPEG', x + DRAW_PAD, y + DRAW_PAD, DRAW_W, DRAW_H, '', 'FAST');
    } catch (_) {}
  }
  if (standardCode) {
    doc.setFontSize(4); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80);
    doc.text(standardCode, x + LEFT_W / 2, y + TAG_H - (toolType ? 2.5 : 1.5), { align: 'center' });
  }
  if (toolType) {
    doc.setFontSize(3.5); doc.setTextColor(150, 150, 150);
    doc.text(toolType, x + LEFT_W / 2, y + TAG_H - 1, { align: 'center' });
  }

  // Divider
  doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.15);
  doc.line(x + LEFT_W, y, x + LEFT_W, y + TAG_H);

  // Slot columns — metric + length only
  for (let i = 0; i < divisions; i++) {
    const cx = slotAreaX + i * colW;
    const cxMid = cx + colW / 2;
    const slot = slots[i] || {};
    const even = i % 2 === 0;
    doc.setFillColor(even ? 250 : 255, even ? 250 : 255, even ? 250 : 255);
    doc.rect(cx, y, colW, TAG_H, 'F');

    if (i > 0) {
      doc.setDrawColor(229, 229, 229); doc.setLineWidth(0.1);
      doc.line(cx, y + 0.5, cx, y + TAG_H - 0.5);
    }

    if (slot.metric) {
      const hasLen = slot.lengthMm != null;
      const midY = y + TAG_H / 2;
      doc.setFontSize(6); doc.setFont('helvetica', 'bold'); doc.setTextColor(26, 26, 26);
      doc.text(slot.metric, cxMid, hasLen ? midY - 0.5 : midY + 1.5, { align: 'center' });
      if (hasLen) {
        doc.setFontSize(5); doc.setFont('helvetica', 'normal'); doc.setTextColor(85, 85, 85);
        doc.text(`×${slot.lengthMm}mm`, cxMid, midY + 4, { align: 'center' });
      }
    } else {
      doc.setFontSize(5); doc.setTextColor(204, 204, 204);
      doc.text('—', cxMid, y + TAG_H / 2 + 1, { align: 'center' });
    }
  }

  doc.setDrawColor(60, 60, 60); doc.setLineWidth(0.2);
  doc.rect(x, y, TAG_W, TAG_H);
}

// ── Public export function ────────────────────────────────────────────────
export function exportTagsPDF(items, type, standardMap) {
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
      const std = item.standardId ? standardMap[item.standardId] : null;
      drawBoxTag(doc, tx, ty, {
        standardCode: std?.code ?? null,
        drawingDataUrl: std?.drawingDataUrl ?? null,
        toolType: null,
        divisions: item.divisions,
        slots: item.slots || [],
      });
    } else {
      const std = item.standardId ? standardMap[item.standardId] : null;
      drawSingleTag(doc, tx, ty, {
        metric: item.metric,
        lengthMm: item.lengthMm ?? null,
        standardCode: std?.code ?? null,
        toolType: item.toolType,
        drawingDataUrl: std?.drawingDataUrl ?? null,
      });
    }
  });

  doc.save('fastener-tags.pdf');
}
