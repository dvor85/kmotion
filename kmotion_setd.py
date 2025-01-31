#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Waits on the 'fifo_settings_wr' fifo until data received then parse the data
and modifiy 'www_rc'
"""

from core import logger, utils
import os
import signal
import time
import json
import subprocess
import threading
from multiprocessing import Process
from camera_lost import CameraLost
from core.mutex_parsers import mutex_www_parser_rd, mutex_www_parser_wr
from core.config import Settings
from pathlib import Path

log = logger.getLogger('kmotion', logger.ERROR)


class Kmotion_setd(Process):

    def __init__(self, kmotion_dir):
        super().__init__()
        self.name = 'setd'
        self.daemon = True
        self.active = False
        self.kmotion_dir = kmotion_dir
        config_main = Settings.get_instance(self.kmotion_dir).get('kmotion_rc')
        log.setLevel(min(config_main['log_level'], log.getEffectiveLevel()))

    def run(self):
        """
        Waits on the 'fifo_settings_wr' fifo until data received then parse the data
        and modifiy 'www_rc'

        """

        self.active = True
        log.info(f'starting daemon [{self.pid}]')
        while self.active:
            try:
                log.debug('waiting on FIFO pipe data')
                self.config = {}
                data = ''
                with Path(self.kmotion_dir, 'www', 'fifo_settings_wr').open(mode='r') as pipein:
                    data = utils.uni(pipein.read())
                if data:
                    log.debug(f'kmotion FIFO pipe data: {data}')

                    self.config = json.loads(data)
                    self.user = self.config["user"]
                    must_reload = self.config.get("force_reload", False)

                    www_rc = f'www_rc_{self.user}'
                    www_rc_path = Path(self.kmotion_dir, 'www', www_rc).resolve()
                    if not www_rc_path.is_file():
                        raise Exception('Incorrect configuration!')

                    www_parser = mutex_www_parser_rd(self.kmotion_dir, www_rc)
                    for section in self.config:
                        if section == 'feeds':
                            for feed in self.config[section]:
                                feed_section = f'motion_feed{int(feed):02}'
                                if feed_section not in www_parser:
                                    www_parser.add_section(feed_section)
                                for k, v in self.config[section][feed].items():
                                    if k == 'reboot_camera' and utils.parse_str(v) is True and www_rc_path.name == 'www_rc':
                                        cam_lost = CameraLost(self.kmotion_dir, feed)
                                        threading.Thread(target=cam_lost.reboot_camera).start()
                                    else:
                                        must_reload = True
                                        www_parser.set(feed_section, k, str(v))
                        elif section == 'display_feeds':
                            misc_section = 'misc'
                            if misc_section not in www_parser:
                                www_parser.add_section(misc_section)
                            for k, v in self.config[section].items():
                                if len(v) > 0:
                                    www_parser.set(misc_section, f'display_feeds_{int(k):02}', ','.join(map(str, v)))
                        elif isinstance(self.config[section], dict):
                            if section not in www_parser:
                                www_parser.add_section(section)
                            [www_parser.set(section, k, str(v)) for k, v in self.config[section].items()]

                    mutex_www_parser_wr(self.kmotion_dir, www_parser, www_rc)

                    if must_reload and www_rc_path.name == 'www_rc':
                        log.info('Reload kmotion...')
                        log.info(f"{os.getppid()}")
                        os.kill(os.getppid(), signal.SIGTERM)

            except Exception:  # global exception catch
                log.critical('** CRITICAL ERROR **', exc_info=1)
                self.sleep(60)

    def kill_other(self):
        log.info('killing daemons ...')
        try:
            log.info(self.get_kmotion_pids())
            for pid in self.get_kmotion_pids()[:1]:

                os.kill(int(pid), signal.SIGTERM)
        except Exception:
            log.exception(f'kill_other')

    def get_kmotion_pids(self):
        try:
            stdout = subprocess.check_output(['pgrep', '-f', f"^python.+kmotion.py$"], shell=False, text=True).splitlines()
            return [pid for pid in stdout if Path('/proc', pid).is_dir()]
        except Exception:
            return []

    def sleep(self, timeout):
        t = 0
        p = timeout - int(timeout)
        precision = p if p > 0 else 1
        while self.active and t < timeout:
            t += precision
            time.sleep(precision)
        return self.active

    def stop_process(self):
        try:
            self.kill()
        except Exception as e:
            log.debug(e)

    def stop(self):
        log.info(f'stop {__name__}')
        self.active = False
        self.stop_process()

