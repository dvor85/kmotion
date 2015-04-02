import os, sys, json, datetime,traceback


class ConfigRW():
    
    def __init__(self, kmotion_dir, environ): 
        sys.path.append(kmotion_dir)  
        from core.request import Request             
        self.kmotion_dir = kmotion_dir
        self.environ = environ
        self.params = Request(self.environ)
              
        from core.mutex_parsers import mutex_kmotion_parser_rd, mutex_www_parser_rd
        
        www_rc = 'www_rc_%s' % (self.getUsername())                              
        if not os.path.isfile(os.path.join(kmotion_dir, 'www', www_rc)):
            www_rc = 'www_rc'
        self.www_parser = mutex_www_parser_rd(self.kmotion_dir, www_rc)
        self.kmotion_parser = mutex_kmotion_parser_rd(self.kmotion_dir)
        self.ramdisk_dir = self.kmotion_parser.get('dirs', 'ramdisk_dir')
        self.version = self.kmotion_parser.get('version', 'string')
        self.title = self.kmotion_parser.get('version', 'title')     
        
        
    def getUsername(self):
        try:
            username = ''
            auth = self.environ['HTTP_AUTHORIZATION']            
            if auth:
                scheme, data = auth.split(None, 1)
                if scheme.lower() == 'basic':
                    username, password = data.decode('base64').split(':', 1)
        except:
            exc_type, exc_value, exc_traceback = sys.exc_info()
            print 'error {type}: {value}'.format(**{'type':exc_type, 'value':exc_value})
        return username
    
    def parseStr(self, s):
        try:
            return int(s)
        except:
            try:
                return float(s)
            except:
                if s.lower() == "true":
                    return True
                elif s.lower() == "false":
                    return False
        return s
    
    def read(self):
        max_feed = 1
        config = {"ramdisk_dir": self.ramdisk_dir,
                  "version": self.version,
                  "title": self.title,
                  "feeds": {},
                  "display_feeds": {}
                  }
                
        for section in self.www_parser.sections():
            try:
                conf = {}
                for k, v in self.www_parser.items(section):
                    try:
                        if 'display_feeds_' in k:                        
                            display = self.parseStr(k.replace('display_feeds_', ''))
                            config['display_feeds'][display] = [self.parseStr(i) for i in v.split(',')]   
                        else:
                            conf[k] = self.parseStr(v) 
                    except:
                        exc_type, exc_value, exc_traceback = sys.exc_info()
                        print 'error {type}: {value}'.format(**{'type':exc_type, 'value':exc_value})                       
                
                if 'motion_feed' in section:
                    feed = int(section.replace('motion_feed', '')) 
                    max_feed = max(max_feed, feed)                   
                    config['feeds'][feed] = conf                                  
                elif len(conf) > 0:
                    config[section] = conf                        
            except:
                exc_type, exc_value, exc_traceback = sys.exc_info()
                print 'error {type}: {value}'.format(**{'type':exc_type, 'value':exc_value})
                
        config['feeds']['length'] = len(config['feeds'])  
        config['feeds']['max_feed'] = max_feed      
        return json.dumps(config)
    
    def write(self):
        try: 
            import core.logger as logger
            self.log = logger.Logger('config_setd', logger.DEBUG)
            config = json.loads(self.params['jdata'])
            config['user'] = self.getUsername()
            with open('%s/www/fifo_settings_wr' % self.kmotion_dir, 'w') as pipeout: 
                pipeout.write(json.dumps(config))
        except:  # global exception catch
            exc_type, exc_value, exc_tb = sys.exc_info()
            exc_trace = traceback.extract_tb(exc_tb)[-1]
            exc_loc1 = '%s' % exc_trace[0]
            exc_loc2 = '%s(), Line %s, "%s"' % (exc_trace[2], exc_trace[1], exc_trace[3])
            
            self.log('** CRITICAL ERROR ** crash - type: %s' % exc_type)
            self.log('** CRITICAL ERROR ** crash - value: %s' % exc_value)
            self.log('** CRITICAL ERROR ** crash - traceback: %s' % exc_loc1)
            self.log('** CRITICAL ERROR ** crash - traceback: %s' % exc_loc2) 
            del(exc_tb)
            
        return ''
        
    
    def main(self):
        if self.params.has_key('read'):
            return self.read()
        elif self.params.has_key('write'):
            return self.write()
        else:
            return ''
       

            
            
            