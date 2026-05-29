#!/usr/bin/env python3
"""
Fastener Tracker — PDF tag generator.

Usage (stdin mode):
    echo '<json>' | python3 generate_tags.py
    → writes PDF binary to stdout

Usage (conversion mode):
    python3 generate_tags.py --convert-dxf INPUT OUTPUT
    python3 generate_tags.py --convert-pdf INPUT OUTPUT
"""

import sys
import os
import json
import base64
import io
import math

# ── Conversion modes ──────────────────────────────────────────────────────────

def convert_dxf(input_path, output_path):
    try:
        import ezdxf
        from ezdxf.addons.drawing import RenderContext, Frontend
        from ezdxf.addons.drawing.matplotlib import MatplotlibBackend
        import matplotlib
        matplotlib.use('Agg')
        import matplotlib.pyplot as plt
    except ImportError as e:
        print(f"ezdxf/matplotlib not available: {e}", file=sys.stderr)
        sys.exit(1)

    try:
        doc = ezdxf.readfile(input_path)
        msp = doc.modelspace()
        fig = plt.figure(figsize=(4, 4), dpi=150)
        ax = fig.add_axes([0, 0, 1, 1])
        ctx = RenderContext(doc)
        out = MatplotlibBackend(ax)
        Frontend(ctx, out).draw_layout(msp)
        ax.set_axis_off()
        plt.savefig(output_path, dpi=150, bbox_inches='tight',
                    facecolor='white', format='png')
        plt.close(fig)
        print(f"DXF converted: {output_path}", file=sys.stderr)
    except Exception as e:
        print(f"DXF conversion error: {e}", file=sys.stderr)
        sys.exit(1)


def convert_pdf(input_path, output_path):
    try:
        from pdf2image import convert_from_path
    except ImportError as e:
        print(f"pdf2image not available: {e}", file=sys.stderr)
        sys.exit(1)

    try:
        images = convert_from_path(input_path, dpi=150, first_page=1, last_page=1)
        if images:
            images[0].save(output_path, 'PNG')
            print(f"PDF converted: {output_path}", file=sys.stderr)
        else:
            print("PDF had no pages.", file=sys.stderr)
            sys.exit(1)
    except Exception as e:
        print(f"PDF conversion error: {e}", file=sys.stderr)
        sys.exit(1)


# ── PDF generation ────────────────────────────────────────────────────────────

def generate_pdf(payload):
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.units import mm
        from reportlab.pdfgen import canvas
        from reportlab.lib.utils import ImageReader
        from reportlab.lib.colors import HexColor, black, white, Color
    except ImportError as e:
        print(f"reportlab not available: {e}", file=sys.stderr)
        sys.exit(1)

    tag_type = payload.get('type', 'single')
    tags = payload.get('tags', [])

    # A4 dimensions
    PAGE_W, PAGE_H = A4  # points

    # Tag dimensions
    TAG_W = 50 * mm
    TAG_H = 15 * mm
    GAP_H = 5 * mm
    GAP_W = 5 * mm
    MARGIN = 10 * mm

    # Grid layout
    cols = int((PAGE_W - 2 * MARGIN + GAP_W) / (TAG_W + GAP_W))
    rows_per_page = int((PAGE_H - 2 * MARGIN + GAP_H) / (TAG_H + GAP_H))

    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)

    def draw_single_tag(x, y, tag):
        """Draw a single-fastener tag at (x, y) — bottom-left corner in points."""
        metric = tag.get('metric', '?')
        length_mm = tag.get('length_mm')
        standard_code = tag.get('standard_code') or ''
        tool_type = tag.get('tool_type') or ''
        quantity = tag.get('quantity')
        drawing_b64 = tag.get('drawing_b64')

        LEFT_W = 20 * mm
        RIGHT_W = TAG_W - LEFT_W

        # Outer border
        c.setStrokeColor(HexColor('#cccccc'))
        c.setLineWidth(0.5)
        c.rect(x, y, TAG_W, TAG_H, stroke=1, fill=0)

        # Left panel background
        c.setFillColor(HexColor('#f0f0f0'))
        c.rect(x, y, LEFT_W, TAG_H, stroke=0, fill=1)

        # Divider
        c.setStrokeColor(HexColor('#cccccc'))
        c.setLineWidth(0.3)
        c.line(x + LEFT_W, y, x + LEFT_W, y + TAG_H)

        # Drawing thumbnail
        if drawing_b64:
            try:
                img_data = base64.b64decode(drawing_b64)
                img_reader = ImageReader(io.BytesIO(img_data))
                pad = 1.5 * mm
                c.drawImage(img_reader, x + pad, y + pad,
                            width=LEFT_W - 2 * pad, height=TAG_H - 2 * pad,
                            preserveAspectRatio=True, anchor='c', mask='auto')
            except Exception:
                # Fallback: standard code text centred
                c.setFillColor(HexColor('#999999'))
                c.setFont('Helvetica', 5)
                c.drawCentredString(x + LEFT_W / 2, y + TAG_H / 2 - 2, standard_code[:8])
        else:
            c.setFillColor(HexColor('#999999'))
            c.setFont('Helvetica', 5)
            code_text = standard_code[:8] if standard_code else 'DXF'
            c.drawCentredString(x + LEFT_W / 2, y + TAG_H / 2 - 2, code_text)

        # Right panel content
        rx = x + LEFT_W + 2 * mm
        top = y + TAG_H

        # Metric (bold, 9pt)
        c.setFillColor(HexColor('#1a1a1a'))
        c.setFont('Helvetica-Bold', 9)
        c.drawString(rx, top - 4.5 * mm, metric)

        # Length (normal, 7pt) — on same line as metric
        if length_mm is not None:
            metric_w = c.stringWidth(metric, 'Helvetica-Bold', 9)
            c.setFont('Helvetica', 7)
            c.setFillColor(HexColor('#555555'))
            c.drawString(rx + metric_w + 1 * mm, top - 4.5 * mm, f'x {length_mm}mm')

        # Standard code
        if standard_code:
            c.setFont('Helvetica', 6.5)
            c.setFillColor(HexColor('#666666'))
            c.drawString(rx, top - 7.5 * mm, standard_code)

        # Tool + qty
        tool_qty = f'{tool_type}  ·  qty {quantity}' if quantity is not None else tool_type
        c.setFont('Helvetica', 6)
        c.setFillColor(HexColor('#999999'))
        c.drawString(rx, top - 10.5 * mm, tool_qty)

        # Watermark
        c.setFont('Helvetica', 4.5)
        c.setFillColor(HexColor('#dddddd'))
        wm = 'FastenerTracker'
        wm_w = c.stringWidth(wm, 'Helvetica', 4.5)
        c.drawString(x + TAG_W - wm_w - 1.5 * mm, y + 1.5 * mm, wm)

        # Corner tick marks
        tick = 1.5 * mm
        c.setStrokeColor(HexColor('#aaaaaa'))
        c.setLineWidth(0.3)
        # Bottom-left
        c.line(x - tick, y, x, y)
        c.line(x, y - tick, x, y)
        # Bottom-right
        c.line(x + TAG_W, y, x + TAG_W + tick, y)
        c.line(x + TAG_W, y - tick, x + TAG_W, y)
        # Top-left
        c.line(x - tick, y + TAG_H, x, y + TAG_H)
        c.line(x, y + TAG_H, x, y + TAG_H + tick)
        # Top-right
        c.line(x + TAG_W, y + TAG_H, x + TAG_W + tick, y + TAG_H)
        c.line(x + TAG_W, y + TAG_H, x + TAG_W, y + TAG_H + tick)

    def draw_box_tag(x, y, tag):
        """Draw a box label tag at (x, y)."""
        box_name = tag.get('box_name', 'Box')
        divisions = tag.get('divisions', 1)
        slots = tag.get('slots', [])

        HEADER_H = 4 * mm
        BODY_H = TAG_H - HEADER_H
        col_w = TAG_W / divisions

        # Outer border
        c.setStrokeColor(HexColor('#333333'))
        c.setLineWidth(0.5)
        c.rect(x, y, TAG_W, TAG_H, stroke=1, fill=0)

        # Header strip (black, at top)
        c.setFillColor(HexColor('#1a1a1a'))
        c.rect(x, y + BODY_H, TAG_W, HEADER_H, stroke=0, fill=1)

        # Box name in header
        c.setFont('Helvetica-Bold', 6)
        c.setFillColor(white)
        c.drawCentredString(x + TAG_W / 2, y + BODY_H + 1.2 * mm, box_name[:28])

        # Slot columns
        for i in range(divisions):
            slot_data = next((s for s in slots if s.get('slot_index') == i), None)
            cx = x + i * col_w

            # Alternating background
            bg = HexColor('#f8f8f8') if i % 2 == 0 else white
            c.setFillColor(bg)
            c.rect(cx, y, col_w, BODY_H, stroke=0, fill=1)

            # Divider
            if i > 0:
                c.setStrokeColor(HexColor('#e5e5e5'))
                c.setLineWidth(0.3)
                c.line(cx, y + 0.5 * mm, cx, y + BODY_H - 0.5 * mm)

            has_fastener = slot_data and slot_data.get('metric')

            # Drawing thumbnail (small, left portion of column)
            thumb_w = min(col_w * 0.38, 8 * mm)
            thumb_x = cx + 0.5 * mm
            thumb_y = y + 0.5 * mm
            thumb_h = BODY_H - 1 * mm

            if has_fastener and slot_data.get('drawing_b64'):
                try:
                    img_data = base64.b64decode(slot_data['drawing_b64'])
                    img_reader = ImageReader(io.BytesIO(img_data))
                    c.drawImage(img_reader, thumb_x, thumb_y,
                                width=thumb_w, height=thumb_h,
                                preserveAspectRatio=True, anchor='c', mask='auto')
                except Exception:
                    pass

            # Text (right of thumbnail)
            tx = cx + thumb_w + 1 * mm
            if has_fastener:
                metric = slot_data.get('metric', '')
                length = slot_data.get('length_mm')
                std = slot_data.get('standard_code') or ''

                c.setFont('Helvetica-Bold', 6)
                c.setFillColor(HexColor('#1a1a1a'))
                c.drawString(tx, y + BODY_H - 3.5 * mm, metric[:5])

                if length is not None:
                    c.setFont('Helvetica', 5)
                    c.setFillColor(HexColor('#666666'))
                    c.drawString(tx, y + BODY_H - 6 * mm, f'x{length}')

                if std:
                    c.setFont('Helvetica', 5)
                    c.setFillColor(HexColor('#999999'))
                    c.drawString(tx, y + 1.5 * mm, std[:8])
            else:
                c.setFont('Helvetica', 5)
                c.setFillColor(HexColor('#cccccc'))
                c.drawCentredString(cx + col_w / 2, y + BODY_H / 2 - 1.5 * mm, '—')

        # Re-draw outer border on top
        c.setStrokeColor(HexColor('#333333'))
        c.setLineWidth(0.5)
        c.rect(x, y, TAG_W, TAG_H, stroke=1, fill=0)

    # ── Render tags ───────────────────────────────────────────────────────────

    total = len(tags)
    if total == 0:
        c.showPage()
        c.save()
        return buf.getvalue()

    per_page = cols * rows_per_page
    pages = math.ceil(total / per_page)

    tag_idx = 0
    for page in range(pages):
        if page > 0:
            c.showPage()

        for row in range(rows_per_page):
            for col in range(cols):
                if tag_idx >= total:
                    break
                tag = tags[tag_idx]
                tag_idx += 1

                # x: left to right, y: top to bottom (ReportLab y is from bottom)
                tx = MARGIN + col * (TAG_W + GAP_W)
                ty = PAGE_H - MARGIN - (row + 1) * TAG_H - row * GAP_H

                if tag_type == 'box' or tag.get('tag_type') == 'box':
                    draw_box_tag(tx, ty, tag)
                else:
                    draw_single_tag(tx, ty, tag)

            if tag_idx >= total:
                break

    c.showPage()
    c.save()
    return buf.getvalue()


# ── Entry point ───────────────────────────────────────────────────────────────

def main():
    args = sys.argv[1:]

    if len(args) >= 3 and args[0] == '--convert-dxf':
        convert_dxf(args[1], args[2])
        return

    if len(args) >= 3 and args[0] == '--convert-pdf':
        convert_pdf(args[1], args[2])
        return

    # Stdin JSON mode
    try:
        raw = sys.stdin.buffer.read()
        payload = json.loads(raw)
    except Exception as e:
        print(f"Failed to parse stdin JSON: {e}", file=sys.stderr)
        sys.exit(1)

    pdf_bytes = generate_pdf(payload)

    if hasattr(sys.stdout, 'buffer'):
        sys.stdout.buffer.write(pdf_bytes)
    else:
        sys.stdout.write(pdf_bytes)


if __name__ == '__main__':
    main()
