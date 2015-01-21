#!/usr/bin/env python
# image_resize an image using the PIL image library
 
import Image, os, sys
 
def image_resize(src, dst, width, height):         
        im = Image.open(src)
        im2 = im.resize((width, height), Image.NEAREST)
        im2.save(dst)
        
def main(src):
    if os.path.isfile(src):
        src_dir, src_name = os.path.split(src)
        dst_dir = os.path.join(src_dir, 'www')
        if not os.path.isdir(dst_dir):
            os.makedirs(dst_dir)
        dst = os.path.join(dst_dir, src_name)
        image_resize(src, dst, 640, 480)
        with open(os.path.join(dst_dir, 'last'), 'w') as f_obj:
            f_obj.write(dst)
    

main(sys.argv[1])



