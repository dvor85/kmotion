#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# image_resize an image using the PIL image library

import sys
from pathlib import Path
from core import utils


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
        utils.mkdir(dst_dir)

        dst = dst_dir / src.name
        image_resize(src, dst, scale)
        try:
            last_jpg.unlink()
        except FileNotFoundError:
            pass
        last_jpg.symlink_to(dst)


if __name__ == "__main__":
    main(sys.argv[1], float(sys.argv[2]))
