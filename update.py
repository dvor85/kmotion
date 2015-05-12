"""
This process update configs from version 5.6- to 6.0+
"""
import os
from core.mutex_parsers import *

class Update(object):

    def __init__(self, kmotion_dir):
        self.kmotion_dir = kmotion_dir
        
    def update_www_rcs(self):
        exclude_options = ['misc1_full_screen',
                           'misc1_interleave',
                           'misc1_low_bandwidth',
                           'misc1_low_cpu',
                           'misc1_skip_frames',
                           'misc2_about_button_enabled',
                           'misc2_func_button_enabled',
                           'misc2_function_button_enabled',
                           'misc2_logout_button_enabled',
                           'misc2_msg_button_enabled',
                           'misc3_config_hash',
                           'misc3_secure',
                           'feed_movie_enabled',
                           'feed_smovie_enabled']
        
        www_rcs = [x for x in os.listdir(os.path.join(self.kmotion_dir, 'www')) if x.startswith('www_rc')]
        for www_rc in www_rcs:
            print 'update %s' % www_rc 
            parser = mutex_www_parser_rd(self.kmotion_dir, www_rc)
            for section in parser.sections():
                
                for k, value in parser.items(section):
                    if k in exclude_options or k.startswith('ptz_'):
                        parser.remove_option(section, k)
                        continue
                    
                    if section == 'misc':                        
                        if k.startswith('misc'):
                            parser.remove_option(section, k)
                            option = k[6:]
                            parser.set(section, option, value)
                        
                if 'motion_feed' in section: 
                    if www_rc != 'www_rc':
                        feed_enabled = parser.getboolean(section, 'feed_enabled')
                        parser.remove_section(section)
                        parser.add_section(section)
                        parser.set(section, 'feed_enabled', str(feed_enabled))
                        continue
                    
                    feed = section.replace('motion_feed', '')                    
                    sh_ = os.path.join(self.kmotion_dir, 'event', '%s.sh' % feed)
                    if os.path.isfile(sh_):
                        with open(sh_, 'r') as sh_file:
                            sh_lines = sh_file.read().splitlines()
                        sh_dict = {}
                        for l in sh_lines:
                            kv = [x.strip() for x  in l[7:].split('=')]
                            if kv[1].endswith("'") or kv[1].endswith('"'):
                                kv[1] = kv[1][1:-1]
                            sh_dict[kv[0]] = kv[1]
                        parser.set(section, 'feed_actions', 'rtsp2mp4')     
                        parser.set(section, 'feed_reboot_url', sh_dict['reboot_url'].replace('$ip', sh_dict['ip']))
                        parser.set(section, 'rtsp2mp4_grab_url', sh_dict['url'].replace('$ip', sh_dict['ip']))
                        parser.set(section, 'rtsp2mp4_recode', str(sh_dict['recode'] == 1))
                        parser.set(section, 'rtsp2mp4_sound', str(sh_dict['sound'] == 1))
                        parser.set(section, 'feed_kbs', str(sh_dict['bitrate']))
                        
                elif 'schedule' in section or 'system' in section:
                    parser.remove_section(section)     
                    
            mutex_www_parser_wr(self.kmotion_dir, parser, www_rc)           
                        
    def update_kmotion_rc(self):
        print 'update kmotion_rc'
        parser = mutex_kmotion_parser_rd(self.kmotion_dir)
        parser.remove_option('misc', 'max_feed')
        parser.remove_section('workaround')
        mutex_kmotion_parser_wr(self.kmotion_dir, parser)
        
if __name__ == '__main__':
    kmotion_dir = os.path.abspath(os.path.dirname(__file__))
    upd = Update(kmotion_dir)    
    upd.update_kmotion_rc()    
    upd.update_www_rcs()
                    
