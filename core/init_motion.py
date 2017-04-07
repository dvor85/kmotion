#!/usr/bin/env python


"""
Exports various methods used to initialize motion configuration. These methods
have been moved to this seperate module to reduce issues when the motion API
changes. All changes should be in just this module.
"""

import logger
from mutex_parsers import *

log = logger.Logger('kmotion', logger.DEBUG)


class InitMotion:

    def __init__(self, kmotion_dir):
        self.kmotion_dir = kmotion_dir
        self.kmotion_parser = mutex_kmotion_parser_rd(self.kmotion_dir)
        self.www_parser = mutex_www_parser_rd(self.kmotion_dir)

        self.images_dbase_dir = self.kmotion_parser.get('dirs', 'images_dbase_dir')
        self.ramdisk_dir = self.kmotion_parser.get('dirs', 'ramdisk_dir')

        self.feed_list = []
        for section in self.www_parser.sections():
            try:
                if 'motion_feed' in section:
                    if self.www_parser.getboolean(section, 'feed_enabled'):
                        feed = int(section.replace('motion_feed', ''))
                        self.feed_list.append(feed)
            except Exception:
                log.exception('init error')
        self.feed_list.sort()

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

        mask_hex_str = self.www_parser.get('motion_feed%02i' % feed, 'feed_mask')
        log.debug('create_mask() - mask hex string: %s' % mask_hex_str)

        image_width = self.www_parser.getint('motion_feed%02i' % feed, 'feed_width')
        image_height = self.www_parser.getint('motion_feed%02i' % feed, 'feed_height')

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

        if len(self.feed_list) > 0:  # only populate 'motion_conf' if valid feeds
            self.gen_motion_conf()
            self.gen_threads_conf()

    def gen_motion_conf(self):
        """
        Generates the motion.conf file from www_rc and the virtual motion conf files

        args    : kmotion_dir ... the 'root' directory of kmotion
                  feed_list ...   a list of enabled feeds
                  ramdisk_dir ... the ramdisk directory
        excepts :
        return  : none
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

quiet on

# ------------------------------------------------------------------------------
# 'user' section from 'virtual_motion_conf/motion.conf'
# ------------------------------------------------------------------------------
'''
            # this is a user changable file so error trap
            try:
                with open('%s/virtual_motion_conf/motion.conf' % self.kmotion_dir, 'r') as f_obj2:
                    user_conf = f_obj2.read()
            except IOError:
                print >> f_obj1, '# virtual_motion_conf/motion.conf not readable - ignored'
                log.exception('no motion.conf readable in virtual_motion_conf dir - none included in final motion.conf')
            else:
                print >> f_obj1, user_conf

            print >> f_obj1, '''
# ------------------------------------------------------------------------------
# 'override' section
# ------------------------------------------------------------------------------

daemon off
control_port 8080
control_localhost on
'''

            for feed in self.feed_list:
                print >> f_obj1, 'thread %s/core/motion_conf/thread%02i.conf\n' % (self.kmotion_dir, feed)

    def gen_threads_conf(self):
        """
        Generates the thread??.conf files from www_rc and the virtual motion conf
        files

        args    : kmotion_dir ...      the 'root' directory of kmotion
                  feed_list ...        a list of enabled feeds
                  ramdisk_dir ...      the ram disk directory
                  images_dbase_dir ... the images dbase directory
        excepts :
        return  : none
        """

        for feed in self.feed_list:
            with open('%s/core/motion_conf/thread%02i.conf' % (self.kmotion_dir, feed), 'w') as f_obj1:
                print >> f_obj1, '''
# ------------------------------------------------------------------------------
# This config file has been automatically generated by kmotion
# Do __NOT__ modify it in any way.
# ------------------------------------------------------------------------------

# ------------------------------------------------------------------------------
# 'default' section
# ------------------------------------------------------------------------------

gap 2
pre_capture 1
post_capture 10
quality 85
webcam_localhost off
'''
                # pal or ntsc,
                print >> f_obj1, 'norm 1'

                # feed mask,
                if self.www_parser.get('motion_feed%02i' % feed, 'feed_mask') != '0#0#0#0#0#0#0#0#0#0#0#0#0#0#0#':
                    self.create_mask(feed)
                    print >> f_obj1, 'mask_file %s/core/masks/mask%0.2i.pgm' % (self.kmotion_dir, feed)

                # framerate,
                print >> f_obj1, 'framerate 3'  # default for feed updates

                print >> f_obj1, '''
# ------------------------------------------------------------------------------
# 'user' section from 'virtual_motion_conf/thread%02i.conf'
# ------------------------------------------------------------------------------
''' % feed

                # this is a user changable file so error trap
                try:
                    with open('%s/virtual_motion_conf/thread%02i.conf' % (self.kmotion_dir, feed)) as f_obj2:
                        user_conf = f_obj2.read()
                except IOError:
                    print >> f_obj1, '# virtual_motion_conf/thread%02i.conf not readable - ignored' % feed
                    log.exception('no feed%02i.conf readable in virtual_motion_conf dir - none included in final motion.conf' % feed)
                else:
                    print >> f_obj1, user_conf

                print >> f_obj1, '''
# ------------------------------------------------------------------------------
# 'override' section
# ------------------------------------------------------------------------------

snapshot_interval 1
webcam_localhost off
'''
                print >> f_obj1, 'target_dir %s' % self.ramdisk_dir

                # device and input
                feed_device = int(self.www_parser.get('motion_feed%02i' % feed, 'feed_device'))
                if feed_device > -1:  # /dev/video? device
                    print >> f_obj1, 'videodevice /dev/video%s' % feed_device
                    print >> f_obj1, 'input %s' % self.www_parser.get('motion_feed%02i' % feed, 'feed_input')
                else:  # netcam
                    print >> f_obj1, 'netcam_url  %s' % self.www_parser.get('motion_feed%02i' % feed, 'feed_url')
                    print >> f_obj1, 'netcam_proxy %s' % self.www_parser.get('motion_feed%02i' % feed, 'feed_proxy')
                    print >> f_obj1, 'netcam_userpass %s:%s' % (
                        self.www_parser.get('motion_feed%02i' % feed, 'feed_lgn_name'),
                        self.www_parser.get('motion_feed%02i' % feed, 'feed_lgn_pw'))

                print >> f_obj1, 'width %s' % self.www_parser.get('motion_feed%02i' % feed, 'feed_width')
                print >> f_obj1, 'height %s' % self.www_parser.get('motion_feed%02i' % feed, 'feed_height')

                print >> f_obj1, 'threshold %s' % self.www_parser.get('motion_feed%02i' % feed, 'feed_threshold')
                print >> f_obj1, 'quality %s' % self.www_parser.get('motion_feed%02i' % feed, 'feed_quality')

                # show motion box
                if self.www_parser.getboolean('motion_feed%02i' % feed, 'feed_show_box'):
                    print >> f_obj1, 'locate on'

                # always on for feed updates
                print >> f_obj1, 'output_normal off'
                print >> f_obj1, 'jpeg_filename %s/%%Y%%m%%d/%0.2i/snap/%%H%%M%%S' % (self.images_dbase_dir, feed)

                print >> f_obj1, ''

                print >> f_obj1, 'snapshot_filename %0.2i/%%Y%%m%%d%%H%%M%%S' % feed
                print >> f_obj1, 'on_event_start %s/core/events.py %i start' % (self.kmotion_dir, feed)
                print >> f_obj1, 'on_event_end %s/core/events.py %i end' % (self.kmotion_dir, feed)
                print >> f_obj1, 'on_camera_lost %s/core/camera_lost.py %i' % (self.kmotion_dir, feed)
                print >> f_obj1, 'on_picture_save %s/core/picture_save.py %%f' % (self.kmotion_dir)


# Module test code

if __name__ == '__main__':

    print '\nModule self test ... generating motion.conf and threads\n'
    kmotion_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    InitMotion(kmotion_dir).gen_motion_configs()
