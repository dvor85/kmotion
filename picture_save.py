#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from __future__ import absolute_import, division, unicode_literals, print_function, generators
# image_resize an image using the PIL image library

import sys
from pathlib import Path


def image_resize(src, dst, scale=1):
    """
    :src: Path to source image
    :dst: Path to destination image
    :scale: Scale for resize source image. If equal 1, then only symlink created
    """
    try:
        if scale == 1:
            raise Exception('Nothing resize')
        from PIL import Image
        if dst.exists() or dst.is_symlink():
            dst.unlink()
        im = Image.open(src)
        im2 = im.resize((int(im.width * scale), int(im.height * scale)), Image.NEAREST)
        im2.save(dst)
    except Exception:
        dst.symlink_to(src)


def main(src, scale):
    src = Path(src)
    if src.is_file():
        dst_dir = Path(src.parent, 'www')
        last_jpg = Path(src.parent, 'last.jpg')
        dst_dir.mkdir(parents=True, exist_ok=True)

        dst = dst_dir / src.name
        image_resize(src, dst, scale)
        if last_jpg.exists() or last_jpg.is_symlink():
            last_jpg.unlink()
        last_jpg.symlink_to(dst)


if __name__ == "__main__":
    main(sys.argv[1], float(sys.argv[2]))
