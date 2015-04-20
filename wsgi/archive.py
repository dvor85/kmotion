#!/usr/bin/env python

"""
Returns the archive data index's
"""

import os, sys, json, datetime



class Archive():
    def __init__(self, kmotion_dir, environ):
        sys.path.append(kmotion_dir)
        from core.request import Request
        from core.mutex_parsers import mutex_kmotion_parser_rd, mutex_www_parser_rd        
        self.kmotion_dir = kmotion_dir
        self.environ = environ
        self.params = Request(self.environ)
        self.func = self.params['func']
        kmotion_parser = mutex_kmotion_parser_rd(self.kmotion_dir)
        self.images_dbase_dir = kmotion_parser.get('dirs', 'images_dbase_dir')        
        www_rc = 'www_rc_%s' % (self.getUsername())                              
        if not os.path.isfile(os.path.join(kmotion_dir, 'www', www_rc)):
            www_rc = 'www_rc'
        self.www_rc_parser = mutex_www_parser_rd(self.kmotion_dir, www_rc)
        
    def getUsername(self):
        try:
            username = ''
            auth = self.environ['HTTP_AUTHORIZATION']            
            if auth:
                scheme, data = auth.split(None, 1)
                if scheme.lower() == 'basic':
                    username, password = data.decode('base64').split(':', 1)
        except:
            exc_type, exc_value, exc_traceback = sys.exc_info()
            print 'error {type}: {value}'.format(**{'type':exc_type, 'value':exc_value})
        return username
        
    def main(self):
        if self.func == 'dates':
            return self.get_dates()
        elif self.func == 'movies':
            return self.journal_data(self.params['date'], int(self.params['feed']))
        elif self.func == 'feeds':
            return self.get_feeds(self.params['date'])
        
    def get_feeds(self, date):
        self.feed_list = []
        for section in self.www_rc_parser.sections():
            try:
                if 'motion_feed' in section:
                    feed = int(section.replace('motion_feed',''))
                    if self.www_rc_parser.getboolean(section, 'feed_enabled'):                        
                        self.feed_list.append(feed)
            except:
                exc_type, exc_value, exc_traceback = sys.exc_info()
                print('init - error {type}: {value}'.format(**{'type':exc_type, 'value':exc_value}))
        self.feed_list.sort()
        
        feeds_list = []
        feed_obj = {}
        for feed in self.feed_list:
            try:
                feed_dir = os.path.join(self.images_dbase_dir, date, '%02i' % int(feed))
                if os.path.isdir(feed_dir):
                    title = 'Camera %s' % feed 
                    with open(os.path.join(feed_dir, 'title'), 'r') as f_obj: 
                        title = f_obj.read()
                
                    feed_obj[feed] = {'movie_flag': os.path.isdir(os.path.join(feed_dir , 'movie')),
                                       'snap_flag': os.path.isdir(os.path.join(feed_dir, 'snap')),
                                       'title': title}
                    
            except:
                exc_type, exc_value, exc_traceback = sys.exc_info()
                print 'error {type}: {value}'.format(**{'type':exc_type, 'value':exc_value})
                    
            feeds_list.append(feed_obj)
        return json.dumps(feeds_list)
        

    def get_dates(self):

        dates = [i for i in os.listdir(self.images_dbase_dir) if len(i) == 8] 
        dates.sort(reverse=True)        

        return json.dumps(dates)
    
    def hhmmss_secs(self, hhmmss_str):
        return int(hhmmss_str[0,2]) * 3600 + int(hhmmss_str[2,2]) * 60 + int(hhmmss_str[4,2])
                
    
    def journal_data(self, date, feed):
        
        journal = {}
        movies_dir = '%s/%s/%02i/movie' % (self.images_dbase_dir, date, feed)
        if os.path.isdir(movies_dir):
            movies = os.listdir(movies_dir)
            movies.sort()
            journal['movies'] = []
            for m in movies:
                mf = os.path.join(movies_dir, m)
                movie = {}
                movie['start'] = self.hhmmss_secs(os.path.splitext(m)[0])
                movie['end'] = self.hhmmss_secs(datetime.datetime.fromtimestamp(os.path.getmtime(mf)).strftime('%H%M%S'))
                movie['file'] = os.path.normpath(mf.replace(self.images_dbase_dir, '/images_dbase/'))             
                journal['movies'].append(movie)
        
        snaps_dir = '%s/%s/%02i/snap' % (self.images_dbase_dir, date, feed)
        if os.path.isdir(snaps_dir):
            snaps = [os.path.normpath(m.replace(self.images_dbase_dir, '/images_dbase/')) for m in os.listdir(snaps_dir)]
            snaps.sort()
            journal['snaps'] = snaps
             
        return json.dumps(journal)
        
    





