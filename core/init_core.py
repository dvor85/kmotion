# -*- coding: utf-8 -*-

"""
Exports various methods used to initialize core configuration
"""

from core import logger, utils
from string import Template
import os
from core.config import Settings
from pathlib import Path

log = logger.getLogger('kmotion', logger.DEBUG)


class InitCore:

    HEADER_TEXT = """
##############################################################
# This config file has been automatically generated by kmotion
# from www_rc DO NOT CHANGE IT IN ANY WAY !!!
##############################################################

"""

    def __init__(self, kmotion_dir):

        self.kmotion_dir = kmotion_dir
        cfg = Settings.get_instance(kmotion_dir)
        config_main = cfg.get('kmotion_rc')
        log.setLevel(min(config_main['log_level'], log.getEffectiveLevel()))
        config = cfg.get('www_rc')

        self.ramdisk_dir = Path(config_main['ramdisk_dir'])
        self.images_dbase_dir = Path(config_main['images_dbase_dir'])
        self.port = config_main['listen_port']
        self.title = config_main['title']
        self.AUTH_block = f"""
        # ** INFORMATION ** Users digest file enabled ...
        AuthType Basic
        AuthName "kmotion"
        Require valid-user
        AuthUserFile {self.kmotion_dir}/www/passwords/users_digest\n"""

        self.www_dir = Path(self.kmotion_dir, 'www', 'www')
        self.wsgi_scripts = Path(self.kmotion_dir, 'wsgi')

        self.camera_ids = sorted([f for f in config['feeds'] if config['feeds'][f].get('feed_enabled', False)])

    def init_ramdisk_dir(self):
        """
        Init the ramdisk setting up the kmotion, events and tmp folders.
        Exception trap in case dir created between test and mkdirs.

        args    : ramdisk_dir ... the ramdisk dir, normally '/dev/shm'
        excepts :
        return  : none
        """
        log.debug('init ramdisk dir')
        states_dir = Path(self.ramdisk_dir, 'states')
        if not states_dir.is_dir():
            log.debug('creating \'states\' folder')
            utils.mkdir(states_dir)

        for state_file in states_dir.glob('*'):
            if state_file.is_file():
                log.debug(f"deleting {state_file}")
                state_file.unlink()

        events_dir = Path(self.ramdisk_dir, 'events')
        if not events_dir.is_dir():
            log.debug('creating \'events\' folder')
            utils.mkdir(events_dir)

        for feed in self.camera_ids:
            f_dir = Path(self.ramdisk_dir, f'{feed:02d}')
            if not f_dir.is_dir():
                try:
                    utils.mkdir(f_dir)
                    log.debug(f'creating \'{feed:02d}\' folder')
                except OSError as e:
                    log.error(e)

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

        fifos = [Path(self.kmotion_dir, 'www', 'fifo_settings_wr')]
        # os.path.join(self.kmotion_dir, 'www/fifo_motion_detector')]
        for fifo in fifos:
            try:
                if not fifo.is_fifo():
                    os.mkfifo(fifo, 0o660, dir_fd=None)
            except Exception as e:
                log.error(e)

    def gen_vhost(self):
        """
        Generate the kmotion vhost file from vhost_template expanding %directory%
        strings to their full paths as defined in kmotion_rc

        return  : none
        """

        log.debug('Generating vhost/kmotion file')

        try:
            vhost_dir = Path(self.kmotion_dir, 'www', 'vhosts')
            utils.mkdir(vhost_dir)
            tmpl_dir = Path(self.kmotion_dir, 'www', 'templates')
            for vhost_tmpl in tmpl_dir.glob('*'):
                Path(vhost_dir, vhost_tmpl.name).write_text(Template(vhost_tmpl.read_text()).safe_substitute(**self.__dict__))

        except IOError:
            log.exception('ERROR by generating vhosts/kmotion file')


if __name__ == '__main__':
    kmotion_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    print(kmotion_dir)
    InitCore(kmotion_dir).gen_vhost()
    InitCore(kmotion_dir).init_ramdisk_dir()
    InitCore(kmotion_dir).set_uid_gid_named_pipes(os.getuid(), os.getgid())
