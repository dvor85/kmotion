# -*- coding: utf-8 -*-

import os
import sys
from core.config import Settings
from core import utils


class Outs():

    def __init__(self, kmotion_dir, env):
        self.kmotion_dir = kmotion_dir
        self.env = env

        self.username = utils.true_enc(utils.safe_str(env.get('REMOTE_USER')))
        cfg = Settings.get_instance(self.kmotion_dir)

        www_rc = 'www_rc_%s' % (self.username)
        if not os.path.isfile(os.path.join(kmotion_dir, 'www', www_rc)):
            www_rc = 'www_rc'
        self.config = cfg.get(www_rc)

    def __call__(self, *args, **kwargs):
        lines = ''
        if self.config['misc']['logs_enabled']:
            with open(os.path.join(self.kmotion_dir, 'www/motion_out'), 'r') as f_obj:
                lines = f_obj.read().splitlines()

            if len(lines) > 500:
                lines = lines[-500:]

            return lines
