# -*- coding: utf-8 -*-
from __future__ import absolute_import, division, unicode_literals, print_function, generators
import os
import sys
from jsonrpc2 import JsonRpcApplication


kmotion_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, kmotion_dir)


def application(env, start_response):

    path_info = env.get('PATH_INFO')
    if path_info == '/archive':
        from wsgi.archive import Archive
        app = JsonRpcApplication(rpcs=dict(archive=Archive(kmotion_dir, env)))
    elif path_info == '/feeds':
        from wsgi.feeds import Feeds
        app = JsonRpcApplication(rpcs=dict(feeds=Feeds(kmotion_dir, env)))
    elif path_info == '/loads':
        from wsgi.loads import Loads
        app = JsonRpcApplication(rpcs=dict(loads=Loads(kmotion_dir, env)))
    elif path_info == '/logs':
        from wsgi.logs import Logs
        app = JsonRpcApplication(rpcs=dict(logs=Logs(kmotion_dir, env)))
    elif path_info == '/outs':
        from wsgi.outs import Outs
        app = JsonRpcApplication(rpcs=dict(outs=Outs(kmotion_dir, env)))
    elif path_info == '/config':
        from wsgi.config import Config
        app = JsonRpcApplication(rpcs=dict(config=Config(kmotion_dir, env)))
    else:
        app = JsonRpcApplication()

    return app(env, start_response)


if __name__ == "__main__":
    from wsgiref.simple_server import make_server
    httpd = make_server('', 8080, application)
    print("Serving on port 8080...")
    httpd.serve_forever()
