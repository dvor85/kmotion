#!/usr/bin/env python

"""
Exports various methods used to initialize motion configuration. These methods
have been moved to this seperate module to reduce issues when the motion API
changes. All changes should be in just this module.
"""

import logger
import os
import utils
from config import Settings

log = logger.Logger('kmotion', logger.DEBUG)


class InitMotion:

    def __init__(self, kmotion_dir):
        self.kmotion_dir = kmotion_dir
        cfg = Settings.get_instance(kmotion_dir)
        config_main = cfg.get('kmotion_rc')
        self.config = cfg.get('www_rc')

        self.images_dbase_dir = config_main['images_dbase_dir']
        self.ramdisk_dir = config_main['ramdisk_dir']

        self.camera_ids = sorted([f for f in self.config['feeds'].keys() if self.config['feeds'][f].get('feed_enabled', False)])

    def create_mask(self, feed):
        """
        Create a motion PGM mask from 'mask_hex_string' for feed 'feed'. Save it
        as ../core/masks/mask??.png.

        args    : kmotion_dir ...  the 'root' directory of kmotion
                  feed ...         the feed number
                  mask_hex_str ... the encoded mask hex string
        excepts :
        return  : none
        """

        mask_hex_str = self.config['feeds'][feed]['feed_mask']
        log.debug('create_mask() - mask hex string: %s' % mask_hex_str)

        image_width = self.config['feeds'][feed]['feed_width']
        image_height = self.config['feeds'][feed]['feed_height']

        log.debug('create_mask() - width: %i height: %i' % (image_width, image_height))

        black_px = '\x00'
        white_px = '\xFF'

        mask = ''
        mask_hex_split = mask_hex_str.split('#')
        px_yptr = 0

        for y in range(15):

            tmp_dec = int(mask_hex_split[y], 16)
            px_xptr = 0
            image_line = ''

            for x in range(15, 0, -1):

                px_mult = (image_width - px_xptr) / x
                px_xptr += px_mult

                bin_ = tmp_dec & 16384
                tmp_dec <<= 1

                if bin_ == 16384:
                    image_line += black_px * px_mult
                else:
                    image_line += white_px * px_mult

            px_mult = (image_height - px_yptr) / (15 - y)
            px_yptr += px_mult

            mask += image_line * px_mult

        masks_dir = os.path.join(self.kmotion_dir, 'core/masks')
        if not os.path.isdir(masks_dir):
            os.makedirs(masks_dir)
        with open(os.path.join(masks_dir, 'mask%0.2i.pgm' % feed), 'wb') as f_obj:
            f_obj.write('P5\n')
            f_obj.write('%i %i\n' % (image_width, image_height))
            f_obj.write('255\n')
            f_obj.write(mask)
        log.debug('create_mask() - mask written')

    def init_motion_out(self):
        """
        Wipes the 'motion_output' file in preperation for new output.

        args    : kmotion_dir ... the 'root' directory of kmotion
        excepts :
        return  : none
        """

        motion_out = os.path.join(self.kmotion_dir, 'www/motion_out')
        if os.path.isfile(motion_out):
            os.remove(motion_out)

    def gen_motion_configs(self):
        """
        Generates the motion.conf and thread??.conf files from www_rc and virtual
        motion conf files

        args    : kmotion_dir ... the 'root' directory of kmotion
        excepts :
        return  : none
        """

        motion_conf_dir = os.path.join(self.kmotion_dir, 'core/motion_conf')
        if not os.path.isdir(motion_conf_dir):
            os.makedirs(motion_conf_dir)
        # delete all files in motion_conf
        for del_file in [del_file for del_file in os.listdir(motion_conf_dir)
                         if os.path.isfile(os.path.join(motion_conf_dir, del_file))]:
            os.remove(os.path.join(motion_conf_dir, del_file))

        if len(self.camera_ids) > 0:  # only populate 'motion_conf' if valid feeds
            self.gen_motion_conf()
            self.gen_threads_conf()

    def gen_motion_conf(self):
        """
        Generates the motion.conf file from www_rc and the virtual motion conf files
        """

        with open('%s/core/motion_conf/motion.conf' % self.kmotion_dir, 'w') as f_obj1:
            print >> f_obj1, '''
# ------------------------------------------------------------------------------
# This config file has been automatically generated by kmotion
# Do __NOT__ modify it in any way.
# ------------------------------------------------------------------------------

# ------------------------------------------------------------------------------
# 'default' section
# ------------------------------------------------------------------------------

daemon off
quiet on
webcontrol_localhost on
webcontrol_port 8080
webcontrol_interface 2
stream_localhost on
text_right %Y-%m-%d\\n%T
text_left CAMERA %t\\nD %D N %N
movie_output off
despeckle_filter EedDl

'''

            for feed in self.camera_ids:
                print >> f_obj1, 'camera %s/core/motion_conf/thread%02i.conf\n' % (self.kmotion_dir, feed)

    def gen_threads_conf(self):
        """
        Generates the thread??.conf files from www_rc and the virtual motion conf
        files
        """

        for feed in self.camera_ids:
            with open('%s/core/motion_conf/thread%02i.conf' % (self.kmotion_dir, feed), 'w') as f_obj1:
                print >> f_obj1, '''
# ------------------------------------------------------------------------------
# This config file has been automatically generated by kmotion
# Do __NOT__ modify it in any way.
# ------------------------------------------------------------------------------

# ------------------------------------------------------------------------------
# 'default' section
# ------------------------------------------------------------------------------
event_gap 2
pre_capture 1
post_capture 10

'''
                print >> f_obj1, 'camera_id %s' % feed
                # pal or ntsc,
                print >> f_obj1, 'norm 1'

                # feed mask,
                if self.config['feeds'][feed].get('feed_mask', '0#0#0#0#0#0#0#0#0#0#0#0#0#0#0#') != '0#0#0#0#0#0#0#0#0#0#0#0#0#0#0#':
                    self.create_mask(feed)
                    print >> f_obj1, 'mask_file %s/core/masks/mask%0.2i.pgm' % (self.kmotion_dir, feed)
                print >> f_obj1, 'smart_mask_speed {speed}'.format(
                    speed=self.config['feeds'][feed].get('feed_smart_mask_speed', 0))

                # framerate,
                fps = self.config['feeds'][feed].get('feed_fps', 1)
                if fps < 2:
                    print >> f_obj1, 'minimum_frame_time 1'
                else:
                    print >> f_obj1, 'minimum_frame_time 0'
                print >> f_obj1, 'framerate {fps}'.format(fps=fps)

                print >> f_obj1, 'target_dir %s' % self.ramdisk_dir

                # device and input
                feed_device = self.config['feeds'][feed].get('feed_device', -1)
                if feed_device > -1:  # /dev/video? device
                    print >> f_obj1, 'videodevice /dev/video%s' % feed_device
                    print >> f_obj1, 'input %s' % self.config['feeds'][feed].get('feed_input', 0)
                else:  # netcam
                    print >> f_obj1, 'netcam_keepalive on'
                    print >> f_obj1, 'netcam_url  %s' % self.config['feeds'][feed]['feed_url']
                    print >> f_obj1, 'netcam_proxy %s' % self.config['feeds'][feed].get('feed_proxy', '')
                    print >> f_obj1, 'netcam_userpass %s:%s' % (
                        self.config['feeds'][feed]['feed_lgn_name'],
                        self.config['feeds'][feed]['feed_lgn_pw'])

                print >> f_obj1, 'width %s' % self.config['feeds'][feed]['feed_width']
                print >> f_obj1, 'height %s' % self.config['feeds'][feed]['feed_height']

                print >> f_obj1, 'noise_level %s' % self.config['feeds'][feed].get('feed_noise_level', 32)
                print >> f_obj1, 'noise_tune {0}'.format('on' if self.config['feeds'][feed].get('feed_noise_tune') else 'off')
                print >> f_obj1, 'threshold %s' % self.config['feeds'][feed].get('feed_threshold', 300)

                # show motion box
                print >> f_obj1, 'locate_motion_mode {0}'.format(
                    'on' if self.config['feeds'][feed].get('feed_show_box') else 'off')
                print >> f_obj1, 'locate_motion_style box'

                # always on for feed updates
                if fps > 1:
                    print >> f_obj1, 'picture_output on'
                else:
                    print >> f_obj1, 'picture_output off'
                print >> f_obj1, 'picture_quality %s' % self.config['feeds'][feed].get('feed_quality', 85)
                print >> f_obj1, 'picture_filename %0.2i/%%Y%%m%%d%%H%%M%%S%%q' % feed
                print >> f_obj1, 'snapshot_interval 1'
                print >> f_obj1, 'snapshot_filename %0.2i/%%Y%%m%%d%%H%%M%%S' % feed

                print >> f_obj1, ''

                motion_detector = self.config['feeds'][feed].get('motion_detector', 1)
                if motion_detector == 1:
                    print >> f_obj1, 'on_event_start %s/core/events.py %i start' % (self.kmotion_dir, feed)
                    print >> f_obj1, 'on_event_end %s/core/events.py %i end' % (self.kmotion_dir, feed)

                print >> f_obj1, 'on_camera_lost %s/core/camera_lost.py %i' % (self.kmotion_dir, feed)
                print >> f_obj1, 'on_picture_save %s/core/picture_save.py %%f %s' % (
                    self.kmotion_dir, self.config['feeds'][feed].get('feed_webpicture_scale', 1))

# Module test code


if __name__ == '__main__':

    print '\nModule self test ... generating motion.conf and threads\n'
    kmotion_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    InitMotion(kmotion_dir).gen_motion_configs()
