#!/usr/bin/env python

"""
Returns the archive data index's
"""

import os, sys, json, datetime
from cgi import parse_qs, escape


class Archive():
    def __init__(self, kmotion_dir, environ):
        sys.path.append(kmotion_dir)
        from core.mutex_parsers import mutex_kmotion_parser_rd
        self.kmotion_dir = kmotion_dir
        self.environ = environ
        self.params = parse_qs(self.environ['QUERY_STRING'])
        self.func = escape(self.params['func'][0])
        parser = mutex_kmotion_parser_rd(self.kmotion_dir)
        self.images_dbase_dir = parser.get('dirs', 'images_dbase_dir')
        
    def main(self):
        if self.func == 'avail':
            return self.date_feed_avail_data(self.params['feeds'])
        elif self.func == 'index':
            return self.journal_data(escape(self.params['date'][0]), int(escape(self.params['feed'][0])))
        

    def date_feed_avail_data(self, feeds):

        date_feed_obj = {}       
                
        dates = [i for i in os.listdir(self.images_dbase_dir) if len(i) == 8] 
        dates.sort()
        for date in dates:
            
            # feeds = [i for i in os.listdir(os.path.join(self.images_dbase_dir, date)) if (len(i) == 2)] 
            # feeds.sort()
            
            try:
                for feed in feeds:
                    try:
                        feeds_obj = {}
                        feed_dir = os.path.join(self.images_dbase_dir, date, '%02i' % int(feed))
                        if os.path.isdir(feed_dir):
                            title = 'Camera %s' % feed 
                            with open(os.path.join(feed_dir, 'title'), 'r') as f_obj: 
                                title = f_obj.read()
                        
                            feeds_obj[feed] = {'movie_flag': os.path.isdir(os.path.join(feed_dir , 'movie')),
                                               'snap_flag': os.path.isdir(os.path.join(feed_dir, 'snap')),
                                               'title': title}
                    
                        date_feed_obj[date] = feeds_obj    
                    except:
                        exc_type, exc_value, exc_traceback = sys.exc_info()
                        print 'error {type}: {value}'.format(**{'type':exc_type, 'value':exc_value})        
            except:
                exc_type, exc_value, exc_traceback = sys.exc_info()
                print 'error {type}: {value}'.format(**{'type':exc_type, 'value':exc_value})

        return json.dumps(date_feed_obj)
                
    
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
                movie['start'] = os.path.splitext(m)[0]
                movie['end'] = datetime.datetime.fromtimestamp(os.path.getmtime(mf)).strftime('%H%M%S')
                movie['file'] = os.path.normpath(mf.replace(self.images_dbase_dir, '/images_dbase/'))             
                journal['movies'].append(movie)
        
        snaps_dir = '%s/%s/%02i/snap' % (self.images_dbase_dir, date, feed)
        if os.path.isdir(snaps_dir):
            snaps = [m.replace(self.images_dbase_dir, '/images_dbase/') for m in os.listdir(snaps_dir)]
            snaps.sort()
            journal['snaps'] = snaps
             
        return json.dumps(journal)
        
    





