import os
import sys
import traceback

try:
    import simplejson as json
except ImportError:
    import json


class Settings():

    def __init__(self, kmotion_dir, env):
        sys.path.append(kmotion_dir)
        from core.utils import Request
        self.kmotion_dir = kmotion_dir
        self.env = env
        self.params = Request(self.env)

        from core.config import Settings

        www_rc = 'www_rc_%s' % (self.getUsername())
        if not os.path.isfile(os.path.join(kmotion_dir, 'www', www_rc)):
            www_rc = 'www_rc'

        conf = Settings.get_instance(kmotion_dir)
        self.config = conf.get(www_rc)
        config_main = conf.get('kmotion_rc')
        self.ramdisk_dir = config_main['ramdisk_dir']
        self.version = config_main['string']
        self.title = config_main['title']

    def getUsername(self):
        try:
            username = ''
            auth = self.env['HTTP_AUTHORIZATION']
            if auth:
                scheme, data = auth.split(None, 1)
                if scheme.lower() == 'basic':
                    username, password = data.decode('base64').split(':', 1)
        except Exception:
            exc_type, exc_value, exc_traceback = sys.exc_info()
            print 'error {type}: {value}'.format(**{'type': exc_type, 'value': exc_value})
        return username

    def read(self):
        config = {"ramdisk_dir": self.ramdisk_dir,
                  "version": self.version,
                  "title": self.title,
                  "feeds": {},
                  "display_feeds": {}
                  }
        exclude_options = ('feed_reboot_url',)
        config.update(self.config)
        for conf in config['feeds'].itervalues():
            for eo in exclude_options:
                if eo in conf:
                    del(conf[eo])

        return json.dumps(config)

    def write(self):
        config = json.loads(self.params['jdata'])
        config['user'] = self.getUsername()
        with open('%s/www/fifo_settings_wr' % self.kmotion_dir, 'w') as pipeout:
            pipeout.write(json.dumps(config))

        return ''

    def main(self):
        if 'read' in self.params:
            return self.read()
        elif 'write' in self.params:
            return self.write()
        else:
            return ''


if __name__ == '__main__':
    kmotion_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    print Settings(kmotion_dir, {}).read()
