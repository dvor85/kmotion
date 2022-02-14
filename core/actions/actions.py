# -*- coding: utf-8 -*-

import sys
from threading import Thread
from importlib import import_module

log = None


class Actions():

    def __init__(self, kmotion_dir, feed):
        sys.path.append(kmotion_dir)

        from core import logger
        global log
        log = logger.getLogger('kmotion', logger.ERROR)
        self.kmotion_dir = kmotion_dir
        self.feed = int(feed)
        log.debug('init')
        self.actions_list = []
        try:
            from core.config import Settings
            cfg = Settings.get_instance(kmotion_dir)
            log.setLevel(min(cfg.get('kmotion_rc')['log_level'], log.getEffectiveLevel()))
            config = cfg.get('www_rc')
            self.feed_actions = config['feeds'][self.feed]['feed_actions'].split(' ')

            for feed_action in self.feed_actions:
                try:
                    action_mod = import_module("core.actions." + feed_action)
                    action = getattr(action_mod, feed_action)(self.kmotion_dir, self.feed)
                    self.actions_list.append(action)
                except Exception:
                    log.exception('init action')

        except Exception:
            log.exception('init error')

    def start(self):
        t_list = []
        for action in self.actions_list:
            try:
                t = Thread(target=action.start)
                t_list.append(t)
                t.start()
            except Exception:
                log.exception('start action error')

        for t in t_list:
            t.join()

    def end(self):
        t_list = []
        for action in self.actions_list:
            try:
                t = Thread(target=action.end)
                t_list.append(t)
                t.start()
            except Exception:
                log.exception('end action error')

        for t in t_list:
            t.join()
