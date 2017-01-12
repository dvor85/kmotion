'''
@author: demon
'''

import sys
from threading import Thread

log = None


class Actions():

    def __init__(self, kmotion_dir, feed):
        sys.path.append(kmotion_dir)

        import core.logger as logger
        global log
        log = logger.Logger('actions_list', logger.Logger.DEBUG)
        self.kmotion_dir = kmotion_dir
        self.feed = int(feed)
        log.d('init')
        self.actions_list = []
        try:
            from core.mutex_parsers import mutex_www_parser_rd
            www_parser = mutex_www_parser_rd(self.kmotion_dir)
            self.feed_actions = set(www_parser.get('motion_feed%02i' % self.feed, 'feed_actions').split(' '))

            for feed_action in self.feed_actions:
                try:
                    action_mod = __import__(feed_action, globals=globals(), fromlist=[feed_action])
                    action = getattr(action_mod, feed_action)(self.kmotion_dir, self.feed)
                    self.actions_list.append(action)
                except:
                    exc_type, exc_value, exc_traceback = sys.exc_info()
                    log.e('init action error {type}: {value}'.format(**{'type': exc_type, 'value': exc_value}))

        except:
            exc_type, exc_value, exc_traceback = sys.exc_info()
            log.e('init - error {type}: {value}'.format(**{'type': exc_type, 'value': exc_value}))

    def start(self):
        t_list = []
        for action in self.actions_list:
            try:
                t = Thread(target=action.start)
                t_list.append(t)
                t.start()
            except:
                exc_type, exc_value, exc_traceback = sys.exc_info()
                log.e('start action error {type}: {value}'.format(**{'type': exc_type, 'value': exc_value}))

        for t in t_list:
            t.join()

    def end(self):
        t_list = []
        for action in self.actions_list:
            try:
                t = Thread(target=action.end)
                t_list.append(t)
                t.start()
            except:
                exc_type, exc_value, exc_traceback = sys.exc_info()
                log.e('end action error {type}: {value}'.format(**{'type': exc_type, 'value': exc_value}))

        for t in t_list:
            t.join()
