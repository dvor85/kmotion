# -*- coding: utf-8 -*-

import sys
import subprocess
from pathlib import Path
from core.config import Settings
from core import utils, logger

log = logger.getLogger('kmotion', logger.ERROR)


class Logs():

    def __init__(self, kmotion_dir, env):
        sys.path.append(kmotion_dir)
        self.kmotion_dir = kmotion_dir
        self.env = env

        self.username = utils.safe_str(utils.safe_str(env.get('REMOTE_USER')))
        cfg = Settings.get_instance(self.kmotion_dir)
        config_main = cfg.get('kmotion_rc')
        log.setLevel(min(config_main['log_level'], log.getEffectiveLevel()))

        www_rc = f'www_rc_{self.username}'
        if not Path(kmotion_dir, 'www', www_rc).is_file():
            raise Exception('Incorrect configuration!')
        self.config = cfg.get(www_rc)

    def __call__(self, *args, **kwargs):
        from core.mutex import Mutex
        lines = ''
        try:
            if self.config['misc']['logs_enabled']:
                with Mutex(self.kmotion_dir, 'logs'):
                    lines = utils.uni(subprocess.check_output(["/usr/bin/tail", "-n", "100", "/var/log/kmotion/kmotion.log"])).splitlines()
        except Exception:
            log.critical("read logs error", exc_info=1)

        return lines
