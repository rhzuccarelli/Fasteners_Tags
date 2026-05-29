#!/usr/bin/env python3
"""
Drawing converter for Fastener Tracker.

Usage:
    python3 convert_drawing.py INPUT_PATH OUTPUT_PATH

Detects file type by extension:
    .dxf  → ezdxf rasterisation
    .pdf  → pdf2image (poppler)
    .png  → copy as-is
    .jpg/.jpeg → PIL convert to PNG
"""

import sys
import os
import shutil


def main():
    if len(sys.argv) < 3:
        print("Usage: convert_drawing.py INPUT OUTPUT", file=sys.stderr)
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]
    ext = os.path.splitext(input_path)[1].lower()

    if not os.path.exists(input_path):
        print(f"Input file not found: {input_path}", file=sys.stderr)
        sys.exit(1)

    if ext == '.dxf':
        convert_dxf(input_path, output_path)
    elif ext == '.pdf':
        convert_pdf(input_path, output_path)
    elif ext in ('.png',):
        shutil.copy2(input_path, output_path)
        print(f"Copied PNG: {output_path}", file=sys.stderr)
    elif ext in ('.jpg', '.jpeg', '.bmp', '.webp', '.gif'):
        convert_image(input_path, output_path)
    else:
        print(f"Unsupported file type: {ext}", file=sys.stderr)
        sys.exit(1)


def convert_dxf(input_path, output_path):
    try:
        import ezdxf
        from ezdxf.addons.drawing import RenderContext, Frontend
        from ezdxf.addons.drawing.matplotlib import MatplotlibBackend
        import matplotlib
        matplotlib.use('Agg')
        import matplotlib.pyplot as plt
    except ImportError as e:
        print(f"ezdxf or matplotlib not installed: {e}", file=sys.stderr)
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
        print(f"DXF → PNG: {output_path}", file=sys.stderr)
    except Exception as e:
        print(f"DXF conversion failed: {e}", file=sys.stderr)
        sys.exit(1)


def convert_pdf(input_path, output_path):
    try:
        from pdf2image import convert_from_path
    except ImportError as e:
        print(f"pdf2image not installed: {e}", file=sys.stderr)
        sys.exit(1)

    try:
        images = convert_from_path(input_path, dpi=150, first_page=1, last_page=1)
        if images:
            images[0].save(output_path, 'PNG')
            print(f"PDF → PNG: {output_path}", file=sys.stderr)
        else:
            print("PDF produced no images.", file=sys.stderr)
            sys.exit(1)
    except Exception as e:
        print(f"PDF conversion failed: {e}", file=sys.stderr)
        sys.exit(1)


def convert_image(input_path, output_path):
    try:
        from PIL import Image
    except ImportError as e:
        print(f"Pillow not installed: {e}", file=sys.stderr)
        sys.exit(1)

    try:
        img = Image.open(input_path).convert('RGBA')
        img.save(output_path, 'PNG')
        print(f"Image → PNG: {output_path}", file=sys.stderr)
    except Exception as e:
        print(f"Image conversion failed: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
