#!/usr/bin/env python
# image_resize an image using the PIL image library
 
import Image, os, sys
 
def image_resize(src, dst, width, height):
    try:
        os.unlink(dst)
        im = Image.open(src)
        im2 = im.resize((width, height), Image.NEAREST)
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
        image_resize(src, dst, 640, 480)
        if os.path.lexists(last_jpg):
            os.unlink(last_jpg)        
        os.symlink(dst, last_jpg)
        
        # with open(, 'w') as f_obj:
        #    f_obj.write(dst)
    
if __name__ == "__main__":
    main(sys.argv[1])



