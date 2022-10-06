# -*- coding: utf-8 -*-

from pathlib import Path
from core.mutex_parsers import mutex_kmotion_parser_rd, mutex_www_parser_rd
from core import logger, utils
from threading import Lock
from logging import _nameToLevel

log = logger.getLogger('kmotion', logger.DEBUG)


class Settings():
    VERSION = '9.1.1'
    _instance = None
    _lock = Lock()

    def __init__(self, kmotion_dir):
        self.kmotion_dir = kmotion_dir
        self.config = {}

    @staticmethod
    def get_instance(kmotion_dir):
        if Settings._instance is None:
            with Settings._lock:
                try:
                    Settings._instance = Settings(kmotion_dir)
                except Exception as e:
                    log.error("get_instance error: {0}".format(e))
                    Settings._instance = None

        return Settings._instance

    def get(self, cfg):
        if cfg == 'kmotion_rc':
            return self._read_kmotion_rc()
        else:
            self._read_www_rc()
            return self._read_www_rc(cfg)

    def _read_kmotion_rc(self):
        if not self.config.get('kmotion_rc'):
            config = {}
            try:
                self.kmotion_parser = mutex_kmotion_parser_rd(self.kmotion_dir)
                log.debug(self.kmotion_parser.sections())
                for section in self.kmotion_parser.sections():
                    config.update({k: utils.parse_str(v) for k, v in self.kmotion_parser.items(section)})
                config['log_level'] = _nameToLevel.get(config.get('log_level', 'info').upper(), logger.INFO)
                log.setLevel(min(config['log_level'], log.getEffectiveLevel()))
            except Exception as e:
                log.exception(e)
            self.config['kmotion_rc'] = config

        return self.config['kmotion_rc']

    def _read_www_rc(self, www_rc='www_rc'):
        if not Path(self.kmotion_dir, 'www', www_rc).is_file():
            raise Exception('Incorrect configuration!')
        if not self.config.get(www_rc):
            self.config[www_rc] = {}
            try:
                www_parser = mutex_www_parser_rd(self.kmotion_dir, www_rc)

                config = {"feeds": {},
                          "display_feeds": {}
                          }

                displays = {1: 1, 2: 4, 3: 9,
                            4: 1, 5: 6, 6: 13,
                            7: 8, 8: 10, 9: 2,
                            10: 2, 11: 2, 12: 2}
                for display in displays:
                    config['display_feeds'][display] = []

                for section in www_parser.sections():
                    try:
                        conf = {}
                        for k, v in www_parser.items(section):
                            try:
                                if 'display_feeds_' in k:
                                    display = utils.parse_str(k.replace('display_feeds_', ''))
                                    config['display_feeds'][display] = utils.uniq([utils.parse_str(i) for i in v.split(',')
                                                                                   if www_parser.has_section(f'motion_feed{int(i):02}')])
                                else:
                                    conf[k] = utils.parse_str(v)
                            except Exception as e:
                                log.exception(f'error: {e}')

                        if 'motion_feed' in section:
                            feed = int(section.replace('motion_feed', ''))
                            if self.config.get('www_rc'):
                                conf['feed_name'] = conf['feed_name'] if 'feed_name' in conf else self.config['www_rc']['feeds'][feed].get('feed_name', '')
                                conf['feed_enabled'] = conf['feed_enabled'] and self.config['www_rc']['feeds'][feed].get('feed_enabled', False)
                            config['feeds'][feed] = conf
                        elif len(conf) > 0:
                            config[section] = conf
                    except Exception as e:
                        log.exception(f'error: {e}')

                displays[4] = len(config['feeds'])
                for display in displays:
                    try:
                        while len(config['display_feeds'][display]) < min(len(config['feeds']), displays[display]):
                            for feed in config['feeds']:
                                try:
                                    if feed not in config['display_feeds'][display]:
                                        config['display_feeds'][display].append(feed)
                                        break
                                except Exception:
                                    pass
                    except Exception:
                        pass
                self.config[www_rc] = config
            except Exception as e:
                log.exception(e)

        return self.config[www_rc]
