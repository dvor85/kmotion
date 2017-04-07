import subprocess
from datetime import timedelta
try:
    import simplejson as json
except ImportError:
    import json


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
    """

    def __init__(self, kmotion_dir, environ):
        self.kmotion_dir = kmotion_dir
        self.environ = environ

    def main(self):
        data = {}
        uname = subprocess.Popen('uname -srvo', shell=True, stdout=subprocess.PIPE).communicate()[0]
        data['uname'] = uname.strip()

        data['cpu'] = 0
        with open('/proc/cpuinfo', 'r') as f_obj:
            for l in f_obj:
                if 'processor' in l:
                    data['cpu'] += 1

        with open('/proc/loadavg', 'r') as f_obj:
            loadavg = f_obj.readline()
            lavg = loadavg.split()
            data['l1'] = lavg[0]
            data['l2'] = lavg[1]
            data['l3'] = lavg[2]

        with open('/proc/uptime', 'r') as f_obj:
            uptime_seconds = round(float(f_obj.readline().split()[0]))
            uptime = str(timedelta(seconds=uptime_seconds))
            data['up'] = uptime

        vmstat = subprocess.Popen('vmstat -s', shell=True, stdout=subprocess.PIPE).communicate()[0].split('\n')
        data['mt'] = vmstat[0].split()[0]
        data['mf'] = vmstat[4].split()[0]
        data['mb'] = vmstat[5].split()[0]
        data['mc'] = vmstat[6].split()[0]
        data['st'] = vmstat[7].split()[0]
        data['su'] = vmstat[8].split()[0]

        vmstat = subprocess.Popen('vmstat', shell=True, stdout=subprocess.PIPE).communicate()[0].split('\n')[2].split()
        data['ci'] = vmstat[-1]
        data['cu'] = vmstat[-3]
        data['cs'] = vmstat[-4]

        return json.dumps(data)
