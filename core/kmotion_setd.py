#!/usr/bin/env python

"""
Waits on the 'fifo_settings_wr' fifo until data received then parse the data
and modifiy 'www_rc'
"""

import sys, os.path, logger, time, traceback, json
import subprocess
from mutex_parsers import *
from multiprocessing import Process

class Kmotion_setd(Process):
    
    def __init__(self, kmotion_dir):
        Process.__init__(self)
        self.kmotion_dir = kmotion_dir
        self.log = logger.Logger('setd', logger.DEBUG)

    def main(self):  
        """
        Waits on the 'fifo_settings_wr' fifo until data received then parse the data
        and modifiy 'www_rc'
        
        """
        
        self.log('starting daemon ...', logger.WARNING)
        
        while True:
            self.log('waiting on FIFO pipe data', logger.DEBUG)
            self.config = {}
            with open('%s/www/fifo_settings_wr' % self.kmotion_dir, 'r') as pipein: 
                data = pipein.read()
            self.log('kmotion FIFO pipe data: %s' % data, logger.DEBUG)  
                      
            self.config = json.loads(data)
            
            www_rc = 'www_rc_%s' % self.config["user"]
            if not os.path.isfile(os.path.join(self.kmotion_dir, 'www', www_rc)):
                www_rc = 'www_rc'
            
            self.www_parser = mutex_www_parser_rd(self.kmotion_dir, www_rc)
            del(self.config["ramdisk_dir"],
                self.config["version"],
                self.config["user"],
                self.config["title"])
            
            for section in self.config.keys():
                if section.startswith('_'):
                    continue
                if section == 'feeds':                    
                    for feed in self.config[section].keys():
                        if feed.startswith('_'):
                            continue
                        feed_section = 'motion_feed%02i' % int(feed)
                        if not self.www_parser.has_section(feed_section):
                            self.www_parser.add_section(feed_section)
                        for k, v in self.config[section][feed].items():
                            if k.startswith('_'):
                                continue
                            self.www_parser.set(feed_section, k, str(v))
                            if k == 'feed_mask':
                                self.create_mask(feed, str(v))
                elif section == 'display_feeds':
                    misc_section = 'misc'
                    if not self.www_parser.has_section(misc_section):
                        self.www_parser.add_section(misc_section)
                    for k, v in self.config[section].items():
                        self.www_parser.set(misc_section, 'display_feeds_%02i' % int(k), ','.join([str(i) for i in v]))
                else:
                    if not self.www_parser.has_section(section):
                        self.www_parser.add_section(section)
                    for k, v in self.config[section].items():
                        if k.startswith('_'):
                            continue
                        self.www_parser.set(section, k, str(v))
                    
                    
            mutex_www_parser_wr(self.kmotion_dir, self.www_parser, www_rc)
            subprocess.Popen([os.path.join(self.kmotion_dir, 'kmotion.py')])
                                        
    def create_mask(self, feed, mask_hex_str):   
        """
        Create a motion PGM mask from 'mask_hex_string' for feed 'feed'. Save it
        as ../core/masks/mask??.png.
        
        args    : kmotion_dir ...  the 'root' directory of kmotion 
                  feed ...         the feed number
                  mask_hex_str ... the encoded mask hex string
        excepts : 
        return  : none
        """
    
        self.log('create_mask() - mask hex string: %s' % mask_hex_str, logger.DEBUG)
        image_width = self.config['feeds'][feed]['feed_width'] 
        image_height = self.config['feeds'][feed]['feed_height']
        self.log('create_mask() - width: %i height: %i' % (image_width, image_height), logger.DEBUG)
        
        black_px = '\x00' 
        white_px = '\xFF' 
        
        mask = ''
        mask_hex_split = mask_hex_str.split('#')
        px_yptr = 0
        
        for y in range(15):
            
            tmp_dec = int(mask_hex_split[y], 16)
            px_xptr = 0
            image_line = ''
            
            for x in range(15, 0, -1):
            
                px_mult = (image_width - px_xptr) / x
                px_xptr += px_mult
                
                bin_ = tmp_dec & 16384
                tmp_dec <<= 1
                
                if bin_ == 16384:
                    image_line += black_px * px_mult
                else:
                    image_line += white_px * px_mult
            
                    
            px_mult = (image_height - px_yptr) / (15 - y)
            px_yptr += px_mult
                
            mask += image_line * px_mult
        
        masks_dir = os.path.join(self.kmotion_dir, 'core/masks')
        if not os.path.isdir(masks_dir):
            os.makedirs(masks_dir)    
        with open(os.path.join(masks_dir, 'mask%0.2i.pgm' % int(feed)), 'wb') as f_obj:
            f_obj.write('P5\n')
            f_obj.write('%i %i\n' % (image_width, image_height))
            f_obj.write('255\n')
            f_obj.write(mask)
        self.log('create_mask() - mask written', logger.DEBUG)
        
        
    def run(self):
        while True:
            try:    
                self.main()
            except:  # global exception catch
                exc_type, exc_value, exc_tb = sys.exc_info()
                exc_trace = traceback.extract_tb(exc_tb)[-1]
                exc_loc1 = '%s' % exc_trace[0]
                exc_loc2 = '%s(), Line %s, "%s"' % (exc_trace[2], exc_trace[1], exc_trace[3])
                
                self.log('** CRITICAL ERROR ** crash - type: %s' % exc_type, logger.CRIT)
                self.log('** CRITICAL ERROR ** crash - value: %s' % exc_value, logger.CRIT)
                self.log('** CRITICAL ERROR ** crash - traceback: %s' % exc_loc1, logger.CRIT)
                self.log('** CRITICAL ERROR ** crash - traceback: %s' % exc_loc2, logger.CRIT) 
                del(exc_tb)
                time.sleep(60)



