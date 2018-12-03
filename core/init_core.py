#!/usr/bin/env python

"""
Exports various methods used to initialize core configuration
"""

import sys
import logger
import subprocess
from string import Template
import os
from config import Settings

log = logger.Logger('kmotion', logger.DEBUG)


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
        cfg = Settings.get_instance(kmotion_dir)
        config_main = cfg.get('kmotion_rc')
        config = cfg.get('www_rc')

        self.ramdisk_dir = config_main['ramdisk_dir']
        self.images_dbase_dir = config_main['images_dbase_dir']
        self.port = config_main['port']
        self.port_notice = config_main.get('port_notice', 0)
        self.title = config_main['title']
        self.AUTH_block = """
        # ** INFORMATION ** Users digest file enabled ...
        AuthType Basic
        AuthName "kmotion"
        Require valid-user
        AuthUserFile %s/www/passwords/users_digest\n""" % self.kmotion_dir

        self.www_dir = os.path.join(self.kmotion_dir, 'www/www')
        self.logs_dir = os.path.join(self.kmotion_dir, 'www/apache_logs')
        self.wsgi_scripts = os.path.join(self.kmotion_dir, 'wsgi')
        self.wsgi_notice = os.path.join(self.kmotion_dir, 'wsgi_notice')

        self.camera_ids = sorted([f for f in config['feeds'].keys() if config['feeds'][f].get('feed_enabled', False)])

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
            log.debug('init_ramdisk_dir() - creating \'states\' folder')
            os.makedirs(states_dir)

        for sfile in os.listdir(states_dir):
            state_file = os.path.join(states_dir, sfile)
            if os.path.isfile(state_file):
                log.debug('init_ramdisk_dir() - deleting \'%s\' file' % (state_file))
                os.unlink(state_file)

        events_dir = os.path.join(self.ramdisk_dir, 'events')
        if not os.path.isdir(events_dir):
            log.debug('init_ramdisk_dir() - creating \'events\' folder')
            os.makedirs(events_dir)

        for feed in self.camera_ids:
            if not os.path.isdir('%s/%02i' % (self.ramdisk_dir, feed)):
                try:
                    os.makedirs('%s/%02i' % (self.ramdisk_dir, feed))
                    log.debug('init_ramdisk_dir() - creating \'%02i\' folder' % feed)
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
        fifos = [os.path.join(self.kmotion_dir, 'www/fifo_settings_wr'),
                 os.path.join(self.kmotion_dir, 'www/fifo_motion_detector')]
        for fifo in fifos:
            if not os.path.exists(fifo):
                subprocess.call(['mkfifo', fifo])
                os.chown(fifo, uid, gid)
                os.chmod(fifo, 0660)

    def gen_vhost(self):
        """
        Generate the kmotion vhost file from vhost_template expanding %directory%
        strings to their full paths as defined in kmotion_rc

        return  : none
        """

        log.debug('gen_vhost() - Generating vhost/kmotion file')

        try:
            vhost_dir = os.path.join(self.kmotion_dir, 'www/vhosts')
            if not os.path.isdir(vhost_dir):
                os.makedirs(vhost_dir)
            tmpl_dir = os.path.join(self.kmotion_dir, 'www/templates')
            for vhost_tmpl in os.listdir(tmpl_dir):
                with open(os.path.join(vhost_dir, vhost_tmpl), 'w') as f_obj1:
                    tmpl = Template(open(os.path.join(tmpl_dir, vhost_tmpl), 'r').read())
                    f_obj1.write(tmpl.safe_substitute(**self.__dict__))

        except IOError:
            log.exception('ERROR by generating vhosts/kmotion file')


if __name__ == '__main__':
    kmotion_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    print kmotion_dir
    InitCore(kmotion_dir).gen_vhost()
    InitCore(kmotion_dir).init_ramdisk_dir()
    InitCore(kmotion_dir).set_uid_gid_named_pipes(os.getuid(), os.getgid())
