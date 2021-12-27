# -*- coding: utf-8 -*-
from __future__ import absolute_import, division, unicode_literals, print_function, generators

import os
import sys
from core.config import Settings
from core import utils, logger
from io import open

log = logger.Logger('kmotion', logger.ERROR)


class Logs():

    def __init__(self, kmotion_dir, env):
        sys.path.append(kmotion_dir)
        self.kmotion_dir = kmotion_dir
        self.env = env

        self.username = utils.safe_str(utils.safe_str(env.get('REMOTE_USER')))
        cfg = Settings.get_instance(self.kmotion_dir)
        config_main = cfg.get('kmotion_rc')
        log.setLevel(config_main['log_level'])

        www_rc = 'www_rc_%s' % (self.username)
        if not os.path.isfile(os.path.join(kmotion_dir, 'www', www_rc)):
            raise Exception('Incorrect configuration!')
        self.config = cfg.get(www_rc)

    def __call__(self, *args, **kwargs):
        from core.mutex import Mutex
        lines = ''
        try:
            if self.config['misc']['logs_enabled']:
                with Mutex(self.kmotion_dir, 'logs'):
                    with open(os.path.join(self.kmotion_dir, 'www/logs'), 'r', encoding="utf-8") as f_obj:
                        lines = f_obj.read().splitlines()

                    if len(lines) > 500:
                        lines = lines[-500:]
        except Exception:
            log.critical("read logs error", exc_info=1)

        return lines
