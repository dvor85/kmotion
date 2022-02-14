# -*- coding: utf-8 -*-
from __future__ import absolute_import, division, unicode_literals, print_function, generators

import os
from core.config import Settings
from core import utils, logger
import subprocess


log = logger.getLogger('kmotion', logger.ERROR)


class Outs():

    def __init__(self, kmotion_dir, env):
        self.kmotion_dir = kmotion_dir
        self.env = env

        self.username = utils.safe_str(env.get('REMOTE_USER'))
        cfg = Settings.get_instance(self.kmotion_dir)
        config_main = cfg.get('kmotion_rc')
        log.setLevel(min(config_main['log_level'], log.getEffectiveLevel()))

        www_rc = 'www_rc_%s' % (self.username)
        if not os.path.isfile(os.path.join(kmotion_dir, 'www', www_rc)):
            raise Exception('Incorrect configuration!')
        self.config = cfg.get(www_rc)

    def __call__(self, *args, **kwargs):
        lines = ''
        try:
            if self.config['misc']['logs_enabled']:
                lines = utils.uni(subprocess.check_output(["/usr/bin/tail", "-n", "100", "/var/log/kmotion/motion.log"])).splitlines()
                # with open(os.path.join(self.kmotion_dir, 'www/motion_out'), 'r', encoding="utf-8") as f_obj:
                #     lines = f_obj.read().splitlines()
                #
                # if len(lines) > 500:
                #     lines = lines[-500:]

                return lines
        except Exception:
            log.critical("read outs error", exc_info=1)
