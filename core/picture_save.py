#!/usr/bin/env python2
# -*- coding: utf-8 -*-
from __future__ import absolute_import, division, unicode_literals, print_function, generators
# image_resize an image using the PIL image library

from PIL import Image
import os
import sys
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
        if os.path.lexists(dst):
            os.unlink(dst)
        im = Image.open(src)
        im2 = im.resize((int(im.width * scale), int(im.height * scale)), Image.NEAREST)
        im2.save(dst)
    except:
        os.symlink(src, dst)


def main(src, scale):
    if os.path.isfile(src):
        src_dir, src_name = os.path.split(src)
        dst_dir = os.path.join(src_dir, 'www')
        last_jpg = os.path.join(src_dir, 'last.jpg')
        if not os.path.isdir(dst_dir):
            utils.makedirs(dst_dir)

        dst = os.path.join(dst_dir, src_name)
        image_resize(src, dst, scale)
        if os.path.lexists(last_jpg):
            os.unlink(last_jpg)
        os.symlink(dst, last_jpg)

        # with open(, 'w') as f_obj:
        #    f_obj.write(dst)


if __name__ == "__main__":
    main(sys.argv[1], float(sys.argv[2]))
