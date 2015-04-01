'''
@author: demon
'''

from cgi import parse_qs, escape
from UserDict import UserDict

class Request(UserDict):
   
    def __init__(self, environ):
        try:
            request_body_size = int(environ.get('CONTENT_LENGTH', 0))
        except (ValueError):
            request_body_size = 0
        if environ['REQUEST_METHOD'].upper() == 'POST':
            request_body = environ['wsgi.input'].read(request_body_size)
        elif environ['REQUEST_METHOD'].upper() == 'GET':
            request_body = environ['QUERY_STRING']
        self.data = parse_qs(request_body)
    
    def __getitem__(self, key):
        return escape(UserDict.__getitem__(self, key)[0])
        
    
       
        