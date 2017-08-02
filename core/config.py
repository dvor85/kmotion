import os
from mutex_parsers import mutex_kmotion_parser_rd, mutex_www_parser_rd, mutex_www_parser_wr
import logger
import utils

log = logger.Logger('kmotion', logger.DEBUG)


class ConfigRW():

    def __init__(self, kmotion_dir):
        self.kmotion_dir = kmotion_dir

    def read_main(self):
        config = {}
        self.kmotion_parser = mutex_kmotion_parser_rd(self.kmotion_dir)
        for section in self.kmotion_parser.sections():
            for k, v in self.kmotion_parser.items(section):
                config[k] = utils.parseStr(v)

        return config

    def read_www(self, www_rc='www_rc'):
        if not os.path.isfile(os.path.join(self.kmotion_dir, 'www', www_rc)):
            www_rc = 'www_rc'
        self.www_parser = mutex_www_parser_rd(self.kmotion_dir, www_rc)
        max_feed = 1

        config = {"feeds": {},
                  "display_feeds": {}
                  }


#         exclude_options = ('feed_reboot_url',)

        displays = {1: 1,
                    2: 4,
                    3: 9,
                    4: max_feed,
                    5: 6,
                    6: 13,
                    7: 8,
                    8: 10,
                    9: 2,
                    10: 2,
                    11: 2,
                    12: 2}
        for display in displays:
            config['display_feeds'][display] = []

        for section in self.www_parser.sections():
            try:
                conf = {}
                for k, v in self.www_parser.items(section):
                    try:
                        if 'display_feeds_' in k:
                            display = utils.parseStr(k.replace('display_feeds_', ''))
                            config['display_feeds'][display] = utils.uniq(
                                [utils.parseStr(i) for i in v.split(',')
                                 if self.www_parser.has_section('motion_feed%02i' % int(i))])
                        else:
                            conf[k] = utils.parseStr(v)
                    except Exception as e:
                        log.exception('error: {error}'.format(error=e))

                if 'motion_feed' in section:
                    feed = int(section.replace('motion_feed', ''))
                    max_feed = max(max_feed, feed)
                    config['feeds'][feed] = conf
                elif len(conf) > 0:
                    config[section] = conf
            except Exception as e:
                log.exception('error: {error}'.format(error=e))

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

        return config

    def write_www(self, config):
        user = config["user"]
        del(config["user"])

        www_rc = 'www_rc_%s' % user
        if not os.path.isfile(os.path.join(self.kmotion_dir, 'www', www_rc)):
            www_rc = 'www_rc'

        for section in config.keys():
            if section == 'feeds':
                for feed in config[section].keys():
                    feed_section = 'motion_feed%02i' % int(feed)
                    if not self.www_parser.has_section(feed_section):
                        self.www_parser.add_section(feed_section)
                    for k, v in config[section][feed].items():
                        self.www_parser.set(feed_section, k, str(v))
            elif section == 'display_feeds':
                misc_section = 'misc'
                if not self.www_parser.has_section(misc_section):
                    self.www_parser.add_section(misc_section)
                for k, v in config[section].items():
                    if len(v) > 0:
                        self.www_parser.set(misc_section, 'display_feeds_%02i' % int(k), ','.join([str(i) for i in v]))
            else:
                if not self.www_parser.has_section(section):
                    self.www_parser.add_section(section)
                for k, v in config[section].items():
                    self.www_parser.set(section, k, str(v))
        mutex_www_parser_wr(self.kmotion_dir, self.www_parser, www_rc)
