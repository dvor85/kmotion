# -*- coding: utf-8 -*-

import json
from pathlib import Path
from core.config import Settings
from core import utils, logger

log = logger.getLogger('kmotion', logger.ERROR)


class Config():

    def __init__(self, kmotion_dir, env):
        self.kmotion_dir = kmotion_dir
        self.env = env

        self.username = utils.safe_str(env.get('REMOTE_USER'))

        www_rc = f'www_rc_{self.username}'
        if not Path(kmotion_dir, 'www', www_rc).is_file():
            raise Exception('Incorrect configuration!')

        conf = Settings.get_instance(kmotion_dir)
        self.config = conf.get(www_rc)
        config_main = conf.get('kmotion_rc')
        log.setLevel(min(config_main['log_level'], log.getEffectiveLevel()))
        self.ramdisk_dir = Path(config_main['ramdisk_dir'])
        self.title = config_main.get('title', 'Surveillance')

    def read(self):
        try:
            config = {"version": Settings.VERSION,
                      "title": self.title,
                      "feeds": {},
                      "display_feeds": {}
                      }
            exclude_options = ('feed_reboot_url',)
            config.update(self.config)
            for conf in config['feeds'].values():
                for eo in set(conf).intersection(exclude_options):
                    del(conf[eo])

            return config
        except Exception:
            log.critical("read error", exc_info=1)

    def write(self, jdata):
        try:
            if self.config['misc']['config_enabled']:
                config = json.loads(jdata)
                config['user'] = self.username
                Path(self.kmotion_dir, 'www', 'fifo_settings_wr').write_text(json.dumps(config))
            return ''
        except Exception:
            log.critical("write error", exc_info=1)

    def __call__(self, *args, **kwargs):
        if 'read' in kwargs:
            return self.read()
        elif 'write' in kwargs:
            jdata = kwargs.get("jdata")
            return self.write(jdata)
        else:
            return ''


if __name__ == '__main__':
    kmotion_dir = Path(__file__).absolute().parent.parent
    print(Config(kmotion_dir, {}).read())
#     requests.post("http://127.0.0.1:8080/config", json={'jsonrpc': '2.0', 'method': 'config', 'id': '1', 'params': {'read': '1'} }, headers={"Content-type": "application/json"}).content
