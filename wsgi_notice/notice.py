# -*- coding: utf-8 -*-
import sys
import os
from jsonrpc2 import JsonRpcApplication

kmotion_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, kmotion_dir)


def application(env, start_response):

    from wsgi_notice.http import Http
    app = JsonRpcApplication(rpcs=dict(notice=Http(kmotion_dir, env)))

    return app(env, start_response)


if __name__ == "__main__":
    from wsgiref.simple_server import make_server
    httpd = make_server('', 8080, application)
    httpd.serve_forever()
