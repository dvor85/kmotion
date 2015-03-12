import sys,os
from wsgiref.simple_server import make_server
from cgi import parse_qs, escape

def application(environ, start_response): 
    kmotion_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
    sys.path.append(kmotion_dir) 
    from www.wsgi.archive import Archive
    from www.wsgi.feeds import Feeds
    from www.wsgi.loads import Loads
    from www.wsgi.logs import Logs
    from www.wsgi.outs import Outs 
    
    try:
        status = '200 OK' 
        path_info = escape(environ['PATH_INFO'])
        body = ''
        if path_info == '/archive':
            body = Archive(kmotion_dir, environ).main()
        elif path_info == '/feeds':
            body = Feeds(kmotion_dir, environ).main()
        elif path_info == '/loads':
            body = Loads(kmotion_dir, environ).main()
        elif path_info == '/logs':
            body = Logs(kmotion_dir, environ).main()
        elif path_info == '/outs':
            body = Outs(kmotion_dir, environ).main()
        
    except:
        exc_type, exc_value, exc_traceback = sys.exc_info()
        status = '500 Error'
        body = 'error {type}: {value}'.format(**{'type':exc_type, 'value':exc_value})
    finally:
        start_response(status, [('Content-type', 'text/plain'),
                                ('Content-Length', str(len(body)))])
    return [body]
    
if __name__ == '__main__':

    httpd = make_server('', 8080, application)
    print "Serving on port 8080..."
    httpd.serve_forever()
    