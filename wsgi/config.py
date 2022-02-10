# -*- coding: utf-8 -*-
from __future__ import absolute_import, division, unicode_literals, print_function, generators

import os
import json
from six import itervalues
from core.config import Settings
from core import utils, logger

log = logger.getLogger('kmotion', logger.ERROR)


class Config():

    def __init__(self, kmotion_dir, env):
        self.kmotion_dir = kmotion_dir
        self.env = env

        self.username = utils.safe_str(env.get('REMOTE_USER'))

        www_rc = 'www_rc_%s' % (self.username)
        if not os.path.isfile(os.path.join(kmotion_dir, 'www', www_rc)):
            raise Exception('Incorrect configuration!')

        conf = Settings.get_instance(kmotion_dir)
        self.config = conf.get(www_rc)
        config_main = conf.get('kmotion_rc')
        log.setLevel(min(config_main['log_level'], log.getEffectiveLevel()))
        self.ramdisk_dir = config_main['ramdisk_dir']
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
            for conf in itervalues(config['feeds']):
                for eo in exclude_options:
                    if eo in conf:
                        del(conf[eo])

            return config
        except Exception:
            log.critical("read error", exc_info=1)

    def write(self, jdata):
        try:
            if self.config['misc']['config_enabled']:
                config = json.loads(jdata)
                config['user'] = self.username
                with open('%s/www/fifo_settings_wr' % self.kmotion_dir, 'w') as pipeout:
                    pipeout.write(json.dumps(config))

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
    kmotion_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    print(Config(kmotion_dir, {}).read())
#     requests.post("http://127.0.0.1:8080/config", json={'jsonrpc': '2.0', 'method': 'config', 'id': '1', 'params': {'read': '1'} }, headers={"Content-type": "application/json"}).content
