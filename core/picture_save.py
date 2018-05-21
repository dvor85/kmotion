#!/usr/bin/env python
# image_resize an image using the PIL image library

from PIL import Image
import os
import sys


def image_resize(src, dst, scale=1):
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


def main(src):
    if os.path.isfile(src):
        src_dir, src_name = os.path.split(src)
        dst_dir = os.path.join(src_dir, 'www')
        last_jpg = os.path.join(src_dir, 'last.jpg')
        if not os.path.isdir(dst_dir):
            os.makedirs(dst_dir)

        dst = os.path.join(dst_dir, src_name)
        image_resize(src, dst, scale=0.75)
        if os.path.lexists(last_jpg):
            os.unlink(last_jpg)
        os.symlink(dst, last_jpg)

        # with open(, 'w') as f_obj:
        #    f_obj.write(dst)


if __name__ == "__main__":
    main(sys.argv[1])
