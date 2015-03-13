
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
        feeds = self.params['feeds'][0].split(',')
        events = os.listdir(os.path.join(self.ramdisk_dir,'events'))
        dfeeds['events'] = events
                            
#         auth = self.environ['HTTP_AUTHORIZATION']
#         if auth:
#             scheme, data = auth.split(None, 1)
#             assert scheme.lower() == 'basic'
#             username, password = data.decode('base64').split(':', 1)
        
        latest = {}
        for feed in feeds:
            jpg_list = os.listdir('%s/%02i' % (self.ramdisk_dir, int(feed)))
            jpg_list.sort()
            if len(jpg_list)>0:
                latest[feed] = jpg_list[-1]
        
        dfeeds['latest'] = latest
        
        return json.dumps(dfeeds)
        
        
























