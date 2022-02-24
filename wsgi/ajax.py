# -*- coding: utf-8 -*-
import sys
from pathlib import Path
from jsonrpc2 import JsonRpcApplication


kmotion_dir = Path(__file__).absolute().parent.parent
sys.path.insert(0, kmotion_dir.as_posix())


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
