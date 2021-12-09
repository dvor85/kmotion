# -*- coding: utf-8 -*-
from __future__ import absolute_import, division, unicode_literals, print_function, generators

import os
import subprocess
from datetime import timedelta
from core.config import Settings
from core import utils


class Loads:
    """
    The box name
    uname:<name>

    Server info
    sr:<server info>

    Server uptime
    up:<uptime>

    Max cpus cores
    cpu:<number>

    The load averages for 1min, 5min, 15min
    l1:<number>
    l2:<number>
    l3:<number>

    The CPU user, system and IO wait percent
    cu:<percent>
    cs:<percent>
    ci:<percent>

    The memory total, free, buffers, cached
    mt:<total>
    mf:<free>
    mb:<buffers>
    mc:<cached>

    The swap total, used
    st:<total>
    su:<used>

    File system stat
    """

    def __init__(self, kmotion_dir, env):
        self.kmotion_dir = kmotion_dir
        self.env = env

        self.username = utils.safe_str(env.get('REMOTE_USER'))
        cfg = Settings.get_instance(self.kmotion_dir)

        www_rc = 'www_rc_%s' % (self.username)
        if not os.path.isfile(os.path.join(kmotion_dir, 'www', www_rc)):
            raise Exception('Incorrect configuration!')
        self.config = cfg.get(www_rc)
        self.config_main = cfg.get('kmotion_rc')

    def __call__(self):
        data = {}
        if self.config['misc']['config_enabled']:
            try:
                data['uname'] = utils.uni(subprocess.check_output('uname -srvo', shell=True)).strip()
            except Exception as e:
                data['uname'] = e.message
            data['cpu'] = 0
            with open('/proc/cpuinfo', 'r') as f_obj:
                for l in f_obj:
                    if 'processor' in l:
                        data['cpu'] += 1

            with open('/proc/loadavg', 'r') as f_obj:
                loadavg = f_obj.readline()
                data['loadavg'] = loadavg.split()

            with open('/proc/uptime', 'r') as f_obj:
                uptime_seconds = round(float(f_obj.readline().split()[0]))
                uptime = str(timedelta(seconds=uptime_seconds))
                data['up'] = uptime

            try:
                vmstat = utils.uni(subprocess.check_output('vmstat -s', shell=True, stdout=subprocess.PIPE)).splitlines()
                data['memstat'] = dict(mt=vmstat[0].split()[0],
                                       mf=vmstat[4].split()[0],
                                       mb=vmstat[5].split()[0],
                                       mc=vmstat[6].split()[0],
                                       st=vmstat[7].split()[0],
                                       su=vmstat[8].split()[0])
            except Exception as e:
                data['memstat'] = e.message

            try:
                vmstat_a = utils.uni(subprocess.check_output('vmstat', shell=True)).splitlines()[1:]
                vmstat_d = dict((k, v) for (k, v) in zip(vmstat_a[0].split(), vmstat_a[1].split()))
                data['cpuusage'] = dict(ci=vmstat_d["wa"],
                                        cu=vmstat_d["sy"],
                                        cs=vmstat_d["us"])
            except Exception as e:
                data['cpuusage'] = e.message

            try:
                dfout = utils.uni(subprocess.check_output('df -h "{images_dbase_dir}"'.format(
                    images_dbase_dir=self.config_main['images_dbase_dir']), shell=True)).splitlines()[1].split()
                data['fsarch'] = dfout[2:]
            except Exception as e:
                data['fsarch'] = e.message
            try:
                dfout = utils.uni(subprocess.check_output('df -h "{ramdisk_dir}"'.format(
                    ramdisk_dir=self.config_main['ramdisk_dir']), shell=True)).splitlines()[1].split()
                data['fsramdisk'] = dfout[2:]
            except Exception as e:
                data['fsramdisk'] = e.message

        return data
