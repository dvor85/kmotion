# -*- coding: utf-8 -*-

from pathlib import Path
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

        www_rc = f'www_rc_{self.username}'
        if not Path(kmotion_dir, 'www', www_rc).is_file():
            raise Exception('Incorrect configuration!')
        self.config = cfg.get(www_rc)

    def __call__(self, *args, **kwargs):
        lines = ''
        try:
            if self.config['misc']['logs_enabled']:
                lines = utils.uni(subprocess.check_output(["/usr/bin/tail", "-n", "100", "/var/log/kmotion/motion.log"])).splitlines()
                return lines
        except Exception:
            log.critical("read outs error", exc_info=1)
