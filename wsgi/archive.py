# -*- coding: utf-8 -*-

import os
import sys
import datetime
from core.config import Settings
from core import utils


class Archive():

    def __init__(self, kmotion_dir, env):
        self.kmotion_dir = kmotion_dir
        self.env = env

        self.username = utils.true_enc(utils.safe_str(env.get('REMOTE_USER')))
        cfg = Settings.get_instance(self.kmotion_dir)
        config_main = cfg.get('kmotion_rc')
        self.images_dbase_dir = config_main['images_dbase_dir']
        www_rc = 'www_rc_%s' % (self.username)
        if not os.path.isfile(os.path.join(kmotion_dir, 'www', www_rc)):
            www_rc = 'www_rc'
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
        for feed, conf in self.config['feeds'].iteritems():
            try:
                if conf.get('feed_enabled'):
                    feed_dir = os.path.join(self.images_dbase_dir, date, '%02i' % feed)
                    if os.path.isdir(feed_dir):
                        title = 'Cam %02i' % feed
                        with open(os.path.join(feed_dir, 'title'), 'r') as f_obj:
                            title = f_obj.read()

                        feeds_list[feed] = {'movie_flag': os.path.isdir(os.path.join(feed_dir, 'movie')),
                                            'snap_flag': os.path.isdir(os.path.join(feed_dir, 'snap')),
                                            'title': title}
            except Exception:
                exc_type, exc_value, exc_traceback = sys.exc_info()
                print('init - error {type}: {value}'.format(**{'type': exc_type, 'value': exc_value}))

        return feeds_list

    def get_dates(self):

        dates = [i for i in os.listdir(self.images_dbase_dir) if len(i) == 8]
        dates.sort(reverse=True)

        return dates

    def hhmmss_secs(self, hhmmss_str):
        return int(hhmmss_str[0:2]) * 3600 + int(hhmmss_str[2:4]) * 60 + int(hhmmss_str[4:6])

    def journal_data(self, date, feed):

        journal = {}
        if feed in self.config['feeds'].keys():
            movies_dir = '%s/%s/%02i/movie' % (self.images_dbase_dir, date, feed)
            if os.path.isdir(movies_dir):
                movies = os.listdir(movies_dir)
                movies.sort()
                journal['movies'] = []
                for m in movies:
                    mf = os.path.join(movies_dir, m)
                    end = datetime.datetime.fromtimestamp(os.path.getmtime(mf))
                    dt = datetime.datetime.now() - end
                    if dt.total_seconds() > 10:
                        movie = {}
                        movie['start'] = self.hhmmss_secs(os.path.splitext(m)[0])
                        movie['end'] = self.hhmmss_secs(end.strftime('%H%M%S'))
                        movie['file'] = os.path.normpath(mf.replace(self.images_dbase_dir, '/images_dbase/'))
                        journal['movies'].append(movie)

            snaps_dir = '%s/%s/%02i/snap' % (self.images_dbase_dir, date, feed)
            if os.path.isdir(snaps_dir):
                snaps = os.listdir(snaps_dir)
                snaps.sort()
                journal['snaps'] = []
                for m in snaps:
                    mf = os.path.join(snaps_dir, m)
                    snap = {}
                    snap['start'] = self.hhmmss_secs(os.path.splitext(m)[0])
                    snap['file'] = os.path.normpath(mf.replace(self.images_dbase_dir, '/images_dbase/'))
                    journal['snaps'].append(snap)

        return journal
