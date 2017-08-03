import sys
import os
from cgi import escape


def application(env, start_response):
    kmotion_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    sys.path.append(kmotion_dir)

    try:
        status = '200 OK'
        body = ''

        path_info = escape(env['PATH_INFO'])
        if path_info == '/archive':
            from wsgi.archive import Archive
            body = Archive(kmotion_dir, env).main()
        elif path_info == '/feeds':
            from wsgi.feeds import Feeds
            body = Feeds(kmotion_dir, env).main()
        elif path_info == '/loads':
            from wsgi.loads import Loads
            body = Loads(kmotion_dir, env).main()
        elif path_info == '/logs':
            from wsgi.logs import Logs
            body = Logs(kmotion_dir, env).main()
        elif path_info == '/outs':
            from wsgi.outs import Outs
            body = Outs(kmotion_dir, env).main()
        elif path_info == '/config':
            from wsgi.config import Settings
            body = Settings(kmotion_dir, env).main()

    except Exception:
        exc_type, exc_value, exc_traceback = sys.exc_info()
        status = '500 Error'
        body = 'error {type}: {value}'.format(**{'type': exc_type, 'value': exc_value})
    finally:
        start_response(status, [('Content-type', 'text/plain'),
                                ('Content-Length', str(len(body)))])
    return [body]


if __name__ == '__main__':
    from wsgiref.simple_server import make_server
    httpd = make_server('', 8080, application)
    print "Serving on port 8080..."
    httpd.serve_forever()
