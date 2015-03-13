import json, subprocess
from cgi import parse_qs, escape
from datetime import timedelta


class Loads:
    
    def __init__(self, kmotion_dir, environ):
        self.kmotion_dir = kmotion_dir
        self.environ = environ
        self.params = parse_qs(self.environ['QUERY_STRING'])
    
    def main(self):
        data = {}
        uname = subprocess.Popen('uname -srvo',shell=True,stdout=subprocess.PIPE).communicate()[0]
        data['uname'] = uname.strip()
        
        with open('/proc/loadavg','r') as f_obj:
            loadavg = f_obj.readline()        
            lavg = loadavg.split()
            data['l1'] = lavg[0]
            data['l2'] = lavg[1]
            data['l3'] = lavg[2]    

        with open('/proc/uptime', 'r') as f_obj:
            uptime_seconds = round(float(f_obj.readline().split()[0]))
            uptime = str(timedelta(seconds = uptime_seconds)) 
            data['up'] = uptime     
            
        free = subprocess.Popen('free',shell=True,stdout=subprocess.PIPE).communicate()[0].split('\n')
        free_1 = free[1].split()
        data['mt'] = free_1[1]
        data['mf'] = free_1[3]
        data['mb'] = free_1[5]
        free_3 = free[3].split()
        data['st'] = free_3[1]
        data['su'] = free_3[2]
        
        vmstat = subprocess.Popen('vmstat',shell=True,stdout=subprocess.PIPE).communicate()[0].split('\n')[2].split()
        data['cu'] = vmstat[-5]
        data['cs'] = vmstat[-4]
        data['ci'] = vmstat[-2] 
    
        return json.dumps(data)
    





