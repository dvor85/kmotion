# -*- coding: utf-8 -*-
from __future__ import absolute_import, division, unicode_literals, print_function, generators

import os
import sys
from core.config import Settings
from core import utils
from io import open


class Logs():

    def __init__(self, kmotion_dir, env):
        sys.path.append(kmotion_dir)
        self.kmotion_dir = kmotion_dir
        self.env = env

        self.username = utils.safe_str(utils.safe_str(env.get('REMOTE_USER')))
        cfg = Settings.get_instance(self.kmotion_dir)

        www_rc = 'www_rc_%s' % (self.username)
        if not os.path.isfile(os.path.join(kmotion_dir, 'www', www_rc)):
            raise Exception('Incorrect configuration!')
        self.config = cfg.get(www_rc)

    def __call__(self, *args, **kwargs):
        from core.mutex import Mutex
        lines = ''
        if self.config['misc']['logs_enabled']:
            with Mutex(self.kmotion_dir, 'logs'):
                with open(os.path.join(self.kmotion_dir, 'www/logs'), 'r', encoding="utf-8") as f_obj:
                    lines = f_obj.read().splitlines()

                if len(lines) > 500:
                    lines = lines[-500:]

        return lines
