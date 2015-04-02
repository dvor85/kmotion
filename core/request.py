'''
@author: demon
'''

from cgi import parse_qs, escape
from UserDict import UserDict

class Request(UserDict):
   
    def __init__(self, environ):
        
        self.data = parse_qs(environ['QUERY_STRING'])
        if environ['REQUEST_METHOD'].upper() == 'POST':
            try:           
                request_body_size = int(environ.get('CONTENT_LENGTH', 0))
            except (ValueError):
                request_body_size = 0
            self.data.update(parse_qs(environ['wsgi.input'].read(request_body_size)))        
        
    
    def __getitem__(self, key):
        return escape(UserDict.__getitem__(self, key)[0])
        
    
       
        