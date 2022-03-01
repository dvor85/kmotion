#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import os
import threading
import signal
from multiprocessing import Process
import time
from wsgiref.simple_server import make_server

import events
from core import logger
from core.config import Settings
from core import utils

log = logger.getLogger('kmotion', logger.ERROR)


class HttpServerNotice(Process):
    def __init__(self, kmotion_dir):
        Process.__init__(self)
        self.active = False
        self.daemon = True
        self.name = 'http_server_notice'
        self.kmotion_dir = kmotion_dir
        cfg = Settings.get_instance(self.kmotion_dir)
        config_main = cfg.get('kmotion_rc')
        self.config = cfg.get('www_rc')
        log.setLevel(min(config_main['log_level'], log.getEffectiveLevel()))
        notice_address = config_main.get('notice_address', ':48100').split(':')
        self.httpd = make_server(notice_address[0], int(notice_address[1]), self.application)

    def sleep(self, timeout):
        t = 0
        p = timeout - int(timeout)
        precision = p if p > 0 else 1
        while self.active and t < timeout:
            t += precision
            time.sleep(precision)
        return self.active

    def application(self, env, respond):
        try:
            body = ''
            if log.getEffectiveLevel() == logger.DEBUG:
                status = '200 OK'
                body = f"{events.STATE_START} event for {env['REMOTE_ADDR']}"
            else:
                status = '404 Not Found'

            log.debug(body)
            log.info(f"{env['REMOTE_ADDR']} {env['REQUEST_METHOD']} {env['PATH_INFO']}")
            ev = events.Events(self.kmotion_dir, env['REMOTE_ADDR'], events.STATE_START)
            threading.Thread(target=ev.start).start()

        except Exception:
            exc_type, exc_value, exc_traceback = sys.exc_info()
            log.error(f'{exc_type}: {exc_value}')
            status = '500 Error'
            if log.getEffectiveLevel() == logger.DEBUG:
                body = f'{exc_type}: {exc_value}'
        finally:
            respond(status, [('Content-type', 'text/plain'),
                             ('Content-Length', str(len(body)))])
        return [utils.utf(body)]

    def run(self, *args, **kwargs):
        self.active = True
        log.info(f'starting daemon [{self.pid}]')
        while self.active and len(self.config['feeds']) > 0:
            try:
                self.httpd.serve_forever()
            except Exception:
                log.critical('** CRITICAL ERROR **', exc_info=1)
                self.sleep(60)

    def stop(self):
        log.info(f'stop {__name__}')
        self.active = False
        if self.httpd:
            self.httpd.server_close()
        try:
            if self.pid:
                os.kill(self.pid, signal.SIGKILL)
        except Exception as e:
            log.debug(e)
