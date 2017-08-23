# -*- coding: utf-8 -*-
import sys
import os

kmotion_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, kmotion_dir)


def application(env, start_response):
    try:
        status = '200 OK'
        body = ''
        from wsgi_notice.http import Http
        body = Http(kmotion_dir, env)()

    except Exception:
        exc_type, exc_value, exc_traceback = sys.exc_info()
        status = '500 Error'
        body = 'error {type}: {value}'.format(**{'type': exc_type, 'value': exc_value})
    finally:
        start_response(status, [('Content-type', 'text/plain'),
                                ('Content-Length', str(len(body)))])
    return [body]


if __name__ == "__main__":
    from wsgiref.simple_server import make_server
    httpd = make_server('', 8080, application)
    httpd.serve_forever()
