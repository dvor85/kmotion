
import os, json
from cgi import parse_qs, escape

class Feeds():
    
    def __init__(self, kmotion_dir, environ):        
        self.kmotion_dir = kmotion_dir
        self.environ = environ
        self.params = parse_qs(self.environ['QUERY_STRING'])
        self.ramdisk_dir = escape(self.params['rdd'][0])
    
    def main(self):
        
        dfeeds = {}
        #feeds = self.params['feeds'][0].split(',')
        #events = [f for f in os.listdir(os.path.join(self.ramdisk_dir, 'events')) if f in feeds]
        events = os.listdir(os.path.join(self.ramdisk_dir, 'events'))
        events.sort()
        dfeeds['events'] = events
                            
#         auth = self.environ['HTTP_AUTHORIZATION']
#         if auth:
#             scheme, data = auth.split(None, 1)
#             assert scheme.lower() == 'basic'
#             username, password = data.decode('base64').split(':', 1)
        
        #latest = {}
        #for feed in feeds:
    #        feed = int(feed)
    #        jpg_dir = os.path.join(self.ramdisk_dir, '%02i' % feed, 'www')
    #        if os.path.isdir(jpg_dir):
#                jpg_list = os.listdir(jpg_dir)
#            if len(jpg_list) == 0:
#                jpg_dir = os.path.join(self.ramdisk_dir, '%02i' % feed)
#                jpg_list = os.listdir(jpg_dir)
#            jpg_list.sort()
#            while len(jpg_list) > 0: 
#                ljpg = os.path.join(jpg_dir, jpg_list.pop())                
#                if os.path.isfile(ljpg) and ljpg.endswith('.jpg'):
#                    latest[feed] = os.path.normpath(ljpg.replace(self.ramdisk_dir, '/kmotion_ramdisk/'))
#                    break
#         
#        latest['length'] = len(latest)
#        dfeeds['latest'] = latest
        
        return json.dumps(dfeeds)
        
        
























