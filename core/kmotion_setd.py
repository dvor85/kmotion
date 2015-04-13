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
            self.user = self.config["user"]
            del(self.config["user"])
            
            www_rc = 'www_rc_%s' % self.user
            if not os.path.isfile(os.path.join(self.kmotion_dir, 'www', www_rc)):
                www_rc = 'www_rc'
            
            must_reload = False
            
            self.www_parser = mutex_www_parser_rd(self.kmotion_dir, www_rc)
            for section in self.config.keys():
                if section == 'feeds':                    
                    for feed in self.config[section].keys():
                        feed_section = 'motion_feed%02i' % int(feed)
                        if not self.www_parser.has_section(feed_section):
                            self.www_parser.add_section(feed_section)
                        for k, v in self.config[section][feed].items():
                            must_reload = True
                            self.www_parser.set(feed_section, k, str(v))                            
                elif section == 'display_feeds':
                    misc_section = 'misc'
                    if not self.www_parser.has_section(misc_section):
                        self.www_parser.add_section(misc_section)
                    for k, v in self.config[section].items():
                        if len(v) > 0:
                            self.www_parser.set(misc_section, 'display_feeds_%02i' % int(k), ','.join([str(i) for i in v]))
                else:
                    if not self.www_parser.has_section(section):
                        self.www_parser.add_section(section)
                    for k, v in self.config[section].items():
                        self.www_parser.set(section, k, str(v))
            mutex_www_parser_wr(self.kmotion_dir, self.www_parser, www_rc)
            
            if must_reload and www_rc == 'www_rc':
                self.log('Reload kmotion...', logger.CRIT)
                subprocess.Popen([os.path.join(self.kmotion_dir, 'kmotion.py')])
                                        
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



