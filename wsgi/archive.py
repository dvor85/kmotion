# -*- coding: utf-8 -*-

import datetime
from core.config import Settings
from core import utils, logger
from pathlib import Path

log = logger.getLogger('kmotion', logger.ERROR)


class Archive():

    def __init__(self, kmotion_dir, env):
        self.kmotion_dir = kmotion_dir
        self.env = env

        self.username = utils.safe_str(env.get('REMOTE_USER'))
        cfg = Settings.get_instance(self.kmotion_dir)
        config_main = cfg.get('kmotion_rc')
        log.setLevel(min(config_main['log_level'], log.getEffectiveLevel()))
        self.images_dbase_dir = Path(config_main['images_dbase_dir'])
        www_rc = f'www_rc_{self.username}'
        if not Path(kmotion_dir, 'www', www_rc).is_file():
            raise Exception('Incorrect configuration!')
        self.config = cfg.get(www_rc)

    def __call__(self, *args, **kwargs):
        if self.config['misc']['archive_enabled']:
            func = utils.safe_str(kwargs.get('func'))
            if func == 'dates':
                return self.get_dates()
            elif func == 'movies':
                return self.journal_data(utils.safe_str(kwargs['date']), int(kwargs['feed']))
            elif func == 'feeds':
                return self.get_feeds(utils.safe_str(kwargs['date']))

    def get_feeds(self, date):
        feeds_list = {}
        for feed, conf in self.config['feeds'].items():
            try:
                if conf.get('feed_enabled'):
                    feed_title = Path(self.images_dbase_dir, date, f'{feed:02}', 'title')
                    feeds_list[feed] = {'title': feed_title.read_text() if feed_title.is_file() else conf.get('feed_name', f'{feed:02}')}
            except Exception:
                log.exception("Get feeds error")

        return feeds_list

    def get_dates(self):
        dates = sorted([i.name for i in self.images_dbase_dir.iterdir() if i.is_dir() and not i.name.startswith('.')], reverse=True)
        return dates

    def hhmmss_secs(self, hhmmss_str):
        return int(hhmmss_str[0:2]) * 3600 + int(hhmmss_str[2:4]) * 60 + int(hhmmss_str[4:6])

    def journal_data(self, date, feed):
        journal = {"movies": [], "snaps": []}
        if feed in self.config['feeds']:
            movies_dir = Path(self.images_dbase_dir, date, f'{feed:02}', 'movie')
            if movies_dir.is_dir():
                for mf in movies_dir.iterdir():
                    end = datetime.datetime.fromtimestamp(mf.stat().st_mtime)
                    dt = datetime.datetime.now() - end
                    if dt.total_seconds() > 10:
                        journal['movies'].append({
                            'start': self.hhmmss_secs(mf.stem[-6:]),
                            'end': self.hhmmss_secs(end.strftime('%H%M%S')),
                            'file': Path('/images_dbase', mf.relative_to(self.images_dbase_dir)).as_posix()
                        })

            snaps_dir = Path(self.images_dbase_dir, date, f'{feed:02}', 'snap')
            if snaps_dir.is_dir():
                for mf in snaps_dir.iterdir():
                    snap = {}
                    snap['start'] = self.hhmmss_secs(mf.stem[-6:])
                    snap['end'] = snap['start']
                    snap['file'] = Path('/images_dbase', mf.relative_to(self.images_dbase_dir)).as_posix()
                    journal['snaps'].append(snap)

        return journal
