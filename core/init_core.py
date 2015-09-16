#!/usr/bin/env python

"""
Exports various methods used to initialize core configuration
"""

import os, sys, logger, subprocess
from mutex_parsers import *

log = logger.Logger('init_core', logger.Logger.DEBUG)

class InitCore:
    
    HEADER_TEXT = """
##############################################################
# This config file has been automatically generated by kmotion
# from www_rc DO NOT CHANGE IT IN ANY WAY !!!
##############################################################
# User defined options
##############################################################
"""

    COMPULSORY_TEXT = """
#############################################################
# Compulsory options
#############################################################
"""

    THREAD_TEXT = """
#############################################################
# Threads
#############################################################
"""


    def __init__(self, kmotion_dir):
        self.kmotion_dir = kmotion_dir
        self.kmotion_parser = mutex_kmotion_parser_rd(self.kmotion_dir)
        self.www_parser = mutex_www_parser_rd(self.kmotion_dir)
        
        self.ramdisk_dir = self.kmotion_parser.get('dirs', 'ramdisk_dir')
        self.images_dbase_dir = self.kmotion_parser.get('dirs', 'images_dbase_dir')
        self.port = self.kmotion_parser.get('misc', 'port')
        self.version = self.kmotion_parser.get('version', 'string')
        self.title = self.kmotion_parser.get('version', 'title')
        
        self.feed_list = []
        for section in self.www_parser.sections():
            try:
                if 'motion_feed' in section:                    
                    if self.www_parser.getboolean(section, 'feed_enabled'):
                        feed = int(section.replace('motion_feed', ''))
                        self.feed_list.append(feed)
            except:
                exc_type, exc_value, exc_traceback = sys.exc_info()
                log.d('init - error {type}: {value}'.format(**{'type':exc_type, 'value':exc_value}))
        self.feed_list.sort()
    
        
    def init_ramdisk_dir(self):
        """
        Init the ramdisk setting up the kmotion, events and tmp folders.
        Exception trap in case dir created between test and mkdirs.
        
        args    : ramdisk_dir ... the ramdisk dir, normally '/dev/shm'
        excepts :
        return  : none
        """
        
        states_dir = os.path.join(self.ramdisk_dir, 'states')
        if not os.path.isdir(states_dir):
            log.d('init_ramdisk_dir() - creating \'states\' folder')
            os.makedirs(states_dir)

        for sfile in os.listdir(states_dir):
            state_file = os.path.join(states_dir, sfile)
            if os.path.isfile(state_file):
                log.d('init_ramdisk_dir() - deleting \'%s\' file' % (state_file))
                os.unlink(state_file)
                    
        events_dir = os.path.join(self.ramdisk_dir, 'events')
        if not os.path.isdir(events_dir):
            log.d('init_ramdisk_dir() - creating \'events\' folder') 
            os.makedirs(events_dir)
            
        for feed in self.feed_list:
            if not os.path.isdir('%s/%02i' % (self.ramdisk_dir, feed)): 
                try:
                    os.makedirs('%s/%02i' % (self.ramdisk_dir, feed))
                    log.d('init_ramdisk_dir() - creating \'%02i\' folder' % feed)
                except OSError:
                    pass
                    
    def set_uid_gid_named_pipes(self, uid, gid):
        """
        Generate named pipes for function, settings and ptz communications with the 
        appropreate 'uid' and 'gid'. The 'uid' and 'gid' are set to allow the 
        apache2 user to write to these files.
        
        args    : kmotion_dir ... the 'root' directory of kmotion 
                  uid ...         the user id
                  gid ...         the group id of apache2
        excepts : 
        return  : none
        """
        
        # use BASH rather than os.mkfifo(), FIFO bug workaround :)
        fifo_settings = '%s/www/fifo_settings_wr' % self.kmotion_dir
        if not os.path.exists(fifo_settings):
            # os.mkfifo(fifo_settings)
            subprocess.call(['mkfifo', fifo_settings])            
            os.chown(fifo_settings, uid, gid)
            os.chmod(fifo_settings, 0660)       
        
    
    def gen_vhost(self):
        """
        Generate the kmotion vhost file from vhost_template expanding %directory%
        strings to their full paths as defined in kmotion_rc
            
        args    : kmotion_dir ... the 'root' directory of kmotion
        excepts : exit        ... if kmotion_rc cannot be read
        return  : none
        """    

        log.d('gen_vhost() - Generating vhost/kmotion file')
        
        log.d('gen_vhost() - users_digest mode enabled')
        self.LDAP_block = """
        # ** INFORMATION ** Users digest file enabled ...
        AuthName "kmotion"
        AuthUserFile %s/www/passwords/users_digest\n""" % self.kmotion_dir

        self.www_dir = os.path.join(self.kmotion_dir, 'www/www') 
        self.logs_dir = os.path.join(self.kmotion_dir, 'www/apache_logs')
        self.wsgi_scripts = os.path.join(self.kmotion_dir, 'wsgi')
        
        try:
            vhost_dir = os.path.join(self.kmotion_dir, 'www/vhosts')
            if not os.path.isdir(vhost_dir):
                os.makedirs(vhost_dir)
            with open('%s/www/vhosts/kmotion' % self.kmotion_dir, 'w') as f_obj1:
                with open('%s/www/templates/vhosts_template' % self.kmotion_dir, 'r') as f_obj2:
                    template = f_obj2.read()
                    f_obj1.write(template.format(**self.__dict__))
                
        except IOError:
            log.e('ERROR by generating vhosts/kmotion file')
            log.e(str(sys.exc_info()[1]))
        
      
        
if __name__ == '__main__':
    kmotion_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    print kmotion_dir
    InitCore(kmotion_dir).gen_vhost()
    
    


    
    
    
    
    
