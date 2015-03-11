/*
Copyright 2008 David Selby dave6502@googlemail.com

This file is part of kmotion.

kmotion is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

kmotion is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with kmotion.  If not, see <http://www.gnu.org/licenses/>.
*/

/* *****************************************************************************
Define global namespaces & variables
***************************************************************************** */

var KM = {};

// colors
KM.RED =       '#FF0000';
KM.YELLOW =    '#FFFF00';
KM.GREEN =     '#00FF00';
KM.BLUE =      '#0000FF';
KM.BLACK =     '#000000';
KM.WHITE =     '#FFFFFF';
KM.GREY	=      '#C1C1C1';
KM.DARK_GREY = '#818181';
KM.GHOST =     '#E2E2E2';

// 'timeout_id' group contants
KM.BUTTON_BAR =   0;
KM.ERROR_DAEMON = 1;
KM.GET_DATA     = 2;
KM.FEED_CACHE   = 3;
KM.DISPLAY_LOOP = 4;
KM.ARCH_LOOP    = 5;
KM.LOGS         = 6;
KM.CONFIG_LOOP  = 7;
KM.MISC_JUMP    = 8;

KM.server = {
    latest_jpegs:  [],
    latest_events: [],
    feed_caches:   [],
    servo_state: 0
};

KM.browser = {
    browser_FF: false,      // browser is firefox
    browser_IE: false,      // browser is internet explorer
    browser_OP:	false,	    // browser is opera
    browser_SP:	false,	    // browser is on a smartphone
    main_display_width:  0, // px
    main_display_height: 0  // px
};

KM.session_id = {
    current: 0 // the current 'live' session id, used to kill old sessions
};

KM.menu_bar_buttons = {
    function_selected:   0,     // the function selected
    display_sec_enabled: false, // enabled sections ...
    camera_sec_enabled:  false,
    func_sec_enabled:    false,
    ptz_sec_enabled:     false
};



KM.live = {
    last_camera_select: 0, // the last camera selected
    ptz_feed:           0  // ptz active feed
};


KM.config = {
    session_id:	     0, // the session id
    pwd_change: false, // the password has changed
    camera:          1, // the current camera
    mask:           '', // the current expanded mask string
    ptz_current_x:   0, // calculated abs position
    ptz_current_y:   0,
    sched_pastebin: '',
    error_str:      '', // the error string
    error_search_str: /failed|error/i
};

KM.fill_arr = function (arr, len, fill) {
	//console.log(arr);
	var fill_index=0;
	while (arr.length < len) {
		if (fill==='index') {
			arr.push(++fill_index);
		}
		else {
			arr.push(fill);
		}
	}
	return arr;
};

KM.www_rc = {
    // mimics the configuration in 'www_rc'
    feed_enabled:  KM.fill_arr(['pad'], max_feed, false),
    feed_pal:  KM.fill_arr(['pad'], max_feed, false),
    feed_show_box: KM.fill_arr(['pad'],max_feed, false),
    feed_mask:     KM.fill_arr(['pad'], max_feed, ''),
    feed_device:   KM.fill_arr(['pad'], max_feed, ''),
    feed_url:      KM.fill_arr(['pad'], max_feed, ''),
    feed_proxy:    KM.fill_arr(['pad'], max_feed, ''),
    feed_lgn_name: KM.fill_arr(['pad'], max_feed, ''),
    feed_lgn_pw:   KM.fill_arr(['pad'], max_feed, ''),
    feed_name:     KM.fill_arr(['pad'], max_feed, ''),
    feed_input:    KM.fill_arr(['pad'], max_feed, 0),
    feed_width:    KM.fill_arr(['pad'], max_feed, 0),
    feed_height:   KM.fill_arr(['pad'], max_feed, 0),
    feed_snap_enabled:   KM.fill_arr(['pad'],max_feed, false),
    feed_smovie_enabled: KM.fill_arr(['pad'],max_feed, false),
    feed_movie_enabled:  KM.fill_arr(['pad'],max_feed, false),
    feed_snap_interval:  KM.fill_arr(['pad'], max_feed, 0),
    feed_fps:      KM.fill_arr(['pad'], max_feed, 0),

    // schedule and schedule exception config
    sched_except: ['pad', 0, 0, 0, 0, 0, 0, 0],
    sched_tline1: ['pad', '', '', '', '', '', '', '', ''],
    sched_tline2: ['pad', '', '', '', '', '', '', '', ''],
    sched_tline3: ['pad', '', '', '', '', '', '', '', ''],
    sched_tline4: ['pad', '', '', '', '', '', '', '', ''],
    sched_tline5: ['pad', '', '', '', '', '', '', '', ''],
    sched_tline6: ['pad', '', '', '', '', '', '', '', ''],
    sched_tline7: ['pad', '', '', '', '', '', '', '', ''],

    except_tline1_dates: ['pad', '', '', '', '', '', '', '', ''],
    except_tline2_dates: ['pad', '', '', '', '', '', '', '', ''],
    except_tline3_dates: ['pad', '', '', '', '', '', '', '', ''],
    except_tline4_dates: ['pad', '', '', '', '', '', '', '', ''],
    except_tline5_dates: ['pad', '', '', '', '', '', '', '', ''],
    except_tline6_dates: ['pad', '', '', '', '', '', '', '', ''],
    except_tline7_dates: ['pad', '', '', '', '', '', '', '', ''],

    except_tline1: ['pad', '', '', '', '', '', '', '', ''],
    except_tline2: ['pad', '', '', '', '', '', '', '', ''],
    except_tline3: ['pad', '', '', '', '', '', '', '', ''],
    except_tline4: ['pad', '', '', '', '', '', '', '', ''],
    except_tline5: ['pad', '', '', '', '', '', '', '', ''],
    except_tline6: ['pad', '', '', '', '', '', '', '', ''],
    except_tline7: ['pad', '', '', '', '', '', '', '', ''],

    // PTZ misc config
    ptz_enabled: KM.fill_arr(['pad'],max_feed, false),
    ptz_calib_first: KM.fill_arr(['pad'],max_feed, false),
    ptz_servo_settle: KM.fill_arr(['pad'], max_feed, 0),
    ptz_step_x: KM.fill_arr(['pad'], max_feed, 0),
    ptz_step_y: KM.fill_arr(['pad'], max_feed, 0),

    // PTZ park config
    ptz_park_enabled: KM.fill_arr(['pad'],max_feed, false),
    ptz_track_type: KM.fill_arr(['pad'], max_feed, 0),
    ptz_park_delay: KM.fill_arr(['pad'], max_feed, 0),
    ptz_park_x: KM.fill_arr(['pad'], max_feed, 0),
    ptz_park_y: KM.fill_arr(['pad'], max_feed, 0),

    // PTZ preset config
    ptz_preset1_x: KM.fill_arr(['pad'], max_feed, 0),
    ptz_preset1_y: KM.fill_arr(['pad'], max_feed, 0),
    ptz_preset2_x: KM.fill_arr(['pad'], max_feed, 0),
    ptz_preset2_y: KM.fill_arr(['pad'], max_feed, 0),
    ptz_preset3_x: KM.fill_arr(['pad'], max_feed, 0),
    ptz_preset3_y: KM.fill_arr(['pad'], max_feed, 0),
    ptz_preset4_x: KM.fill_arr(['pad'], max_feed, 0),
    ptz_preset4_y: KM.fill_arr(['pad'], max_feed, 0),

    // display cameras
    display_cameras: [],

    // live mode config
    interleave:    false,
    full_screen:   false,
    low_bandwidth: false,
    low_cpu:       false,

    // archive mode config
    skip_frames:   false,

    // button enables config
    archive_button_enabled: true,
    logs_button_enabled:    true,
    config_button_enabled:  true,
    func_button_enabled:    true,
    msg_button_enabled:     true,
    panic_button_enabled:   false,
    audible_button_enabled: false,
    about_button_enabled:   true,
    logout_button_enabled:  true,

    // function buttons enabled config
    func_enabled: KM.fill_arr(['pad'],max_feed, false),

    // misc config
    secure:      true, // secure login to config
    display_select:  1,
    color_select:    1,
    config_hash:    '',
    msg:            '',
	hide_button_bar: false
};

KM.www_rc.display_cameras[1] =  KM.fill_arr(['pad'], 2, 'index');
KM.www_rc.display_cameras[2] =  KM.fill_arr(['pad'], 4, 'index');
KM.www_rc.display_cameras[3] =  KM.fill_arr(['pad'], 10, 'index');
KM.www_rc.display_cameras[4] =  KM.fill_arr(['pad'], max_feed, 'index');
KM.www_rc.display_cameras[5] =  KM.fill_arr(['pad'], 7, 'index');
KM.www_rc.display_cameras[6] =  KM.fill_arr(['pad'], 14, 'index');
KM.www_rc.display_cameras[7] =  KM.fill_arr(['pad'], 9, 'index');
KM.www_rc.display_cameras[8] =  KM.fill_arr(['pad'], 11, 'index');
KM.www_rc.display_cameras[9] =  KM.fill_arr(['pad'], 3, 'index');
KM.www_rc.display_cameras[10] = KM.fill_arr(['pad'], 3, 'index');
KM.www_rc.display_cameras[11] = KM.fill_arr(['pad'], 3, 'index');
KM.www_rc.display_cameras[12] = KM.fill_arr(['pad'], 3, 'index');

// hide javascript errors
//KM.handle_error = function () return true;
//window.onerror = handle_error;


/* ****************************************************************************
System - Misc code

Miscellaneous code that provides general closures and functions for kmotion
**************************************************************************** */

KM.toggle_button_bar=function () {
	var button_bar=document.getElementById('button_bar');
	var h_button_bar=document.getElementById('toggle_button_bar');
	if (button_bar.style.display=='none') {
		button_bar.style.display='block';
		h_button_bar.style.right='165px';
		document.getElementById('main_display').style.right='165px';
	} else {
		button_bar.style.display='none';
		h_button_bar.style.right='0px';
		document.getElementById('main_display').style.right='10px';
	}

	KM.function_button_clicked(KM.menu_bar_buttons.function_selected);
}

KM.timeout_ids = function () {

    // A closure that stores and purges 'setTimeout' ids to stop memory leaks.
    // ids are split into 'groups' for up to eight different sections of code.

    var timeout_ids = [];
    for (var i = 0; i < 9; i++) {
        timeout_ids[i] = [];
    }

    return {

	add_id: function (group, timeout_id) {

	    // A function to add a timeout id
	    //
	    // expects :
	    //
	    // 'group' ...	group
	    // 'timeout_id' ... timeout id
	    //

	    timeout_ids[group][timeout_ids[group].length] = timeout_id;
	},

	cull_ids: function (group) {

	    // A function to kill all but the last timeout id
	    //
	    // expects :
	    //
	    // 'group' ...	group
	    //

	    if (timeout_ids[group].length > 1) {
	        for (var i = 0; i < timeout_ids[group].length - 1; i++) {
		    clearTimeout(timeout_ids[group][i]);
		    delete timeout_ids[group][i];
		}
		timeout_ids[group].length = 1;
	    }
	},

	kill_ids: function (group) {

	    // A function to kill all timeout id
	    //
	    // expects :
	    //
	    // 'group' ...	group
	    //

	    if (timeout_ids[group].length > 1) {
		for (var i = 0; i < timeout_ids[group].length; i++) {
		    clearTimeout(timeout_ids[group][i]);
		    delete timeout_ids[group][i];
		}
		timeout_ids[group].length = 1;
	    }
	}
    };
};

KM.timeout = KM.timeout_ids();

KM.add_timeout_id = KM.timeout.add_id;
    // add a timeout id

KM.cull_timeout_ids = KM.timeout.cull_ids;
    // cull all but the last timeout id, freeing memory

KM.kill_timeout_ids = KM.timeout.kill_ids;
    // kill all ids, freeing memory


KM.get_xmlHttp_obj = function () {

    // A function that generates and returns an appropreate 'xmlHttp' object for
    // the current browser
    //
    // expects :
    //
    // returns :
    // 'xmlHttp' ... 'xmlHttp' object

    var xmlHttp = null;
    try {           // Firefox, Opera 8.0+, Safari
        xmlHttp = new XMLHttpRequest();
    }
    catch (e) {     // Internet Explorer
        try {
            xmlHttp = new ActiveXObject("Msxml2.XMLHTTP");
        }
        catch (e) { // Internet Explorer 5.5
            xmlHttp = new ActiveXObject("Microsoft.XMLHTTP");
        }
    }
    return xmlHttp;
};


KM.load_settings = function (callback) {

    // a closure that loads the kmotion browser settings from the server
    // 'www_rc' file via an 'xmlHttp' call to 'xmlHttp_settings_rd.py'

    function get_settings(callback) {

	// A function that retrieves raw 'www_rc' data from the server using
	// repeated 'xmlHttp' calls to 'xmlHttp_settings_rd.py'
	//
	// expects :
	// 'callback' ... the callback object
	//
	// returns :
	//

	// local 'xmlHttp' object to enable multiple instances, one for each
	// function call.
	var xmlHttp = KM.get_xmlHttp_obj();
	var got_settings = false;
	function request() {
	    xmlHttp.onreadystatechange = function () {
		if (xmlHttp.readyState === 4) {
		    xmlHttp.onreadystatechange = null; // plug memory leak
		    var data = xmlHttp.responseText.trim();
			// final integrity check - if this data gets corrupted we are
		    // in a world of hurt ...
		    // 'data.substr(data.length - 5)' due to IE bug !
			if (parseInt(data.substr(data.length - 8), 10) === data.length - 13) {
			got_settings = true;
			KM.kill_timeout_ids(KM.GET_DATA);
			set_settings(data, callback);
		    }
		}
	    };
	    xmlHttp.open('GET', '/cgi_bin/xmlHttp_settings_rd.php' + '?mfd='+max_feed+'&rnd=' + new Date().getTime(), true);
	    xmlHttp.send(null);
	}

	function retry() {
	    if (!got_settings) {
		request();
		KM.add_timeout_id(KM.GET_DATA, setTimeout(function () {retry(); }, 5000));
	    }
	}
	retry();
    }


    function set_settings(data, callback) {

	// A function that splits the raw 'www_rc' data and loads the browser
	// settings then executes 'callback'
	//
	// expects :
	// 'data' ...     the raw 'www_rc' data
	// 'callback' ... the callback object
	//
	// returns :
	//

	KM.set_main_display_size();
	var user_agent = navigator.userAgent.toLowerCase();

	KM.browser.browser_IE = user_agent.search('msie') > -1;
	KM.browser.browser_FF = user_agent.search('firefox') > -1;
	KM.browser.browser_OP = user_agent.search('opera') > -1;

	KM.browser.browser_SP = (user_agent.search('iphone') > -1 ||
	user_agent.search('ipod') > -1 || user_agent.search('android') > -1 || user_agent.search('ipad') > -1 ||
	user_agent.search('iemobile') > -1 ||  user_agent.search('blackberry') > -1);

	var data_secs = data.split("$");
	var par_split, key, index;
	// i = 1 because datablob starts with a $
	//console.log(data_secs);
	for (var i = 1; i < data_secs.length; i++) {
	    par_split = data_secs[i].split(':');

	    if (par_split[0].length > 3) {
		key = par_split[0].substring(0, 3);
		index = parseInt(par_split[0].substring(3), 10);
	    } else {
		key = par_split[0];	// the 3 digit id ie 'fen' or 'fha'
		index = '';		// optional list pointer for the id
	    }
	    var value = par_split[1];

	    switch (key) {
		case 'ine': // interleave enabled
		    KM.www_rc.interleave = (parseInt(value, 10) === 1);
		    break;
		case 'mfd': // max_feed
		    //max_feed = parseInt(value, 10);
			//console.log(max_feed);
		    break;
		case 'fse': // full screen enabled
		    KM.www_rc.full_screen = (parseInt(value, 10) === 1);
		    break;
		case 'lbe': // low bandwidth enabled
		    KM.www_rc.low_bandwidth = (parseInt(value, 10) === 1);
		    break;
		case 'lce': // low cpu enabled
		    KM.www_rc.low_cpu = (parseInt(value, 10) === 1);
		    break;
		case 'skf': // skip archive frames enabled
		    KM.www_rc.skip_frames = (parseInt(value, 10) === 1);
		    break;
		case 'are': // archive button enabled
		    KM.www_rc.archive_button_enabled = (parseInt(value, 10) === 1);
		    break;
		case 'lge': // logs button enabled
		    KM.www_rc.logs_button_enabled = (parseInt(value, 10) === 1);
		    break;
		case 'coe': // config button enabled
		    KM.www_rc.config_button_enabled = (parseInt(value, 10) === 1);
		    break;
		case 'fue': // func button enabled
		    KM.www_rc.func_button_enabled = (parseInt(value, 10) === 1);
		    break;
		case 'spa': // spare button enabled
		    KM.www_rc.msg_button_enabled = (parseInt(value, 10) === 1);
		    break;
		case 'abe': // about button enabled
		    KM.www_rc.about_button_enabled = (parseInt(value, 10) === 1);
		    break;
		case 'loe': // logout button enabled
		    KM.www_rc.logout_button_enabled = (parseInt(value, 10) === 1);
		    break;
		case 'fne': // functions enabled
		    KM.www_rc.func_enabled[index] = (parseInt(value, 10) === 1);
		    break;

		case 'sec': // secure config
		    KM.www_rc.secure = (parseInt(value, 10) === 1);
		    break;
		case 'coh': // config hash code
		    KM.www_rc.config_hash = value;
		    break;

		case 'fma': // feed mask
		    KM.www_rc.feed_mask[index] = value;
		    break;

		case 'fen': // feed enabled
			//console.log(value);
			//console.log(index);
		    KM.www_rc.feed_enabled[index] = (parseInt(value, 10) === 1);
		    break;
		case 'fpl': // feed pal
		    KM.www_rc.feed_pal[index] = (parseInt(value, 10) === 1);
		    break;
		case 'fde': // feed device
		    KM.www_rc.feed_device[index] = value;
		    break;
		case 'fin': // feed input
		    KM.www_rc.feed_input[index] = parseInt(value, 10);
		    break;
		case 'ful': // feed url
		    KM.www_rc.feed_url[index] = KM.collapse_chars(value);
			break;
		case 'fpr': // feed proxy
		    KM.www_rc.feed_proxy[index] = KM.collapse_chars(value);
		    break;
		case 'fln': // feed login name
		    KM.www_rc.feed_lgn_name[index] = KM.collapse_chars(value);
		    break;
		case 'flp': // feed login password (*'d)
		    KM.www_rc.feed_lgn_pw[index] = KM.collapse_chars(value);
		    break;
		case 'fwd': // feed width
		    KM.www_rc.feed_width[index] = parseInt(value, 10);
		    break;
		case 'fhe': // feed height
		    KM.www_rc.feed_height[index] = parseInt(value, 10);
		    break;
		case 'fna': // feed name
		    KM.www_rc.feed_name[index] = KM.collapse_chars(value);
		    break;
		case 'fbo': // feed show box
		    KM.www_rc.feed_show_box[index] = (parseInt(value, 10) === 1);
		    break;
		case 'ffp': // feed fps
		    KM.www_rc.feed_fps[index] = parseInt(value, 10);
		    break;
		case 'fpe': // feed snap enabled
		    KM.www_rc.feed_snap_enabled[index] = (parseInt(value, 10) === 1);
		    break;
		case 'fsn': // feed snap interval
		    KM.www_rc.feed_snap_interval[index] = parseInt(value, 10);
		    break;
		case 'ffe': // feed frame enabled
		    KM.www_rc.feed_smovie_enabled[index] = (parseInt(value, 10) === 1);
		    break;
		case 'fme': // feed ffmpeg enabled
		    KM.www_rc.feed_movie_enabled[index] = (parseInt(value, 10) === 1);
		    break;

		case 'psx': // ptz step x
		    KM.www_rc.ptz_step_x[index] = parseInt(value, 10);
		    break;
		case 'psy': // ptz step y
		    KM.www_rc.ptz_step_y[index] = parseInt(value, 10);
		    break;
		case 'ptt': // ptz track type (driver)
		    KM.www_rc.ptz_track_type[index] = parseInt(value, 10);
		    break;
		case 'pte': // ptz enabled
		    KM.www_rc.ptz_enabled[index] = (parseInt(value, 10) === 1);
		    break;
		case 'ptc': // ptz calib first
		    KM.www_rc.ptz_calib_first[index] = (parseInt(value, 10) === 1);
		    break;
		case 'pts': // ptz server settle
		    KM.www_rc.ptz_servo_settle[index] = parseFloat(value, 10);
		    break;
		case 'ppe': // ptz park enabled
		    KM.www_rc.ptz_park_enabled[index] = (parseInt(value, 10) === 1);
		    break;
		case 'ppd': // ptz park delay
		    KM.www_rc.ptz_park_delay[index] = parseInt(value, 10);
		    break;
		case 'ppx': // ptz park x
		    KM.www_rc.ptz_park_x[index] = parseInt(value, 10);
		    break;
		case 'ppy': // ptz park y
		    KM.www_rc.ptz_park_y[index] = parseInt(value, 10);
		    break;
		case 'p1x': // ptz preset 1 x
		    KM.www_rc.ptz_preset1_x[index] = parseInt(value, 10);
		    break;
		case 'p1y': // ptz preset 1 y
		    KM.www_rc.ptz_preset1_y[index] = parseInt(value, 10);
		    break;
		case 'p2x': // ptz preset 2 x
		    KM.www_rc.ptz_preset2_x[index] = parseInt(value, 10);
		    break;
		case 'p2y': // ptz preset 2 y
		    KM.www_rc.ptz_preset2_y[index] = parseInt(value, 10);
		    break;
		case 'p3x': // ptz preset 3 x
		    KM.www_rc.ptz_preset3_x[index] = parseInt(value, 10);
		    break;
		case 'p3y': // ptz preset 3 y
		    KM.www_rc.ptz_preset3_y[index] = parseInt(value, 10);
		    break;
		case 'p4x': // ptz preset 4 x
		    KM.www_rc.ptz_preset4_x[index] = parseInt(value, 10);
		    break;
		case 'p4y': // ptz preset 4 y
		    KM.www_rc.ptz_preset4_y[index] = parseInt(value, 10);
		    break;

		case 'sex': // schedule exception
		    KM.www_rc.sched_except[index] = parseInt(value, 10);
		    break;
		case 'st1': // schedule time line 1
		    KM.www_rc.sched_tline1[index] = value;
		    break;
		case 'st2': // schedule time line 2
		    KM.www_rc.sched_tline2[index] = value;
		    break;
		case 'st3': // schedule time line 3
		    KM.www_rc.sched_tline3[index] = value;
		    break;
		case 'st4': // schedule time line 4
		    KM.www_rc.sched_tline4[index] = value;
		    break;
		case 'st5': // schedule time line 5
		    KM.www_rc.sched_tline5[index] = value;
		    break;
		case 'st6': // schedule time line 6
		    KM.www_rc.sched_tline6[index] = value;
		    break;
		case 'st7': // schedule time line 7
		    KM.www_rc.sched_tline7[index] = value;
		    break;

		case 'ed1': // exception time line 1 dates
		    KM.www_rc.except_tline1_dates[index] = value;
		    break;
		case 'ed2': // exception time line 2 dates
		    KM.www_rc.except_tline2_dates[index] = value;
		    break;
		case 'ed3': // exception time line 3 dates
		    KM.www_rc.except_tline3_dates[index] = value;
		    break;
		case 'ed4': // exception time line 4 dates
		    KM.www_rc.except_tline4_dates[index] = value;
		    break;
		case 'ed5': // exception time line 5 dates
		    KM.www_rc.except_tline5_dates[index] = value;
		    break;
		case 'ed6': // exception time line 6 dates
		    KM.www_rc.except_tline6_dates[index] = value;
		    break;
		case 'ed7': // exception time line 7 dates
		    KM.www_rc.except_tline7_dates[index] = value;
		    break;

		case 'et1': // exception time line 1
		    KM.www_rc.except_tline1[index] = value;
		    break;
		case 'et2': // exception time line 2
		    KM.www_rc.except_tline2[index] = value;
		    break;
		case 'et3': // exception time line 3
		    KM.www_rc.except_tline3[index] = value;
		    break;
		case 'et4': // exception time line 4
		    KM.www_rc.except_tline4[index] = value;
		    break;
		case 'et5': // exception time line 5
		    KM.www_rc.except_tline5[index] = value;
		    break;
		case 'et6': // exception time line 6
		    KM.www_rc.except_tline6[index] = value;
		    break;
		case 'et7': // exception time line 7
		    KM.www_rc.except_tline7[index] = value;
		    break;

		case 'dif': // display feeds
		    var feeds = value.split(",");
		    for (var j = 0; ((j < feeds.length) & ( j < max_feed )); j++) {
				var feed_ = parseInt(feeds[j], 10);
				if (feed_ < max_feed) {
					KM.www_rc.display_cameras[index][j + 1] = feed_;
				}
		    }
		    break;

		case 'col': // background color
		    KM.www_rc.color_select = parseInt(value, 10);
		    break;
		case 'dis': // display select
		    KM.www_rc.display_select = parseInt(value, 10);
		    break;

		case 'msg': // message
		    KM.www_rc.msg = KM.collapse_chars(value);
		    break;
		case 'hbb': //hide_button_bar
			KM.www_rc.hide_button_bar = (parseInt(value, 10) === 1);
			break;
	    }
	}
	// finally tha callback
	callback();
    }
    get_settings(callback);
};


KM.set_main_display_size = function () {

    // A function that uses black magic to calculate the main display width
    // and height, saves them in 'browser.main_display_width' and
    // 'KM.browser.main_display_height'
    //
    // expects:
    //
    // returns :
    //

    var width, height;
    // the more standards compliant browsers (mozilla/netscape/opera/IE7) use
    // window.innerWidth and window.innerHeight
    if (typeof window.innerWidth !== 'undefined') {
        width = window.innerWidth;
        height = window.innerHeight;
    }

    // IE6 in standards compliant mode
    else if (typeof document.documentElement !== 'undefined' &&
    typeof document.documentElement.clientWidth !== 'undefined' &&
    document.documentElement.clientWidth !== 0) {
        width = document.documentElement.clientWidth;
        height = document.documentElement.clientHeight;
    }

    // older versions of IE
    else {
        width = document.getElementsByTagName('body')[0].clientWidth;
        height = document.getElementsByTagName('body')[0].clientHeight;
    }
	if (document.getElementById('button_bar').style.display=='none') {
		KM.browser.main_display_width = width - 16; // def -183
	} else {
		KM.browser.main_display_width = width - 183; // def -183
	}

    KM.browser.main_display_height = height - 16;
};


KM.exe_script = function (script, val) {

    // A function that executes a given server script with a 'xmlHttp' call
    // passing 'val='. Does not define 'onreadystatechange' for a return value.
    // Called by 'func' and 'ptz' code.
    //
    // expects :
    //
    // returns :
    //

    var xmlHttp = KM.get_xmlHttp_obj();
    xmlHttp.open('GET', script + '?val=' + val + '&rnd=' + new Date().getTime(), true);
    xmlHttp.send(null);
};


KM.secs_hhmmss = function (secs) {

    // A function that convers a seconds count to a 'HHMMSS' string
    //
    // expects :
    // 'secs' ... a seconds count
    //
    // returns :
    // 'time' ... a 'HHMMSS' string

    var hh = parseInt(secs / (60 * 60), 10);
    var mm = parseInt((secs - (hh * 60 * 60)) / 60, 10);
    var ss = parseInt(secs - (hh * 60 * 60) - (mm * 60), 10);
    return KM.pad_out2(hh) + KM.pad_out2(mm) + KM.pad_out2(ss);
};


KM.secs_hh_mm_ss = function (secs) {

    // A function that convers a seconds count to a 'HH:MM:SS' string
    //
    // expects :
    // 'secs' ... a seconds count
    //
    // returns :
    // 'time' ... a 'HH:MM:SS' string

    var hh = parseInt(secs / (60 * 60), 10);
    var mm = parseInt((secs - (hh * 60 * 60)) / 60, 10);
    var ss = parseInt(secs - (hh * 60 * 60) - (mm * 60), 10);
    return KM.pad_out2(hh) + ':' + KM.pad_out2(mm) + ':' + KM.pad_out2(ss);
};


KM.expand_chars = function(text)  {

    // A function that expands problem characters that get corrupted in xmlHttp
    // calls
    //
    // expects :
    // 'text' ... a text string
    //
    // returns :
    // 'text' ... an expanded text string

    text = text.replace(/&/g, '<amp>');
    text = text.replace(/\?/g, '<que>');
    text = text.replace(/:/g, '<col>');
    return text
};


KM.collapse_chars = function(text)  {

    // A function that collapses expanded problem characters that get corrupted
    // in xmlHttp calls
    //
    // expects :
    // 'text' ... a text string
    //
    // returns :
    // 'text' ... a collapsed text string

    text = text.replace(/<amp>/g, '&');
    text = text.replace(/<que>/g, '?');
    text = text.replace(/<col>/g, ':');
    return text;
};


KM.item_in_array = function (item, list) {

    // A function to implement an 'in array' method
    //
    // expects :
    // 'item' ... the searched for object
    // 'list' ... the list object
    //
    // returns :
    // 'bool' ... found true / false

    var str_item = item.toString();
    for (var i = 0; i < list.length; i++) {
        if (list[i].toString() === str_item) {
            return true;
        }
    }
    return false;
};


KM.pad_out = function (val, pad) {

    // A function to implement zero fill string padding
    //
    // expects :
    // 'val' ... the object to be padded
    // 'pad' ... the required width
    //
    // returns :
    // 'string' ... the zero filled padded string

    var fill = '00000000000000000000';
    if (String(val).length < pad) {
	val = fill.substr(0, pad - String(val).length) + String(val);
    }
    return String(val);
};


KM.pad_out2 = function (val) {
    // pad to 2 digit with zero
    return KM.pad_out(val, 2);
};


KM.pad_out4 = function (val) {
    // pad to 4 digit with zero
    return KM.pad_out(val, 4);
};


KM.pad_out6 = function (val) {
    // pad to 6 digit with zero
    return KM.pad_out(val, 6);
};


KM.do_nothing = function () {
    // do nothing !
};


/* ****************************************************************************
Button bar - Low level code

Low level button bar code that enables, disables, updates and blinks buttons.
The clever stuff is in the next section :)

There are several 'aliases', these are just to make the code more readable
**************************************************************************** */


KM.enable_display_buttons = function (button) {

    // A function that enables the 12 display configuration buttons and
    // highlights button 'button'
    //
    // expects :
    // 'button' ... the button to be highlighted
    //
    // returns :
    //

    KM.cull_timeout_ids(KM.BUTTON_BAR);
    for (var i = 1; i < 13; i++) {
        if (i === button) {
            document.getElementById('d' + i).src = 'images/r' + i + '.png';
        } else {
            document.getElementById('d' + i).src = 'images/b' + i + '.png';
        }
    }
    KM.menu_bar_buttons.display_sec_enabled = true;
};

KM.update_display_buttons = KM.enable_display_buttons;
    // update the display buttons and highlight button 'button'


KM.disable_display_buttons = function () {

    // A function that disables the 12 display configuration buttons
    //
    // expects :
    //
    // returns :
    //

    for (var i = 1; i < 13; i++) {
        document.getElementById('d' + i).src = 'images/g' + i + '.png';
    }
    KM.menu_bar_buttons.display_sec_enabled = false;
};


KM.enable_camera_buttons = function () {

    // A function that enables the 16 camera buttons
    //
    // expects :
    //
    // returns :
    //

    document.getElementById('camera_func_header').innerHTML = 'Camera Select';
    for (var i = 1; i < max_feed; i++) {
        document.getElementById('ct' + i).innerHTML = i;
        document.getElementById('cb' + i).style.background = 'url(images/temp1.png) no-repeat bottom left';
        if (KM.www_rc.feed_enabled[i]) {
            document.getElementById('ct' + i).style.color = KM.BLUE;
        } else {
            document.getElementById('ct' + i).style.color = KM.GREY;
        }
    }
    KM.menu_bar_buttons.camera_sec_enabled = true;
    KM.menu_bar_buttons.func_sec_enabled = false;
};

KM.update_camera_buttons = KM.enable_camera_buttons;
    // update camera buttons


KM.disable_camera_buttons = function () {

    // A function that disables the 16 camera buttons
    //
    // expects :
    //
    // returns :
    //

    document.getElementById('camera_func_header').innerHTML = 'Camera Select';
    for (var i = 1; i < max_feed; i++) {
        document.getElementById('cb' + i).style.background = 'url(images/temp1.png) no-repeat bottom left';
        document.getElementById('ct' + i).innerHTML = i;
    document.getElementById('ct' + i).style.color = KM.GREY;
    }
    KM.menu_bar_buttons.camera_sec_enabled = false;
    KM.menu_bar_buttons.func_sec_enabled = false;
};


KM.enable_func_buttons = function () {

    // A function that enables the 16 camera function buttons
    //
    // expects :
    //
    // returns :
    //

    document.getElementById('camera_func_header').innerHTML = 'Function Select';
    for (var i = 1; i < max_feed; i++) {
        document.getElementById('ct' + i).innerHTML = 'f' + i;
        document.getElementById('cb' + i).style.background = 'url(images/temp3.png) no-repeat bottom left';
        if (KM.www_rc.func_enabled[i]) {
            document.getElementById('ct' + i).style.color = KM.BLUE;
        } else {
            document.getElementById('ct' + i).style.color = KM.GREY;
        }
    }
    KM.menu_bar_buttons.camera_sec_enabled = false;
    KM.menu_bar_buttons.func_sec_enabled = true;
};

KM.update_func_buttons = KM.enable_func_buttons;
    // update the func buttons and highlight button 'button'

KM.disable_func_buttons = KM.disable_camera_buttons;
    // disable the func buttons


KM.blink_camera_func_button = function (button) {

    // A function that blinks camera button 'button'
    //
    // expects :
    // 'button' ... the button to blink
    //
    // returns :
    //

    if (KM.menu_bar_buttons.camera_sec_enabled) {
        document.getElementById('ct' + button).style.color = KM.RED;
        KM.add_timeout_id(KM.BUTTON_BAR, setTimeout(function () {KM.update_camera_buttons(); }, 250));
    } else {  // if function check function enabled
        if (KM.www_rc.func_enabled[button]) {
            document.getElementById('ct' + button).style.color = KM.RED;
            KM.add_timeout_id(KM.BUTTON_BAR, setTimeout(function () {KM.update_func_buttons(); }, 250));
        }
    }
};


KM.enable_ptz_buttons = function () {

    // A function that intelligently enables the PTZ buttons
    //
    // expects :
    //
    // returns :
    //

    if (KM.menu_bar_buttons.function_selected === 1) {
	KM.menu_bar_buttons.ptz_sec_enabled = false;
	// if full screen
	if (KM.www_rc.ptz_enabled[KM.www_rc.display_cameras[1][1]] && KM.www_rc.display_select === 1) {
	    KM.live.ptz_feed = KM.www_rc.display_cameras[1][1];
	    KM.menu_bar_buttons.ptz_sec_enabled = true;
	} else {
	    // if multi screen but feed selected
	    if (KM.www_rc.ptz_enabled[KM.live.last_camera_select] && KM.live.last_camera_select !== 0) {
		KM.live.ptz_feed = KM.live.last_camera_select;
		KM.menu_bar_buttons.ptz_sec_enabled = true;
	    }
	}
	var ptz_button_display="none";
	for (var i = 1; i < 5; i++) {
	    if (KM.menu_bar_buttons.ptz_sec_enabled) {
		document.getElementById('p' + i).style.color = KM.BLUE;
		ptz_button_display="block";
	    } else {
		document.getElementById('p' + i).style.color = KM.GREY;
	    }
	}
	document.getElementById("ptz_button_display").style.display=ptz_button_display;
    }
};

KM.update_ptz_buttons = KM.enable_ptz_buttons;
    // update ptz buttons


KM.ptz_button_lockdown = function (button) {

    // A function that blinks PTZ button 'button' then disables PTZ buttons
    //
    // expects :
    // 'button' ... the button to blink
    //
    // returns :
    //

    KM.menu_bar_buttons.ptz_sec_enabled = false;
    document.getElementById('p' + button).style.color = KM.RED;
    KM.add_timeout_id(KM.BUTTON_BAR, setTimeout(function () {KM.disable_ptz_buttons(); }, 250));

};


KM.disable_ptz_buttons = function () {

    // A function that disables the PTZ buttons
    //
    // expects :
    //
    // returns :
    //

    for (var i = 1; i < 5; i++) {
        document.getElementById('p' + i).style.color = KM.GREY;
    }
    KM.menu_bar_buttons.ptz_sec_enabled = false;
    document.getElementById("ptz_button_display").style.display="none";
};


KM.enable_function_buttons = function (button) {

    // A function that intelligently enables the 8 function buttons and
    // highlights button 'button'
    //
    // expects :
    // 'button' ... the button to highlight
    //
    // returns :
    //

    var buttons = ['pad', 'pad', 'archive_button_enabled',
    'logs_button_enabled', 'config_button_enabled', 'func_button_enabled',
    'msg_button_enabled', 'panic_button_enabled', 'audible_button_enabled',
    'about_button_enabled',  'logout_button_enabled'];

	var misc_function_display="none";

    for (var i = 1; i < buttons.length; i++) {
        if (KM.www_rc[buttons[i]] || i === 1) {
            if (i === button) {
                if (i === 5) { // special background for the 'func' button
                    document.getElementById('fb5').style.background =
                    'url(images/temp4.png) no-repeat bottom left';
                }
                document.getElementById('ft' + i).style.color = KM.RED;
				document.getElementById('ft' + i).parentNode.style.display="block";
				misc_function_display="block";

	    } else {
		if (i === 5) { // normal background for the 'func' button
		    document.getElementById('fb5').style.background =
		    'url(images/temp2.png) no-repeat bottom left';
		}
		document.getElementById('ft' + i).style.color = KM.BLUE;
		document.getElementById('ft' + i).parentNode.style.display="block";
		misc_function_display="block";
	    }

	} else {
	    document.getElementById('ft' + i).style.color = KM.GREY;
		document.getElementById('ft' + i).parentNode.style.display="none";
	}
    }
	document.getElementById("misc_function_display").style.display=misc_function_display;
};

KM.update_function_buttons = KM.enable_function_buttons;
    // update function buttons and highlight button 'button'


/* ****************************************************************************
Button bar - High level code

High level button bar code. This is the nexus of control for kmotion. The
functions here are called by 'onclick' events in 'index.html'.
**************************************************************************** */


KM.display_button_clicked = function (button) {

    // A function that intelligently processs a display button being clicked
    // and highlights button 'button'
    //
    // expects :
    // 'button' ... the button to highlight
    //
    // returns :
    //

    if (KM.menu_bar_buttons.display_sec_enabled)  {
        KM.update_display_buttons(button);
        KM.www_rc.display_select = button;
        KM.live.last_camera_select = 0;
        KM.update_ptz_buttons();
        if (KM.www_rc.full_screen) {
            KM.display_live_full();
        } else {
            KM.display_live_normal();
        }
    }
};


KM.camera_func_button_clicked = function (button) {

    // A function that intelligently processs a camera / func button being
    // clicked and highlights button 'button'
    //
    // expects :
    // 'button' ... the button to highlight
    //
    // returns :
    //

    if (KM.menu_bar_buttons.camera_sec_enabled || KM.menu_bar_buttons.func_sec_enabled) {
        KM.blink_camera_func_button(button);
        if (KM.menu_bar_buttons.camera_sec_enabled) {
            KM.live.last_camera_select = button;
            KM.update_ptz_buttons();
            if (KM.www_rc.display_select === 1) {
                // if '1' change view directly as a special case
                KM.www_rc.display_cameras[1][1] =  button;
                KM.live.last_camera_select = 0;
                KM.update_ptz_buttons();
                if (KM.www_rc.full_screen) {
                    KM.display_live_full();
                } else {
                    KM.display_live_normal();
                }
            }
        } else {
            KM.exe_script('/cgi_bin/xmlHttp_func.php', button);
        }
    }
};


KM.ptz_button_clicked = function (button) {

    // A function that intelligently processs a PTZ button being clicked
    // and highlights button 'button'
    //
    // expects :
    // 'button' ... the button to highlight
    //
    // returns :
    //

    if (KM.menu_bar_buttons.ptz_sec_enabled) {
        KM.ptz_button_lockdown(button);
        // coded format crf<feed 2 digit>b<button 2 digit>$
        KM.exe_script('/cgi_bin/xmlHttp_ptz.php', 'crf' + KM.pad_out2(KM.live.ptz_feed) + 'b' + KM.pad_out2(button) + '$');
    }
};


KM.function_button_clicked = function (button) {

    // A function that intelligently processs a function button being clicked
    // and highlights button 'button'
    //
    // expects :
    // 'button' ... the button to highlight
    //
    // returns :
    //

    if (KM.function_button_valid(button)) {
        KM.update_function_buttons(button);
        KM.menu_bar_buttons.function_selected = button;

	switch (button) {
	case 1: // 'live button'
		document.onkeydown=null; //stop memory leak
	    KM.enable_display_buttons(KM.www_rc.display_select);
	    KM.enable_camera_buttons();
	    KM.enable_ptz_buttons();
	    if (KM.www_rc.full_screen) {
		KM.display_live_full();
	    } else {
		KM.display_live_normal();
	    }
	    break;

	case 2: // 'archive button'
	    KM.disable_display_buttons();
	    KM.disable_camera_buttons();
	    KM.disable_ptz_buttons();
	    KM.display_archive();
		current_play_accel=4;
	    break;

	case 3: // 'log button'
	    KM.disable_display_buttons();
	    KM.disable_camera_buttons();
	    KM.disable_ptz_buttons();
	    KM.display_logs();
	    break;

	case 4: // 'config button'
	    KM.disable_display_buttons();
	    KM.disable_camera_buttons();
	    KM.disable_ptz_buttons();
	    KM.display_config();
	    break;

	case 5: // 'func button'
	    KM.disable_display_buttons();
	    KM.enable_func_buttons();
	    KM.disable_ptz_buttons();
	    break;

	case 6: // 'msg button'
	    KM.disable_display_buttons();
	    KM.disable_camera_buttons();
	    KM.disable_ptz_buttons();
	    KM.display_msg();
	    break;

	case 7: // 'panic button'
	    KM.disable_display_buttons();
	    KM.disable_camera_buttons();
	    KM.disable_ptz_buttons();
	    KM.display_about();
	    break;


	case 8: // 'Audible button'
	    KM.disable_display_buttons();
	    KM.disable_camera_buttons();
	    KM.disable_ptz_buttons();
	    KM.display_about();
	    break;

	case 9: // 'about button'
	    KM.disable_display_buttons();
	    KM.disable_camera_buttons();
	    KM.disable_ptz_buttons();
	    KM.display_about();
	    break;

	case 10: // 'logout button'
	    KM.disable_display_buttons();
	    KM.disable_camera_buttons();
	    KM.disable_ptz_buttons();
	    KM.logout_button_clicked();
	    break;

	}
    }
};


KM.function_button_valid = function (button) {

    // A function that checks to see if a function button is valid and returns
    // a bool
    //
    // expects :
    // 'button' ... the button to be checked
    //
    // returns :
    // 'bool' ...   button valid
    //

    var buttons = ['pad', 'pad', 'archive_button_enabled',
        'logs_button_enabled', 'config_button_enabled', 'func_button_enabled',
        'msg_button_enabled', 'panic_button_enabled', 'audible_button_enabled',
	'about_button_enabled',  'logout_button_enabled'];
    return (button < 2 || KM.www_rc[buttons[button]]);
};


KM.logout_button_clicked = function () {

    // A function that handles a logout
    //
    // expects :
    //
    // returns :
    //

    if (!window.confirm('Please confirm you wish to Logout')) {

	// coded this way to avoid functions inside block, jslint objected
        KM.enable_select_buttons();
        KM.update_function_buttons(1);
	return;
    }

    KM.session_id.current++;
    document.getElementById('whole_display').innerHTML = '' +

    '<div id="info_high_line">' +
	'<div id="info_text">' +
	    '<span class="italic">kmotion</span> logout<br>' +
	    '<span id="info_small_text">For security reasons please shut down your browser now.</span>' +
	'</div>' +
    '</div>';

    var dom = document.getElementById('info_small_text');
    var level = 193;

    function step_lighter() {
	// get lighter
	var hex = level.toString(16);
	dom.style.color = '#' + hex + hex + hex;
	level += 2;
	if (level < 255) {
	    setTimeout(step_lighter, 20);
	} else {
	    step_darker();
	}
    }

    function step_darker() {
	// get darker
	var hex = level.toString(16);
	dom.style.color = '#' + hex + hex + hex;
	level -= 2;
	if (level > 193) {
	    setTimeout(step_darker, 20);
	} else {
	    setTimeout(step_lighter, 400);
	}
    }
    setTimeout(step_lighter, 2000);
};


KM.background_button_clicked = function (color) {

    // A function that changes the background color to 'color'
    //
    // expects :
    // 'color' ... the color to be changed to
    //
    // returns :
    //
    var theme='css/dark.css';
    switch (color) {
        case 1:
    	    theme='css/light.css';
        break;
    }

    var cssId = 'themecss';
    if (document.getElementById(cssId))
        (elem=document.getElementById(cssId)).parentNode.removeChild(elem);
    var head  = document.getElementsByTagName('head')[0];
    var link  = document.createElement('link');
    link.id   = cssId;
    link.rel  = 'stylesheet';
    link.type = 'text/css';
    link.href = theme;
    link.media = 'all';
    head.appendChild(link);

    KM.www_rc.color_select = color;
};


/* ****************************************************************************
Live display - Misc code

Miscellaneous code that provides general closures and functions for kmotions
live display
**************************************************************************** */


KM.update_feeds = function () {

    // A function that get the latest jpeg filenames and event status from
    // the server with an 'xmlHttp' call then splits the returned data and
    // stores it in 'KM.server.latest_jpegs' and 'KM.server.latest_events'.
    //
    // expects :
    //
    // returns :
    //

    var xmlHttp = KM.get_xmlHttp_obj();

    xmlHttp.onreadystatechange = function () {
	if (xmlHttp.readyState === 4) {
	    xmlHttp.onreadystatechange = null; // plug memory leak
	    // split the data
	    var dblob = xmlHttp.responseText.trim();
	    // array of latest jpeg filenames: index 1 - 16
	    //KM.server.latest_jpegs = dblob.split("#");
		var latest_jpegs_tmp=dblob.split("#");
		for (var j=0;j<latest_jpegs_tmp.length-2;j++) {
			KM.server.latest_jpegs[latest_jpegs_tmp[j].split('=')[0]]=latest_jpegs_tmp[j].split('=')[1];
		}

	    // *NOTE* index 17 holds the 'servo_state' and index 18
	    // holds the 'latest_events', just ignore them !

	    KM.server.servo_state = latest_jpegs_tmp[latest_jpegs_tmp.length-2];
	    // array of latest events: index 0 - length
	    if (latest_jpegs_tmp[latest_jpegs_tmp.length-1] !== undefined) {
		var tmp = latest_jpegs_tmp[latest_jpegs_tmp.length-1].split("$");
		tmp.sort();
		KM.server.latest_events = tmp;
	    }
	}
    };
	var cams='';

	/*for (var c=1;c<KM.www_rc.feed_enabled.length;c++) {
		if (KM.www_rc.feed_enabled[c]) {
			cams+=c+',';
		}
	}*/
	var num_feeds = Math.min(KM.www_rc.display_cameras[KM.www_rc.display_select].length, max_feed);
	for (var c=1;c<num_feeds;c++) {
		if (KM.www_rc.feed_enabled[KM.www_rc.display_cameras[KM.www_rc.display_select][c]]) {
			cams+=KM.www_rc.display_cameras[KM.www_rc.display_select][c]+',';
		}
	}
	cams=cams.slice(0,-1);


    xmlHttp.open('GET', '/cgi_bin/xmlHttp_feeds.php' + '?cams='+cams+'&rdd='+encodeURIComponent(ramdisk_dir)+'&rnd=' + new Date().getTime(), true);
    xmlHttp.send(null);
};


KM.feed_cache = function (feed) {

    // A closure that downloads and stores jpegs in a feeds cache. It exports
    // various 'methods', These 'methods' provide different ways of accessing
    // and refreshing the feeds cache.

    // 'SAME' and 'NOT_SAME' reflect the status of the returned 'jpeg' ie if it
    // is the same as the last returned jpeg or not.

    var SAME = true;
    var NOT_SAME = false;

    var cache_jpeg = [];
    var cache_count = 0;

    var prev_now = 0;

    var last_jpeg = '';
    var latest_jpeg = '';
    var latest_jpeg_time = 0;
    var jpeg_load_time = 0;
    var latest_servo_state = 0;

    for (var i = 0; i < 5; i++) {
        cache_jpeg[i] = new Image();
    }
    return {

	get_jpeg: function (callback, session_id) {

	    // A function that always downloads the latest feeds jpeg as defined
	    // in 'KM.server.latest_jpegs' for this instance, when downloaded it
	    // calls the callback object and passes status information.
	    //
	    // expects :
	    // 'callback'    ... the callback object
	    // 'session_id'  ... the 'session_id'
	    //
	    // returns :
	    // 'latest_jpeg' ... jpeg name or 'null' if none avaliable
	    // 'feed'        ... the feed number for this instance
	    // 'same'        ... bool if same as late jpeg
	    // 'session_id'  ... the 'session_id'
	    //

	    KM.cull_timeout_ids(KM.FEED_CACHE);
	    cache_count++; // caching jpegs as a browser workaround
	    cache_count = (cache_count > 4)?0:cache_count;
	    latest_jpeg = KM.server.latest_jpegs[feed];

	    // null jpeg
	    if (latest_jpeg === '' || latest_jpeg === undefined) {
		KM.update_feeds();
		KM.add_timeout_id(KM.FEED_CACHE, setTimeout(function () {callback('null', feed, NOT_SAME, session_id); }, 1));
		return;
	    }

	    // same as last jpeg
	    if (last_jpeg === latest_jpeg) {
		KM.update_feeds();
		KM.add_timeout_id(KM.FEED_CACHE, setTimeout(function () {callback(latest_jpeg, feed, SAME, session_id); }, 500));
		return;
	    }
	    last_jpeg = latest_jpeg;

	    cache_jpeg[cache_count].onerror = function () {
		KM.add_timeout_id(KM.FEED_CACHE, setTimeout(function () {callback('null', feed, NOT_SAME, session_id); }, 1));
	    };

	    cache_jpeg[cache_count].onload = function () {
		KM.kill_timeout_ids(KM.FEED_CACHE);
		var now = new Date();
		latest_jpeg_time = now.getTime();

		var delay = 0;
		if (latest_servo_state !== KM.server.servo_state) {
		    delay = KM.www_rc.ptz_servo_settle[feed] * 1000 + 1;
		    // re-enable the live mode ptz buttons
		    KM.add_timeout_id(KM.BUTTON_BAR, setTimeout(function () {KM.enable_ptz_buttons(); }, delay));
		    // re-enable the ptz config ptz buttons
		    KM.add_timeout_id(KM.BUTTON_BAR, setTimeout(function () {KM.conf_ptz_ungrey_LUDR(); }, delay));
		    latest_servo_state = KM.server.servo_state;
		}

		delay = 500;
		now = new Date().getTime();
		delay = Math.max(delay - (now - prev_now), 1);
		prev_now = now;
		/*/if (KM.www_rc.low_cpu) {
		    now = new Date().getTime();
		    var target_ms = (KM.browser.browser_SP)?(1000):(1000);
		    delay = Math.max(target_ms - (now - prev_now), 1);
		    prev_now = now;
		}
		*/
		KM.add_timeout_id(KM.FEED_CACHE, setTimeout(function () {callback(latest_jpeg, feed, NOT_SAME, session_id); }, delay));
	    };
	    KM.update_feeds();		
	    cache_jpeg[cache_count].src = latest_jpeg;
	},

	check_jpeg_20sec_cache: function () {

	    // A function that checks the cache for this instance. If the cache
	    // is less than 20 secs old returns the cached jpeg filename.
	    // This function does __NOT__ attempt to download a new jpeg and so
	    // is guaranteed to return immediately.
	    //
	    // expects :
	    //
	    // returns :
	    // 'latest_jpeg' ... jpeg name or 'null' if none avaliable
	    //

	    var now = new Date();
	    var diff = now.getTime() - latest_jpeg_time;
	    if (diff < 20 * 1000 && latest_jpeg !== '' && latest_jpeg !== undefined) {
		return latest_jpeg;
	    } else {
		return 'null';
	    }
	}
    };
};


KM.feed_cache_setup = function () {

    // A function that sets a list of 16 'feed_cache' 'instances', one for each
    // feed
    //
    // expects :
    //
    // returns :
    //

    for (var feed = 1; feed < max_feed; feed++) {
        KM.server.feed_caches[feed] = KM.feed_cache(feed);
    }
};

KM.get_jpeg = function (feed, callback, session_id) {
    // function 'get_jpeg'
	KM.server.feed_caches[feed].get_jpeg(callback, session_id);
};

KM.check_jpeg_20sec_cache = function (feed) {
    // function 'check_jpeg_20sec_cache'
	return KM.server.feed_caches[feed].check_jpeg_20sec_cache();
};


KM.init_display_grid = function (display_select) {

    // a closure that calculates and generates the HTML for a display grid of
    // 'display_select' assigning consecutive jpeg and text id's and updates
    // 'main_display' HTML.

    var PADDING = 3;  // padding between camera displays

    var left_margin =  0;
    var top_margin =   0;
    var total_width =  0;
    var total_height = 0;

    var html = '';
    var html_count = 0;

    clear_html();
    construct_grid_html(display_select);
    set_html();


    function clear_html() {
        // reset the constructed html string and counter
        html = '';
        html_count = 0;
    }


    function set_html() {
        // set the constructed html string
        document.getElementById('main_display').innerHTML = html;
    }


    function construct_cell_html(display_num, left, top, width, height, alt_jpeg,
    text_left, text_top) {

	// A function that constructs the HTML for one cell given a list of
	// parameters and sequentialy tags it as 'image_#' with an associated
	// 'text_#
	//
	// expects :
	// 'display_num' ... the cell number
	// 'left'        ... cells left px
	// 'right'       ... cells right px
	// 'width'       ... cells width px
	// 'height'      ... cells height px
	// 'alt_jpeg'    ... bool, use alt jpegs in P in P mode
	// 'text_left'   ... offset left for text
	// 'text_top'    ... offset top for text
	//
	// returns :
	//

        html_count++;

	var gcam_jpeg = 'images/gcam.png';
	var bcam_jpeg = 'images/bcam.png';
	if (alt_jpeg === true) {
	    gcam_jpeg = 'images/gcam_alt.png';
	    bcam_jpeg = 'images/bcam_alt.png';
	}
	if (typeof text_left  === 'undefined') {
	    text_left = 10;
	}
	if (typeof text_top === 'undefined') {
	    text_top = 10;
	}

	var jpeg = gcam_jpeg;
	var text = 'No Video';
	var text_color = KM.WHITE;
	var feed = KM.www_rc.display_cameras[display_num][html_count];

	if (KM.www_rc.feed_enabled[feed]) {
	    jpeg = bcam_jpeg;
	    // code to use cached images if available. This code gives the illusion
	    // of speed set against a slight breakdown in modularity.
	    var cached_jpeg = KM.check_jpeg_20sec_cache(feed);

	    if (cached_jpeg !== 'null') {
		jpeg = cached_jpeg;
	    }
	    text_color = KM.BLUE;
	    // color the text, illusion of speed :)
	    if (KM.item_in_array(feed, KM.server.latest_events)) {
		text_color = KM.RED;
	    }
	    text = KM.www_rc.feed_name[feed];
	}
	text = feed + ' : ' + text;

	if (html_count>max_feed-1) return;
	var l1 = '<img id="image_' + html_count + '" ';
	var l2 = 'style="position:absolute; ';
	var l3 = 'left:' + left + 'px; ';
	var l4 = 'top:' + top + 'px; ';
	var l5 = 'width:' + width + 'px; ';
	var l6 = 'height:' + height + 'px;" ';
	var l7 = 'src="' + jpeg + '"; ';
	var l8 = 'onClick="KM.camera_jpeg_clicked(' + html_count + ')"; ';
	var l9 = 'alt="">';
	html = html + l1 + l2 + l3 + l4 + l5 + l6 + l7 + l8 + l9;

	var l10 = '<span id="text_' + html_count + '"; ';
	var l11 = 'style="position:absolute; ';
	var l12 = 'left:' + (left + text_left) + 'px; ';
	var l13 = 'top:' +  (top + text_top) + 'px;';
	var l14 = 'font-weight: bold;';
	var l15 = 'color:' + text_color  + ';';
	var l16 = '">' + text + '</span>';
	html = html + l10 + l11 + l12 + l13 + l14 + l15 + l16;
    }


    function set_display_area() {

	// A function that calculates and sets the top and left margins plus
	// the width and height of the display area while keeping to a 1.33
	// aspect ratio and PADDING * 2 for outer borders
	//
	// expects :
	//
	// returns :
	//

    var scaled_width = KM.browser.main_display_width - PADDING * 2;
    var scaled_height = KM.browser.main_display_height - PADDING * 2;

	// calculate the scaled size keeping aspect ratio 384 / 288 = 1.33
	var scale=KM.browser.main_display_width / KM.browser.main_display_height;
	if (scale > 2) {
		scale=2;
	} else if (scale < 1) {
		scale=1;
	}

	if ((scaled_width / scaled_height) < scale) {
	    scaled_height = scaled_width / scale;
	} else {
	    scaled_width = scaled_height * scale;
	}
	left_margin = ((KM.browser.main_display_width - scaled_width) / 2);
	top_margin = PADDING;
	total_width = scaled_width;
	total_height = scaled_height;
    }


    function construct_grid_html(display_select) {

	// A function that constructs the HTML for all cells for a given
	// 'display_select' and updates 'main_display' HTML.
	//
	// expects :
        // 'display_select' ... where
        // 1 ... symetrical    1 grid
        // 2 ... symetrical    4 grid
        // 3 ... symetrical    9 grid
        // 4 ... symetrical   16 grid
        // 5 ... asymmetrical  6 grid
        // 6 ... asymmetrical 13 grid
        // 7 ... asymmetrical  8 grid
        // 8 ... asymmetrical 10 grid
        // 9 ... P in P        2 grid
        // 10... P in P        2 grid
        // 11... P in P        2 grid
        // 12... P in P        2 grid
	//
	// returns :
	//

    set_display_area();

    var row, col, rows, cols, inner_jpeg_width, inner_jpeg_height,
    jpeg_width, jpeg_height;

    switch (display_select) {
	case 1:  // symetrical 1 grid
	    rows = 1;
	    cols = 1;

	    jpeg_width = (total_width - (PADDING * (cols - 1))) / cols;
	    jpeg_height = (total_height - (PADDING * (rows - 1))) / rows;
	    for (row = 0; row < rows; row++) {
		for (col = 0; col < cols; col++) {
		    construct_cell_html(display_select,
		    left_margin + (col * (jpeg_width + PADDING)),
		    top_margin + (row * (jpeg_height + PADDING)),
		    jpeg_width, jpeg_height);
		}
	    }
	    break;

	case 2:  // symetrical 4 grid
	    rows = 2;
	    cols = 2;

	    jpeg_width = (total_width - (PADDING * (cols - 1))) / cols;
	    jpeg_height = (total_height - (PADDING * (rows - 1))) / rows;

	    for (row = 0; row < rows; row++) {
		for (col = 0; col < cols; col++) {
		    construct_cell_html(display_select,
		    left_margin + (col * (jpeg_width + PADDING)),
		    top_margin + (row * (jpeg_height + PADDING)),
		    jpeg_width, jpeg_height);
		}
	    }
	    break;

	case 3:  // symetrical 9 grid
	    rows = 3;
	    cols = 3;

	    jpeg_width = (total_width - (PADDING * (cols - 1))) / cols;
	    jpeg_height = (total_height - (PADDING * (rows - 1))) / rows;

	    for (row = 0; row < rows; row++) {
		for (col = 0; col < cols; col++) {
		    construct_cell_html(display_select,
		    left_margin + (col * (jpeg_width + PADDING)),
		    top_margin + (row * (jpeg_height + PADDING)),
		    jpeg_width, jpeg_height);
		}
	    }
	    break;

	case 4:  // symetrical 16 grid

	    cols = Math.ceil(Math.sqrt(max_feed-1));//5;//
		rows = Math.ceil((max_feed-1)/cols);//Math.ceil(Math.sqrt(max_feed-1));
		//console.log(cols);
		//console.log(rows);

	    jpeg_width = (total_width - (PADDING * (cols - 1))) / cols;
	    jpeg_height = (total_height - (PADDING * (rows - 1))) / rows;

	    for (row = 0; row < rows; row++) {
		for (col = 0; col < cols; col++) {
		    construct_cell_html(display_select,
		    left_margin + (col * (jpeg_width + PADDING)),
		    top_margin + (row * (jpeg_height + PADDING)),
		    jpeg_width, jpeg_height);
		}
	    }
	    break;

	case 5:  // asymmetrical 6 grid
	    rows = [0, 1, 2, 2, 2];
	    cols = [2, 2, 0, 1, 2];

	    jpeg_width = (total_width - (PADDING * 2)) / 3;
	    jpeg_height = (total_height - (PADDING * 2)) / 3;

	    construct_cell_html(display_select, left_margin, top_margin,
	    (jpeg_width * 2) + PADDING, (jpeg_height * 2) + PADDING);

	    for (var i = 0; i < 5; i++) {
		row = rows[i];
		col = cols[i];
		construct_cell_html(display_select,
		left_margin + (col * (jpeg_width + PADDING)),
		top_margin + (row * (jpeg_height + PADDING)),
		jpeg_width, jpeg_height);
	    }
	    break;

	case 6:  // asymmetrical 13 grid
	    rows = [0, 0, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3];
	    cols = [2, 3, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3];

	    jpeg_width = (total_width - (PADDING * 3)) / 4;
	    jpeg_height = (total_height - (PADDING * 3)) / 4;

	    construct_cell_html(display_select, left_margin, top_margin,
	    (jpeg_width * 2) + PADDING, (jpeg_height * 2) + PADDING);

	    for (i = 0; i < 12; i++) {
		row = rows[i];
		col = cols[i];
		construct_cell_html(display_select,
		left_margin + (col * (jpeg_width + PADDING)),
		top_margin + (row * (jpeg_height + PADDING)),
		jpeg_width, jpeg_height);
	    }
	    break;

	case 7:  // asymmetrical 8 grid
	    rows = [0, 1, 2, 3, 3, 3, 3];
	    cols = [3, 3, 3, 0, 1, 2, 3];

	    jpeg_width = (total_width - (PADDING * 3)) / 4;
	    jpeg_height = (total_height - (PADDING * 3)) / 4;

	    construct_cell_html(display_select, left_margin, top_margin,
	    (jpeg_width * 3) + (PADDING * 2), (jpeg_height * 3) + (PADDING * 2));

	    for (i = 0; i < 7; i++) {
		row = rows[i];
		col = cols[i];
		construct_cell_html(display_select,
		left_margin + (col * (jpeg_width + PADDING)),
		top_margin + (row * (jpeg_height + PADDING)),
		jpeg_width, jpeg_height);
	    }
	    break;

	case 8:  // asymmetrical 10 grid
	    rows = [0, 0, 1, 1, 2, 2, 3, 3];
	    cols = [2, 3, 2, 3, 0, 1, 0, 1];

	    jpeg_width = (total_width - (PADDING * 3)) / 4;
	    jpeg_height = (total_height - (PADDING * 3)) / 4;

	    construct_cell_html(display_select, left_margin, top_margin,
	    (jpeg_width * 2) + PADDING, (jpeg_height * 2) + PADDING);

	    for (i = 0; i < 8; i++) {
		row = rows[i];
		col = cols[i];
		construct_cell_html(display_select,
		left_margin + (col * (jpeg_width + PADDING)),
		top_margin + (row * (jpeg_height + PADDING)),
		jpeg_width, jpeg_height);
	    }

	    construct_cell_html(display_select,
	    left_margin + (jpeg_width * 2) + (PADDING * 2),
	    top_margin + (jpeg_height * 2) + (PADDING * 2),
	    (jpeg_width * 2) + PADDING, (jpeg_height * 2) + PADDING);
	    break;

	case 9:  // P in P 2 grid
	    jpeg_width = total_width;
	    jpeg_height = total_height;

	    inner_jpeg_width = jpeg_width * 0.28;
	    inner_jpeg_height = jpeg_height * 0.28;

	    construct_cell_html(display_select, left_margin, top_margin,
	    jpeg_width, jpeg_height, false,
	    (jpeg_width * 0.02) + inner_jpeg_width + 10,
	    (jpeg_height * 0.02) + 10);

	    construct_cell_html(display_select,
	    left_margin + (jpeg_width * 0.02),
	    top_margin + (jpeg_height * 0.02),
	    inner_jpeg_width, inner_jpeg_height, true);
	    break;

	case 10:  // P in P 2 grid
	    jpeg_width = total_width;
	    jpeg_height = total_height;

	    inner_jpeg_width = jpeg_width * 0.28;
	    inner_jpeg_height = jpeg_height * 0.28;

	    construct_cell_html(display_select, left_margin, top_margin,
	    jpeg_width, jpeg_height, false,
	    (jpeg_width * 0.02) + 10,
	    (jpeg_height * 0.02) + 10);

	    construct_cell_html(display_select,
	    left_margin + jpeg_width - inner_jpeg_width - (jpeg_width * 0.02),
	    top_margin + (jpeg_height * 0.02),
	    inner_jpeg_width, inner_jpeg_height, true);
	    break;

	case 11:  // P in P 2 grid
	    jpeg_width = total_width;
	    jpeg_height = total_height;

	    inner_jpeg_width = jpeg_width * 0.28;
	    inner_jpeg_height = jpeg_height * 0.28;

	    construct_cell_html(display_select, left_margin, top_margin,
	    jpeg_width, jpeg_height, false,
	    (jpeg_width * 0.02) + 10,
	    (jpeg_height * 0.02) + 10);

	    construct_cell_html(display_select,
	    left_margin + (jpeg_width * 0.02),
	    top_margin + jpeg_height - inner_jpeg_height - (jpeg_height * 0.02),
	    inner_jpeg_width, inner_jpeg_height, true);
	    break;

	case 12:  // P in P 2 grid
	    jpeg_width = total_width;
	    jpeg_height = total_height;

	    inner_jpeg_width = jpeg_width * 0.28;
	    inner_jpeg_height = jpeg_height * 0.28;

	    construct_cell_html(display_select, left_margin, top_margin,
	    jpeg_width, jpeg_height, false,
	    (jpeg_width * 0.02) + 10,
	    (jpeg_height * 0.02) + 10);

	    construct_cell_html(display_select,
	    left_margin + jpeg_width - inner_jpeg_width - (jpeg_width * 0.02),
	    top_margin + jpeg_height - inner_jpeg_height - (jpeg_height * 0.02),
	    inner_jpeg_width, inner_jpeg_height, true);
	    break;
	}
    }
};


KM.initial_display_refresh = function (callback, session_id) {

    // A closure that initialises the display, loading feed jpegs that are not
    // avaliable from the cache. Any jpegs that are avaliable from the cache
    // will already be displayed by the 'KM.init_display_grid' code. This
    // breaks modularity but increases speed :) When finished it calls the
    // callback object.
    //
    // expects:
    // 'callback'   ... the callback object
    // 'session_id' ... the current session id
    //
    // returns:
    //

    var refreshed = []; // feeds refreshed, to stop duplicate refreshes
    var num_feeds = Math.min(KM.www_rc.display_cameras[KM.www_rc.display_select].length, max_feed);
    var camera_ptr = 0;
    KM.update_feeds();

    // scans the 20sec cache and updates 'refreshed'
    var feed, jpeg;
    for (var i = 1; i < num_feeds; i++) {
	feed = KM.www_rc.display_cameras[KM.www_rc.display_select][i];
	jpeg = KM.check_jpeg_20sec_cache(feed);

	if (KM.www_rc.feed_enabled[feed] && jpeg !== 'null') {
	    refreshed[refreshed.length] = feed;
	}
    }
    KM.add_timeout_id(KM.DISPLAY_LOOP, setTimeout(function () {load_rest(); }, 1));


    function load_rest() {

	// A function that loads all feed jpegs not in 'refreshed' - its a
	// coding dance :)
	//
	// expects:
	//
	// returns:
	//

        camera_ptr++;
        if (camera_ptr < num_feeds) {
            var feed = KM.www_rc.display_cameras[KM.www_rc.display_select][camera_ptr];
            if (KM.www_rc.feed_enabled[feed] && !KM.item_in_array(feed, refreshed)) {
                KM.add_timeout_id(KM.DISPLAY_LOOP, setTimeout(function () {KM.get_jpeg(feed, load_rest_callback, session_id); }, 1));
                return;
            }
            KM.add_timeout_id(KM.DISPLAY_LOOP, setTimeout(function () {load_rest(); }, 1));
            return;
        }
        KM.add_timeout_id(KM.DISPLAY_LOOP, setTimeout(function () {callback(session_id); }, 1));
    }


    function load_rest_callback(jpeg, feed, same, session_id) {

	// A function that is called by 'get_jpeg' when jpeg avaliable
	//
	// expects:
	//
	// returns:
	//

        // called by 'get_jpeg' when jpeg avaliable
        if (session_id !== KM.session_id.current) return;
	//KM.update_feeds();
        if (jpeg !== 'null') { // ignore the 'same' variable
			try {
				document.getElementById('image_' + camera_ptr).src = jpeg;
			} catch (e) {}
        } 
        KM.text_refresh();
        KM.add_timeout_id(KM.DISPLAY_LOOP, setTimeout(function () {load_rest(); }, 1));
    }
};


KM.text_refresh = function () {

    // A function that refresh the display text colors, 'white' for feed
    // disabled, 'blue' for no motion 'red' for motion.
    //
    // expects :
    //
    // returns :
    //

    var num_feeds = Math.min(KM.www_rc.display_cameras[KM.www_rc.display_select].length, max_feed);
    var feed, text_color;
    for (var i = 1; i < num_feeds; i++) {
        text_color = KM.WHITE;
        feed = KM.www_rc.display_cameras[KM.www_rc.display_select][i];
        if (KM.www_rc.feed_enabled[feed]) {
            text_color = KM.BLUE;
            if (KM.item_in_array(feed, KM.server.latest_events)) {
                text_color = KM.RED;
            }
        }
        if (document.getElementById("text_" + i))
    	    document.getElementById("text_" + i).style.color = text_color;
    }
};


KM.camera_jpeg_clicked = function (camera) {

    // A function that intelligently porcesses a click on camera jpeg 'camera'
    // If camera button has previously been selected change camera jpeg feed
    // else change to full screen mode showing clicked camera jpeg feed.
    //
    // expects :
    // 'camera' ... the clicked camera
    //
    // returns :
    //

    if (KM.live.last_camera_select !== 0) {
		var camera_last_pos=KM.www_rc.display_cameras[KM.www_rc.display_select].indexOf(KM.live.last_camera_select);
		var camera_old=KM.www_rc.display_cameras[KM.www_rc.display_select][camera];
		if (KM.www_rc.feed_enabled[KM.live.last_camera_select]) {
		    KM.www_rc.display_cameras[KM.www_rc.display_select][camera]=KM.live.last_camera_select;
		    if (camera_last_pos>0) {
			KM.www_rc.display_cameras[KM.www_rc.display_select][camera_last_pos]=camera_old;
		    }
		}
        KM.live.last_camera_select = 0;
    } else {
        KM.www_rc.display_cameras[1][1] =
        KM.www_rc.display_cameras[KM.www_rc.display_select][camera];
        KM.www_rc.display_select = 1;
        KM.update_display_buttons(1);
        KM.update_ptz_buttons();
    }
    if (KM.www_rc.full_screen) {
        KM.display_live_full();
    } else {
        KM.display_live_normal();
    }
};


/* ****************************************************************************
Live display - Live code

Code to constantly refreshes the display grid loading feed jpegs and displaying
them.
**************************************************************************** */


KM.display_live_normal = function () {

    // A closure that constantly refreshes the display grid loading feed jpegs
    // and displaying them. If selected interleave feed jpeg refreshes. If
    // selected enable low bandwidth mode.
    //
    // expects:
    //
    // returns:
    //

    // setup for grid display
    KM.session_id.current++;
    KM.set_main_display_size(); // in case user has 'zoomed' browser view
    KM.init_display_grid(KM.www_rc.display_select);

    // exit if no feeds enabled, else 100% CPU useage
    var no_feeds = true;
	var num_feeds = Math.min(KM.www_rc.display_cameras[KM.www_rc.display_select].length, max_feed);
    for (var i = 1; i < num_feeds; i++) {
        if (KM.www_rc.feed_enabled[KM.www_rc.display_cameras[KM.www_rc.display_select][i]]) no_feeds = false;
    }
    if (no_feeds) return; // no feeds

    // quickly populate the grid with fresh or cached images
    var callback = display_live_normal2;
    KM.initial_display_refresh(callback, KM.session_id.current);


    function display_live_normal2(session_id) {

	// A function that resets the closure variables
	//
	// expects:
	// 'session_id' ... the current session id
	//
	// returns:
	//

	var num_feeds = Math.min(KM.www_rc.display_cameras[KM.www_rc.display_select].length, max_feed);
	var now = new Date();
	var bw_start_time = now.getTime();
	var delay;

	var events = [];         // a snapshot of the motion events list
	var events_ptr = 1;      // a pointer into 'events', starts at 1 due to
				 // javascrips split crazyness

	var refreshed = [];      // feeds refreshed, to stop duplicate refreshes
	var camera_ptr = 0;      // a pointer into the camera list
	var display_loop = true; // a 'toggle' between display loop and interleave loop

	var jpegs = ['', '', '', '', ''];
	var jpeg_ptr = 0;        // jpeg name caching else browser gets confused!
	refresh();


	function refresh() {

	    // A function that performs the main refresh loop, complex by
	    // necessity
	    //
	    // expects:
	    //
	    // returns:
	    //

	    // refresh the grid display
	    while (session_id === KM.session_id.current) {
		KM.kill_timeout_ids(KM.DISPLAY_LOOP); // free up memory from 'setTimeout' calls
		if (display_loop || !KM.www_rc.interleave) {

		    // display loop
		    if (KM.www_rc.low_bandwidth) { // low bandwidth code, refresh display
			now = new Date();          // every 15 mins only
			if (now.getTime() - bw_start_time < 15 * 60 * 1000) {
			    KM.text_refresh();
			    display_loop = false;
				delay = 1000;
				if (KM.server.latest_events.length > 1) delay = 1;
				KM.add_timeout_id(KM.DISPLAY_LOOP, setTimeout(function () {refresh(); }, delay));
			    return;
			}
		    }

		    camera_ptr++;
		    if (camera_ptr < num_feeds) {
			var feed = KM.www_rc.display_cameras[KM.www_rc.display_select][camera_ptr];

			// check that the feed is enabled, its not in the events array
			// since interleave takes care of it and check it has not
			// already been 'refreshed' to trap multiple views of same feed.
			// These are taken care of by 'refresh_callback'.
			if (KM.www_rc.feed_enabled[feed] &&
			(!KM.item_in_array(feed, events) || !KM.www_rc.interleave) &&
			!KM.item_in_array(feed, refreshed)) {
			    display_loop = false;
			    refreshed[refreshed.length] = feed;
			    KM.add_timeout_id(KM.DISPLAY_LOOP, setTimeout(function () {KM.get_jpeg(feed, refresh_callback, session_id); }, 1));
			    return;
			}

			// if invalid, flip to interleave loop
			display_loop = false;
			continue;
		    }

		    // end of display 'run', reset
		    camera_ptr = 0;
		    refreshed.length = 0; // zero the 'refreshed' array
		    now = new Date();     // reset 'clock' for low bandwidth option
		    bw_start_time = now.getTime();
		    continue;

		} else {

		    // interleave loop
		    if (events_ptr < events.length) {
			var feed = events[events_ptr];
			events_ptr++;

			// if 'feed' is not in 'display', skip getting the jpeg
			if (KM.item_in_array(feed, KM.www_rc.display_cameras[KM.www_rc.display_select])) {
			    KM.add_timeout_id(KM.DISPLAY_LOOP, setTimeout(function () {KM.get_jpeg(feed, refresh_callback, session_id); }, 1));
			    return;
			} else {
			    continue;
			}
		    }

		// end of event 'run', reset
		events = KM.server.latest_events;
		events_ptr = 1;
		display_loop = true;
		continue;
		}
	    }
	}


	function refresh_callback(jpeg, feed, same, session_id) {

	    // A function that is called by 'get_jpeg' when jpeg avaliable
	    //
	    // expects:
	    // 'jpeg'       ... the jpeg name
	    // 'feed'       ... the feed number
	    // 'same'       ... bool if same as last jpeg
	    // 'session_id' ... the session id
	    //
	    // returns:
	    //

	    if (session_id !== KM.session_id.current) return;

	    if (jpeg === 'null') {
		KM.add_timeout_id(KM.DISPLAY_LOOP, setTimeout(function () {refresh(); }, 1));
		return;
	    }

	    if (same) {
		KM.add_timeout_id(KM.DISPLAY_LOOP, setTimeout(function () {refresh(); }, 1));
		return;
	    }

	    jpeg_ptr++;
	    jpeg_ptr = (jpeg_ptr > 4)?0:jpeg_ptr;
	    jpegs[jpeg_ptr] = jpeg;

	    // check for multiple views of same feed, if found refresh them all
	    for (var i = 1; i < num_feeds; i++) {
		if (KM.www_rc.display_cameras[KM.www_rc.display_select][i] === feed) {
			try {
				document.getElementById('image_' + i).src = jpegs[jpeg_ptr];
			} catch (e) {}
		}
	    }

	    KM.text_refresh();
	    KM.add_timeout_id(KM.DISPLAY_LOOP, setTimeout(function () {refresh(); }, 1));
	}
    }
};


/* ****************************************************************************
Live display - Live code (full screen on motion)

Code to constantly refreshes the display grid loading feed jpegs and displaying
them. If motion is detected goto full screen mode.
**************************************************************************** */


KM.display_live_full = function () {

    // A closure that constantly refreshes the display grid loading feed jpegs
    // and displaying them. If motion is detected goto full screen mode. If
    // selected enable low bandwidth mode.
    //
    // Going full screen in the middle of updateing the grid is messy and a bit
    // of a hack. If it wasn't such a nice feature I would drop support for it.
    //
    // expects:
    //
    // returns:
    //

    // always start with grid display
    KM.set_main_display_size(); // in case user has 'zoomed' browser view
    KM.session_id.current++;
    KM.init_display_grid(KM.www_rc.display_select);

    // exit if no feeds enabled, else 100% CPU useage
    var no_feeds = true;
	var num_feeds = Math.min(KM.www_rc.display_cameras[KM.www_rc.display_select].length, max_feed);
    for (var i = 1; i < num_feeds; i++) {
        if (KM.www_rc.feed_enabled[KM.www_rc.display_cameras[KM.www_rc.display_select][i]]) no_feeds = false;
    }
    if (no_feeds) return; // no feeds

    // quickly populate the grid with fresh or cached images
    var callback = display_live_full2;
    KM.initial_display_refresh(callback, KM.session_id.current);


    function display_live_full2(session_id) {

	// A function that resets the closure variables
	//
	// expects:
	// 'session_id' ... the current session id
	//
	// returns:
	//

	var num_feeds = Math.min(KM.www_rc.display_cameras[KM.www_rc.display_select].length, max_feed);
	var now = new Date();
	var bw_start_time = now.getTime();
	var full_start_time = 0;

	var events = [];         // a snapshot of the motion events list
	var events_ptr = 0;      // a pointer into 'events'

	var session_id_normal = session_id;
	var session_id_full = 0;

	var refreshed = [];      // feeds refreshed, to stop duplicate refreshes
	var camera_ptr = 0;      // a pointer into the camera list

	var jpegs = ['', '', '', '', ''];
	var jpeg_ptr = 0;        // jpeg name caching else browser gets confused!
	refresh_normal();


	function init_normal() {

	    // A function that init's the 'normal' grid
	    //
	    // expects:
	    //
	    // returns:
	    //

	    // init back into normal grid mode from full screen
	    KM.session_id.current++;
	    session_id_normal = KM.session_id.current;

	    KM.enable_display_buttons(KM.www_rc.display_select);
	    KM.enable_camera_buttons();

	    KM.init_display_grid(KM.www_rc.display_select);
	    var callback = refresh_normal;
	    KM.initial_display_refresh(callback, KM.session_id.current);
	}


	function refresh_normal() {

	    // A function that performs the main 'normal' refresh loop, complex
	    // by necessity
	    //
	    // expects:
	    //
	    // returns:
	    //

	    // refresh the grid display
	    if (session_id_normal !== KM.session_id.current) return;

	    KM.kill_timeout_ids(KM.DISPLAY_LOOP); // free up memory from 'setTimeout' calls
	    events = KM.server.latest_events;

	    if (events.length > 1) { // jump to full screen and exit
		KM.add_timeout_id(KM.DISPLAY_LOOP, setTimeout(function () {init_full(); }, 1));
		return;
	    }

	    if (KM.www_rc.low_bandwidth) { // low bandwidth code, refresh display every
		now = new Date(); // 15 mins only, any events and loop jumps to full screen
		if (now.getTime() - bw_start_time < 15 * 60 * 1000) {
		    KM.add_timeout_id(KM.DISPLAY_LOOP, setTimeout(function () {refresh_normal(); }, 1000));
		    return;
		}
	    }

	    camera_ptr++;
	    if (camera_ptr < num_feeds) {
		var feed = KM.www_rc.display_cameras[KM.www_rc.display_select][camera_ptr];
		// check that the feed is enabled, and check it has not
		// already been 'refreshed' to trap multiple views of same feed.
		// These are taken care of by 'refresh_callback_normal'.
		if (KM.www_rc.feed_enabled[feed] &&
		!KM.item_in_array(feed, refreshed)) {
		    refreshed[refreshed.length] = feed;
		    KM.add_timeout_id(KM.DISPLAY_LOOP, setTimeout(function () {KM.get_jpeg(feed, refresh_callback_normal, session_id_normal); }, 1));
		    return;
		}
		    KM.add_timeout_id(KM.DISPLAY_LOOP, setTimeout(function () {refresh_normal(); }, 1));
		    return;
	    }

	    // end of display 'run', reset
	    camera_ptr = 0;
	    refreshed.length = 0; // zero the 'refreshed' array
	    now = new Date();     // reset 'clock' for low bandwidth option
	    bw_start_time = now.getTime();
	    KM.add_timeout_id(KM.DISPLAY_LOOP, setTimeout(function () {refresh_normal(); }, 1));
	}


	function refresh_callback_normal(jpeg, feed, same, session_id) {

	    // A function that is called by 'get_jpeg' when jpeg avaliable
	    //
	    // expects:
	    // 'jpeg'       ... the jpeg name
	    // 'feed'       ... the feed number
	    // 'same'       ... bool if same as last jpeg
	    // 'session_id' ... the session id
	    //
	    // returns:
	    //

	    if (session_id !== KM.session_id.current) return;
	    KM.update_feeds();

	    if (jpeg === 'null') {
		KM.add_timeout_id(KM.DISPLAY_LOOP, setTimeout(function () {refresh_normal(); }, 1));
		return;
	    }

	    if (same) {
		KM.add_timeout_id(KM.DISPLAY_LOOP, setTimeout(function () {refresh_normal(); }, 1));
		return;
	    }

	    jpeg_ptr++;
	    jpeg_ptr = (jpeg_ptr > 4)?0:jpeg_ptr;
	    jpegs[jpeg_ptr] = jpeg;

	    // check for multiple views of same feed, if found refresh them all
	    for (var i = 1; i < num_feeds; i++) {
		if (KM.www_rc.display_cameras[KM.www_rc.display_select][i] === feed) {
			try {
				document.getElementById('image_' + i).src = jpegs[jpeg_ptr];
			} catch (e) {}
		}
	    }
	    KM.text_refresh();
	    KM.add_timeout_id(KM.DISPLAY_LOOP, setTimeout(function () {refresh_normal(); }, 1));
	}


	function init_full() {

	    // A function that init's the 'full screen' grid
	    //
	    // expects:
	    //
	    // returns:
	    //

	    // init into full screen mode from normal grid
	    KM.session_id.current++;
	    session_id_full = KM.session_id.current;

	    KM.disable_display_buttons();
	    KM.disable_camera_buttons();
	    events_ptr = 1;
	    init_display_single(events[events_ptr]);

	    now = new Date();
	    full_start_time = now.getTime();
	    KM.add_timeout_id(KM.DISPLAY_LOOP, setTimeout(function () {refresh_full(); }, 1));
	}


	function refresh_full() {

	    // A function that performs the main 'full screen' refresh loop,
	    // complex by necessity
	    //
	    // expects:
	    //
	    // returns:
	    //

	    // refresh the full screen display
	    if (session_id_full !== KM.session_id.current) return;

	    KM.kill_timeout_ids(KM.DISPLAY_LOOP); // free up memory from 'setTimeout' calls
	    if (events.length === 1) { // jump to normal screen mode
		KM.add_timeout_id(KM.DISPLAY_LOOP, setTimeout(function () {init_normal(); }, 1));
		return;
	    }

	    now = new Date(); // show full screen event for a few seconds
	    if (now.getTime() - full_start_time > 5 * 1000) {
		full_start_time = now.getTime();
		events_ptr++;
	    }

	    if (events_ptr < events.length) {
		var feed = events[events_ptr];
		KM.add_timeout_id(KM.DISPLAY_LOOP, setTimeout(function () {KM.get_jpeg(feed, refresh_callback_full, session_id_full); }, 1));
		return;
	    }

	    // end of display 'run', reset
	    events = KM.server.latest_events;
	    events_ptr = 1;
	    KM.add_timeout_id(KM.DISPLAY_LOOP, setTimeout(function () {refresh_full(); }, 1));
	}


	function refresh_callback_full(jpeg, feed, same, session_id) {

	    // A function that is called by 'get_jpeg' when jpeg avaliable
	    //
	    // expects:
	    // 'jpeg'       ... the jpeg name
	    // 'feed'       ... the feed number
	    // 'same'       ... bool if same as last jpeg
	    // 'session_id' ... the session id
	    //
	    // returns:
	    //

	    if (session_id !== KM.session_id.current) return;

	    if (jpeg === 'null') {
		KM.add_timeout_id(KM.DISPLAY_LOOP, setTimeout(function () {refresh_full(); }, 1));
		return;
	    }

	    if (same) {
		KM.add_timeout_id(KM.DISPLAY_LOOP, setTimeout(function () {refresh_full(); }, 200));
		return;
	    }

	    jpeg_ptr++;
	    jpeg_ptr = (jpeg_ptr > 4)?0:jpeg_ptr;
	    jpegs[jpeg_ptr] = jpeg;
		try {
			document.getElementById('image_1').src = jpegs[jpeg_ptr];
		} catch (e) {}
	    var text = KM.www_rc.feed_name[feed];
	    document.getElementById('text_1').innerHTML = feed + ' : ' + text;
	    KM.add_timeout_id(KM.DISPLAY_LOOP, setTimeout(function () {refresh_full(); }, 1));
	}


	function init_display_single (feed) {

	    // A function to initialise the full screen display assigning jpeg
	    // and text id's. Does not use feed cache to initialise with cached
	    // jpegs to avoid image jumping.called by 'get_jpeg' when jpeg
	    // avaliable
	    //
	    // expects:
	    // 'feed'       ... the feed number
	    //
	    // returns:
	    //

	    var PADDING = 3;  // padding between camera displays

	    var html = '';
	    var jpeg = bcam_jpeg;
	    var	bcam_jpeg = 'images/bcam.png';

	    // calculates and sets the top and left margins plus the width
	    // and height of the display area while keeping to a 1.33 aspect ratio
	    // PADDING * 2 for outer borders
	    var scaled_width = KM.browser.main_display_width - PADDING * 2;
	    var scaled_height = KM.browser.main_display_height - PADDING * 2;

	    // calculate the scaled size keeping aspect ratio 384 / 288 = 1.33
		var scale=KM.browser.main_display_width / KM.browser.main_display_height;
		if (scale > 2) {
			scale=2;
		} else if (scale < 1) {
			scale=1;
		}
	    if ((scaled_width / scaled_height) < scale) {
		scaled_height = scaled_width / scale;
	    } else {
		scaled_width = scaled_height * scale;
	    }
	    var left_margin = ((KM.browser.main_display_width - scaled_width) / 2);
	    var top_margin = PADDING;
	    var jpeg_width = scaled_width;
	    var jpeg_height = scaled_height;

	    var text = KM.www_rc.feed_name[feed];
	    text = feed + ' : ' + text;

	    var l1 = '<img id="image_1" ';
	    var l2 = 'style="position:absolute; ';
	    var l3 = 'left:' + left_margin + 'px; ';
	    var l4 = 'top:' + top_margin + 'px; ';
	    var l5 = 'width:' + jpeg_width + 'px; ';
	    var l6 = 'height:' + jpeg_height + 'px;" ';
	    var l7 = 'src="images/bcam.png";';
	    var l8 = 'alt="">';
	    html = html + l1 + l2 + l3 + l4 + l5 + l6 + l7 + l8;

	    var l10 = '<span id="text_1"; ';
	    var l11 = 'style="position:absolute; ';
	    var l12 = 'left:' + (left_margin + 10) + 'px; ';
	    var l13 = 'top:' +  (top_margin + 10) + 'px;';
	    var l14 = 'font-weight: bold;';
	    var l15 = 'color:' + KM.RED;
	    var l16 = '">' + text + '</span>';
	    html = html + l10 + l11 + l12 + l13 + l14 + l15 + l16;

	    document.getElementById('main_display').innerHTML = html;
	}
    }
};


/* ****************************************************************************
Archive display - Archive code.

Code to display event listings and play back archive movies, smovies and snaps
**************************************************************************** */


KM.display_archive_ = function () {

    // the archive variables are unusual, most are uninitialised lists since
    // there is no way of knowing how big any requested archive will be.
    // Although not a problem the data structure cannot be laid out as with the
    // other variables.

    // also the 'blocks' of variables have common indices, this could have been
    // done with more multi-dimensional arrays but this approach is easier to
    // understand

    var movie_show =    false; // currently showing
    var smovie_show =   false;
    var snap_show =     false;

    var dates =         []; // array of avaliable dates
    var cameras =       []; // multi-dimensional array of cameras per date
    var titles =        []; // multi-dimensional array of titles per date
    var movie_flags =   []; // multi-dimensional array per date per cam
    var smovie_flags =  []; // multi-dimensional array per date per cam
    var snap_flags =    []; // multi-dimensional array per date per cam

    var event_mode =  true; // in event as opposed to display mode
    var play_mode =   true; // in play as opposed to frame mode
    var jpeg_html =  false; // displaying jpeg HTML as opposed to swf HTML
    var display_secs =   0; // the current secs count
    var ref_time_ms =    0; // ref time in ms
    var play_accel =     0; // the FF/REW play_acceleration 0 to 7
    var play_accel_mult = [1, 2, 5, 10]; // non linear play play acceleration

    var movie_id =       0; // the current movies id
    var movie_start =   []; // movie (ffmpeg) start secs
    var movie_end =     []; // movie (ffmpeg) end secs
    var movie_ext =     []; // movie (ffmpeg) end secs
    var movie_fps =     []; // movie (ffmpeg) fps
    var movie_frames =   0; // the current movies max frame count
    var movie_frame =    0; // the current movies frame
    var movie_index =    0; // the current movies index, -1 = no movie playing

    var smovie_start =  []; // smovie start secs
    var smovie_sitems = []; // smovie num items in start secs dir
    var smovie_end =    []; // smovie end secs
    var smovie_eitems = []; // smovie num items in end secs dir
    var smovie_fps =    []; // smovie fps
    var smovie_frame =   0; // the current smovies frame
    var smovie_index =   0; // the current smovie index

    var snap_init =     []; // snapshot init secs
    var snap_intvl =    []; // snapshot intervals secs

    var tline_old_slt = -1; // the old timeline slot
    var tline_old_src = ''; // the old time line src

    var backdrop_height = 0; // archive backdrop height
    var backdrop_width =  0; // archive backdrop width

    var cache_jpeg = [new Image, new Image, new Image, new Image];
    var cache_ptr =      0; // the cache pointer

    var show_jpegs = ['', '', '', ''];
    var show_ptr =       0; // the show pointer
	
	var cur_camera = 0;
	
	




	function init() {

	// A function that initialises that sets the archive backdrop HTML,
	// partialy populates the dbase and calls 'init_menus'.
	//
	// expects:
	//
	// returns:
	//

	KM.session_id.current++;
	var session_id = KM.session_id.current;
	KM.set_main_display_size(); // in case user has 'zoomed' browser view
	init_backdrop_html();
	var callback = init_main_menus;
	populate_dates_cams_dbase(callback, session_id);
    }


    function init_main_menus(session_id) {

	// A function that initialises and enables the main drop down menus.
	// The 2nd part of display archive init, split due to asynchronous
	// nature of xmlhttp calls and the need for setTimeout's (yuk!)
	//
	// expects:
	// 'session_id'  ... the current session id
	//
	// returns:
	//

	if (dates.length === 0) {
	    var html  = '<div class="archive_msg" style="text-align: center"><br><br>';
	    html += 'There are currently no recorded events or snapshots to display.<br><br>';
	    html += 'To enable event recording select either \'frame mode\' or ';
	    html += '\'movie mode\'<br>in the camera configuration ';
	    html += 'section and edit the motion mask.<br><br>';
	    html += 'To enable snapshot recording select \'snapshot mode\' in the camera<br>';
	    html += 'configuration section</div>';
	    document.getElementById('display_html').innerHTML = html;

	} else {

	    update_title_noclock();
	    populate_date_dropdown();
	    populate_camera_dropdown();
	    mode_setto_event();

	    document.getElementById('date_select').disabled =   false;
	    document.getElementById('camera_select').disabled = false;
	    document.getElementById('view_select').disabled =   false;
	    document.getElementById('mode_select').disabled =   false;

	    var callback = init_to_event_mode;
	    populate_frame_dbase(callback, dates[document.getElementById('date_select').selectedIndex],
	    cameras[document.getElementById('date_select').selectedIndex][document.getElementById('camera_select').selectedIndex], session_id);
	}
    }


    function init_to_event_mode() {

	// A function that initialises the view dropdown menu, this has to be
	// seperate due to view needing the frame dbase to see which is the
	// latest recorded movie.
	//
	// The 3rd part of display archive init, split due to asynchronous
	// nature of xmlhttp calls and the need for setTimeout's (yuk!)
	//
	// expects:
	//
	// returns:
	//

	populate_view_dropdown(); // needs to be here to get frames dbase info
	init_to_event_mode2();
    }


    function init_to_event_mode2() {

	// A function that initialises the archive display and the timeline.
	// This is the 4th and final part of display archive init, split due to
	// asynchronous nature of xmlhttp calls and the need for setTimeout's
	// (yuk!)
	//
	// expects:
	//
	// returns:
	//

	mode_setto_event();
	update_title_noclock(); // strip the clock
	blank_button_bar();
	var date = dates[document.getElementById('date_select').selectedIndex];
	var camera = cameras[document.getElementById('date_select').selectedIndex][document.getElementById('camera_select').selectedIndex];
	init_events_html(date, camera);
	populate_tline();
    }


    function init_backdrop_html() {

	// A function that generates the archive backdrop HTML including the top
	// dropdown menus, the main display, the bottom button bar and the
	// timeline.
	//
	// expects:
	//
	// returns:
	//

	backdrop_width = KM.browser.main_display_width * 0.8;
	backdrop_height = KM.browser.main_display_height - 6 - 151;


	// var scale=KM.browser.main_display_width / KM.browser.main_display_height;
	// if (scale > 2) {
		// scale=2;
	// } else if (scale < 1) {
		// scale=1;
	// }

	// if ((backdrop_width / backdrop_height) < scale) {
	    // backdrop_height = backdrop_width / scale;
	// } else {
	    // backdrop_width = backdrop_height * scale;
	// }

	var left_offset = (KM.browser.main_display_width - backdrop_width) / 2;
	var dropdown_width = backdrop_width / 4;
	var button_width =   backdrop_width / 5;

	document.getElementById('main_display').innerHTML = '' +

	'<div id="title" style="width:' + backdrop_width + 'px;">' +
	    '<span class="italic">kmotion</span>: Archive ' +
	    '<span id="config_clock"> - </span>' +
	'</div>' +

	'<div class="divider">' +
	    '<img src="images/archive_divider.png" style="width:' + backdrop_width + 'px;" alt="" />' +
	'</div>' +

	'<div id="config_bar" class="archive_bar">' +
	    '<form name="config" action="" onsubmit="return false">' +

		'<select id="date_select" OnChange="KM.arch_change_date();" style="width:' + dropdown_width + 'px;" disabled >' +
		    '<option>----/--/--</option>' +
		'</select>' +

		'<select id="camera_select" OnChange="KM.arch_change_camera();" style="width:' + dropdown_width + 'px;" disabled>' +
		    '<option>-:</option>' +
		'</select>' +

		'<select id="view_select" OnChange="KM.arch_change_view();" style="width:' + dropdown_width + 'px;" disabled >' +
		    '<option>-</option>' +
		'</select>' +

		'<select id="mode_select" OnChange="KM.arch_change_mode();" style="width:' + dropdown_width + 'px;" disabled >' +
		    '<option>Event mode</option>' +
		    '<option>Display mode</option>' +
		'</select>' +

	    '</form>' +
	'</div>' +

	'<div id="display_html" class="archive_backdrop" style="overflow-x:hidden;width:' + backdrop_width + 'px;height:' + backdrop_height + 'px;">' +
	'</div>' +

	'<div class="archive_bar">' +
	    '<input type="button" id="bar_button1" style="width:' + button_width + 'px;" OnClick="KM.arch_bar_button_clicked(1);" value="-" disabled>' +
	    '<input type="button" id="bar_button2" style="width:' + button_width + 'px;" OnClick="KM.arch_bar_button_clicked(2);" value="-" disabled>' +
	    '<input type="button" id="bar_button3" style="width:' + button_width + 'px;" OnClick="KM.arch_bar_button_clicked(3);" value="-" disabled>' +
	    '<input type="button" id="bar_button4" style="width:' + button_width + 'px;" OnClick="KM.arch_bar_button_clicked(4);" value="-" disabled>' +
	    '<input type="button" id="bar_button5" style="width:' + button_width + 'px;" OnClick="KM.arch_bar_button_clicked(5);" value="-" disabled>' +
	'</div>' +

	'<div id="timeline" class="archive_timeline" style="width:' + backdrop_width + 'px;">' +
	'</div>';

	// timeline html, calculated rather than hard coded
	var tline_html = '';
	var pos = 0, old_pos = 0;
	var mins = 0, hours = 0, title = '';
	var segments = (24 * 60) / 5;
	var scale = backdrop_width / segments;
	var width = 0;

	for (var i = 1; i < segments + 1; i++) {
	    pos = Math.round(i * scale);
	    pos = Math.min(backdrop_width, pos);
	    width = pos - old_pos;
	    old_pos = pos;

	    // generate 'title' HH:MM
	    mins = (i - 1) * 5;
	    hours = parseInt(mins / 60);
	    mins = mins - (hours * 60);
	    title = KM.pad_out2(hours) + ":" + KM.pad_out2(mins);

	    tline_html += '<img id="tslot_' + i + '" src="./images/tline_g0.png" style="width:' +
	    width + 'px;height:30px;" onClick="KM.arch_tline_clicked(' + ((i - 1) * 5 * 60) + ')" title="' +
	    title  + '" alt="timeline">';
	}
	document.getElementById('timeline').innerHTML = tline_html;
	KM.show_downloading_msg();
    }


    KM.show_downloading_msg = function () {

	// A function that shows the 'downloading' message
	//
	// expects:
	//
	// returns:
	//

	document.getElementById('display_html').innerHTML = '<br><div class="archive_msg" style="text-align: center">... downloading data ...</div>';
    }


    function populate_date_dropdown() {

	// A function that populates the date dropdown and selects the latest
	// one.
	//
	// expects:
	//
	// returns:
	//

	// remove all 'date_select' options
	var date_select = document.getElementById('date_select');
	for (var i = date_select.options.length - 1; i > -1; i--) {
	    date_select.remove(i);
	}

	// add the avaliable dates
	var new_opt = '', date = '';
	for (var i = 0; i < dates.length; i++) {
	    new_opt = document.createElement('option');
	    date = dates[i];
	    new_opt.text = date.slice(0, 4) + ' / ' + date.slice(4, 6) + ' / ' + date.slice(6);
	    try {
	      date_select.add(new_opt, null); // standards compliant; doesn't work in IE
	    }
	    catch(ex) {
	      date_select.add(new_opt); // IE only
	    }
	var new_obj = null; // stop memory leak
	document.getElementById('date_select').selectedIndex = 0;
	}
    }


    function populate_camera_dropdown() {

	// A function that populates the camera dropdown and selects the
	// first one. Camera is dependent on date
	//
	// expects:
	//
	// returns:
	//

	// remove all 'camera_select' options
	var camera_select = document.getElementById('camera_select');
	var camera_index = camera_select.selectedIndex;
	var camera_title = camera_select.options[camera_index].text;
	
	
	for (var i = camera_select.options.length - 1; i > -1; i--) {
	    camera_select.remove(i);
	}

	// add the avaliable cameras based on 'archive.dates'
	var date_index = document.getElementById('date_select').selectedIndex;
	var new_opt = '';
	camera_index = 0;
	for (var i = 0; i < cameras[date_index].length; i++) {
	    new_opt = document.createElement('option');
	    new_opt.text = KM.pad_out2(cameras[date_index][i]) + ' : ' + titles[date_index][i];
		if (new_opt.text === camera_title) {
			camera_index = i;
		}
	    try {
	      camera_select.add(new_opt, null); // standards compliant; doesn't work in IE
	    }
	    catch(ex) {
	      camera_select.add(new_opt); // IE only
	    }
	var new_obj = null; // stop memory leak
	camera_select.selectedIndex = camera_index;
	}
    }


    function populate_view_dropdown() {

	// A function that populates the view dropdown and selects the
	// first one. View is dependent on camera.
	//
	// expects:
	//
	// returns:
	//

	var index = cameras[document.getElementById('date_select').selectedIndex][document.getElementById('camera_select').selectedIndex];

	var view_select = document.getElementById('view_select');
	for (var i = view_select.options.length - 1; i > -1; i--) {
	    view_select.remove(i);
	}

	var movie_enabled =  movie_flags[document.getElementById('date_select').selectedIndex][document.getElementById('camera_select').selectedIndex];
	var smovie_enabled = smovie_flags[document.getElementById('date_select').selectedIndex][document.getElementById('camera_select').selectedIndex];
	var snap_enabled =   snap_flags[document.getElementById('date_select').selectedIndex][document.getElementById('camera_select').selectedIndex];

	// if both 'movie' and 'smovie' avaliable, choose the latest ending
	if (movie_enabled && smovie_enabled) {
	    if (smovie_end[smovie_end.length - 1] >= movie_end[movie_end.length - 1]) {
		movie_enabled = false;
	    } else {
		smovie_enabled = false;
	    }
	}

	var drop_opts = [];
	drop_opts[0] = 'No filter';

	if ((movie_enabled || smovie_enabled) && snap_enabled) {
	    drop_opts[1] = 'Filter event movies';
	    drop_opts[2] = 'Filter snapshots';
	}

	for (var i = 0; i < drop_opts.length; i++) {
	    var new_opt = document.createElement('option');
	    new_opt.text = drop_opts[i];

	    try { view_select.add(new_opt, null); } // standards compliant; doesn't work in IE
	    catch(ex) { view_select.add(new_opt); } // IE only
	}

	var new_obj = null; // stop memory leak
	document.getElementById('view_select').selectedIndex = 0;
	movie_show =  movie_enabled;
	smovie_show = smovie_enabled;
	snap_show =   snap_enabled;
    }


    function populate_tline() {

	// A closure that populates the time line with appropreate graphics,
	// the more activity within a time slot, the 'higher' the graphic
	//
	// expects:
	//
	// returns:
	//

	var tline_block = 5 * 60;
	var thold = (5 * 60) / 6;
	var tmp = 0, src = '';
	var level = 0;

	for (var i = 1; i < 289; i++) {
	    src = './images/tline_g0.png';

	    if (snap_show) { // show snapshot data
		if (snap_tblock((i - 1) * tline_block, i * tline_block)) src = './images/tline_b1.png';
	    }

	    if (smovie_show) { // show smovie data
		level = 0;
		tmp = smovie_tblock((i - 1) * tline_block, (i * tline_block) - 1);
		if (tmp > thold * 5)      level = 6;
		else if (tmp > thold * 4) level = 5;
		else if (tmp > thold * 3) level = 4;
		else if (tmp > thold * 2) level = 3;
		else if (tmp > thold)     level = 2;
		else if (tmp > 0)         level = 1;
		if (level !== 0) src = './images/tline_r' + level + '.png';
	    }

	    else if (movie_show) { // show movie data
		level = 0;
		tmp = movie_tblock((i - 1) * tline_block, (i * tline_block) - 1);
		if (tmp > thold * 5)      level = 6;
		else if (tmp > thold * 4) level = 5;
		else if (tmp > thold * 3) level = 4;
		else if (tmp > thold * 2) level = 3;
		else if (tmp > thold)     level = 2;
		else if (tmp > 0)         level = 1;
		if (level !== 0) src = './images/tline_r' + level + '.png';
	    }

	    document.getElementById('tslot_' + i).src = src;
	}
	tline_old_slt = -1; // ensure 'tline_old_slt' is marked invalid


	function snap_tblock(from_secs, to_sec) {
	    // return bool if timeblock contains snapshot
	    var calc_secs = 99999; // invalid secs to start
	    var last_valid1 = -1;  // last valid i value
	    var last_valid2 = -1;  // last 'last_valid1' value

	    for (var i = snap_init.length - 1; i > -1; i--) {
		if (snap_intvl[i] !== 0) {
		    last_valid2 = last_valid1;
		    last_valid1 = i;
		}

		if (snap_init[i] <= from_secs) {

		    if (snap_intvl[i] === 0) {
			// if 'intvl' is zero and no 'last_valid', skip backwards
			if (last_valid1 !== -1) {
			    // if 'intvl' is zero and a valid 'last_valid', use it
			    calc_secs = snap_init[last_valid1];
			}
			break;
		    }
		    var strip = from_secs - snap_init[i];
		    var ratio = strip / snap_intvl[i];
		    ratio = parseInt(ratio, 10) + 1;
		    calc_secs = snap_init[i] + parseInt(ratio, 10) * snap_intvl[i];

		    // special case of next 'intvl' crosses 'init' boarder, use 'last_valid2'
		    // since we are in a valid position by definition
		    if (snap_init[Math.min(i + 1, snap_init.length)] <= calc_secs) {
			calc_secs = snap_init[last_valid2];
		    }
		    break;
		}
	    }
	    // if 'secs' before earliest 'init', use 'last_valid1'
	    if (calc_secs === 99999 && last_valid1 !== -1) {
		calc_secs = snap_init[last_valid1];
	    }
	    return calc_secs <= to_sec;
	}


	function movie_tblock(from_secs, to_secs) {
	    // return seconds of timeblock filled by movie
	    var secs = 0;
	    for (var i = 0; i < movie_start.length; i++) {
		if (movie_start[i] <= to_secs && movie_end[i] >= from_secs) {
		    secs += Math.min(movie_end[i], to_secs) - Math.max(movie_start[i], from_secs);
		}
	    }
	    return secs;
	}


	function smovie_tblock(from_secs, to_secs) {
	    // return seconds of timeblock filled by smovie
	    var tmp =  0;
	    var secs = 0;
	    for (var i = 0; i < smovie_start.length; i++) {
		if (smovie_start[i] <= to_secs && smovie_end[i] >= from_secs) {
		    tmp = Math.min(smovie_end[i], to_secs);
		    secs += tmp - smovie_start[i];
		}
	    }
	    return secs;
	}
    }


    function init_events_html(date, camera) {

	// A closure that generates the event HTML inside the archive backdrop
	// HTML and embeds highlighting for the top 10% of event durations.
	//
	// expects:
	// 'date'   ... the selected date
	// 'camera' ... the selected camera
	//
	// returns:
	//

	var html = '', span_html = '', duration = 0;

	if (movie_show) { // movie events
	    var hlight = top_10pc(movie_start, movie_end);
	    for (var i = 0; i < movie_start.length; i++) {

		span_html = 'onclick="KM.arch_event_clicked(' + movie_start[i]  + ')"';
		duration = movie_end[i] - movie_start[i];
		if (KM.item_in_array(duration , hlight)) span_html += ' style="color:#D90000"';
		var src = 'images_dbase/' + date + '/' + KM.pad_out2(camera) + '/snap/' + KM.secs_hhmmss(movie_start[i]) + '.jpg';
		//html += '<span ' + span_html + ' onmouseover="showhint(\'<img width=256px src='+src+'>\')" onmouseout="hidehint()" onclick="hidehint()">';
		html += '<span ' + span_html + '>';
		html += '&nbsp;Movie event&nbsp;&nbsp;';
		html += KM.secs_hh_mm_ss(movie_start[i]);
		html += '&nbsp;&nbsp;-&nbsp;&nbsp;';
		html += KM.secs_hh_mm_ss(movie_end[i]);
		html += '&nbsp;&nbsp;duration&nbsp;&nbsp;';
		html += KM.pad_out4(duration);
		html += '&nbsp;&nbsp;secs&nbsp;&nbsp ... &nbsp;&nbsp;click to view<br>';
		html += '</span>';
	    }

	} else if (smovie_show) { // smovie events
	    var hlight = top_10pc(smovie_start, smovie_end);
	    for (var i = 0; i < smovie_start.length; i++) {

		span_html = 'onclick="KM.arch_event_clicked(' + smovie_start[i]  + ')"';
		duration = smovie_end[i] - smovie_start[i];
		if (KM.item_in_array(duration , hlight)) span_html += ' style="color:#D90000"';

		html += '<span ' + span_html + '>';
		html += '&nbsp;Frame movie event&nbsp;&nbsp;';
		html += KM.secs_hh_mm_ss(smovie_start[i]);
		html += '&nbsp;&nbsp;-&nbsp;&nbsp;';
		html += KM.secs_hh_mm_ss(smovie_end[i]);
		html += '&nbsp;&nbsp;duration&nbsp;&nbsp;';
		html += KM.pad_out4(duration);
		html += '&nbsp;&nbsp;secs&nbsp;&nbsp ... &nbsp;&nbsp;click to view<br>';
		html += '</span>';
	    }
	}

	if (html.length === 0) {
	    html += '<div class="archive_msg" style="text-align: center"><br><br>';
	    html += 'There are currently no recorded events to display.<br><br>';
	    html += 'To enable event recording select either \'frame mode\' or ';
	    html += '\'movie mode\'<br>in the camera configuration ';
	    html += 'section and edit the motion mask.<br><br>To display ';
	    html += 'snapshot images select \'Display mode\'.</div>';
	}

	document.getElementById('display_html').innerHTML = html;

	function top_10pc(start, end) {
	    // return a list of the top 10% event durations
	    var top = [];
	    for (var i = 0; i < start.length; i++) {
		top[i] = end[i] - start[i];
	    }
	    top = top.sort(function(a,b){return a - b});
	    var num_hlight = Math.max(1, parseInt(top.length / 10, 10));
	    return top.splice(top.length - num_hlight, num_hlight);
	}
    };


    function change_date() {

	// A function that is executed when the date is changed, re-inits
	// 'camera', 'view' and 'mode' dropdowns, reloads the frame dbase and
	// calls 'populate_tline'
	//
	// expects:
	//
	// returns:
	//

	KM.session_id.current++;
	var session_id = KM.session_id.current;
	wipe_tline();
	KM.show_downloading_msg();	
	populate_camera_dropdown();
	var callback = init_to_event_mode;	
	populate_frame_dbase(callback, 
						dates[document.getElementById('date_select').selectedIndex],
						cameras[document.getElementById('date_select').selectedIndex][document.getElementById('camera_select').selectedIndex], 
						session_id);		
    };


    function change_camera() {

	// A function that is executed when the camera is changed, re-inits
	// 'view' and 'mode' dropdowns, reloads the frame dbase and
	// calls 'populate_tline'
	//
	// expects:
	//
	// returns:
	//

	KM.session_id.current++;
	var session_id = KM.session_id.current;
	wipe_tline();
	KM.show_downloading_msg();
	mode_setto_event();
	var callback = init_to_event_mode;
	populate_frame_dbase(callback, dates[document.getElementById('date_select').selectedIndex],
	cameras[document.getElementById('date_select').selectedIndex][document.getElementById('camera_select').selectedIndex], session_id);
    };


    function change_view() {

	// A function that is executed when the view is changed, calls
	// 'init_to_event_mode'
	//
	// expects:
	//
	// returns:
	//

	wipe_tline();
	KM.show_downloading_msg();

	var movie_enabled =  movie_flags[document.getElementById('date_select').selectedIndex][document.getElementById('camera_select').selectedIndex];
	var smovie_enabled = smovie_flags[document.getElementById('date_select').selectedIndex][document.getElementById('camera_select').selectedIndex];
	var snap_enabled =   snap_flags[document.getElementById('date_select').selectedIndex][document.getElementById('camera_select').selectedIndex];

	// if both 'movie' and 'smovie' avaliable, choose 'smovie'


	var view = document.getElementById('view_select').selectedIndex;

	// no filtering
	movie_show =  movie_enabled;
	smovie_show = smovie_enabled;
	snap_show =   snap_enabled;
	if (view === 0) {
	    if (movie_enabled && smovie_enabled){ smovie_enabled = false; smovie_show=false; }
	} else if (view === 1) {
	    if (movie_enabled && smovie_enabled){ movie_enabled = false; movie_show=false; }
	    snap_show = false;

	} else if (view === 2) {
	    movie_show =  false;
	    smovie_show = false;
	}

	// 'init_to_event_mode2' so as not to re-init the dropdown to default
	init_to_event_mode2();
    };


    function change_mode() {

	// A function that is executed when the mode is changed between display
	// and event
	//
	// expects:
	//
	// returns:
	//

	if (document.getElementById('mode_select').selectedIndex === 0) {
	    // event mode
	    KM.session_id.current++;
	    event_mode = true;
	    update_title_noclock(); // strip the clock
	    remove_tline_marker();  // don't wipe tline
	    blank_button_bar();
	    var date = dates[document.getElementById('date_select').selectedIndex];
	    var camera = cameras[document.getElementById('date_select').selectedIndex][document.getElementById('camera_select').selectedIndex];
	    init_events_html(date, camera);
	    document.onkeydown=null; //stop memory leak

	} else {
	    // display mode
	    event_mode = false;
	    play_mode = true;
	    play_accel = 4; // play forward
	    update_button_bar_play_mode();
	    play_forward(-1); // ie from the start
		current_play_accel=play_accel;
	}
    };


    function mode_setto_event() {

	// A function that sets the display to 'event'
	//
	// expects:
	//
	// returns:
	//

	event_mode = true;
	document.getElementById('mode_select').selectedIndex = 0;
    };


    function mode_setto_display() {

	// A function that sets the display to 'display'
	//
	// expects:
	//
	// returns:
	//

	event_mode = false;
	document.getElementById('mode_select').selectedIndex = 1;
    };


    function update_title_clock(secs) {

	// A function to updates the title and 'clock'
	//
	// expects:
	// 'secs' ... the 'secs' to display
	//
	// returns:
	//

	var feed = cameras[document.getElementById('date_select').selectedIndex][document.getElementById('camera_select').selectedIndex];
	var title = titles[document.getElementById('date_select').selectedIndex][document.getElementById('camera_select').selectedIndex];
	var time = KM.secs_hh_mm_ss(secs+tm);
	document.getElementById('config_clock').innerHTML = '' +
	'(' + KM.pad_out2(feed) + ':' + title + ' ' + time + ')';
	feed = null; // stop memory leak
	title = null;
    };


    function update_title_noclock() {

	// A function to updates the title but does not show the 'clock'
	//
	// expects:
	//
	// returns:
	//

	var feed = cameras[document.getElementById('date_select').selectedIndex][document.getElementById('camera_select').selectedIndex];
	var title = titles[document.getElementById('date_select').selectedIndex][document.getElementById('camera_select').selectedIndex];
	document.getElementById('config_clock').innerHTML = '' +
	'(' + KM.pad_out2(feed) + ':' + title + ')';
	feed = null; // stop memory leak
	title = null;
    };


    function blank_button_bar() {

	// A function to disable and populate the bottom button bar with '-'
	//
	// expects:
	//
	// returns:
	//

	// disable buttons
	for (var i = 1; i < 6; i++) {
	    document.getElementById('bar_button' + i).disabled = true;
	}

	document.getElementById('bar_button1').value = '-';
	document.getElementById('bar_button2').value = '-';
	document.getElementById('bar_button3').value = '-';
	document.getElementById('bar_button4').value = '-';
	document.getElementById('bar_button5').value = '-';
    };


    function disable_button_bar() {

	// A function to disable the bottom button bar
	//
	// expects:
	//
	// returns:
	//

	for (var i = 1; i < 6; i++) {
	    document.getElementById('bar_button' + i).disabled = true;
	}
    };


    function enable_button_bar() {

	// A function to enable the bottom button bar
	//
	// expects:
	//
	// returns:
	//

	for (var i = 1; i < 6; i++) {
	    document.getElementById('bar_button' + i).disabled = false;
	}
    };


    function update_button_bar_play_mode() {

	// A function to populate the bottom button bar 'play' text and
	// highlight appropreate button
	//
	// expects:
	//
	// returns:
	//

	// play_accel value reference
	//
	// 0, <<<< highlighted
	// 1, <<<  highlighted
	// 2, <<   highlighted
	// 3, <    highlighted
	// 4, >    highlighted
	// 5, >>   highlighted
	// 6, >>>  highlighted
	// 7, >>>> highlighted

	// enable all buttons
	for (var i = 1; i < 6; i++) {
	    document.getElementById('bar_button' + i).disabled = false;
	}

	// delete all highlights
	for (var i = 1; i < 6; i++) {
	    document.getElementById('bar_button' + i).style.color = KM.BLACK;
	};

	var grid = [['<<<<', '<', '>', '>>'],
		     ['<<<', '<', '>', '>>'],
		      ['<<', '<', '>', '>>'],
		      ['<<', '<', '>', '>>'],
	              ['<<', '<', '>', '>>'],
		      ['<<', '<', '>', '>>'],
	              ['<<', '<', '>', '>>>'],
	              ['<<', '<', '>', '>>>>']];

	var text = grid[play_accel];
	grid=null;

	document.getElementById('bar_button1').value = text[0];
	document.getElementById('bar_button2').value = text[1];
	document.getElementById('bar_button3').value = 'Click for frames';
	document.getElementById('bar_button4').value = text[2];
	document.getElementById('bar_button5').value = text[3];

	if (play_accel < 3)  document.getElementById('bar_button1').style.color = KM.RED;
	if (play_accel === 3) document.getElementById('bar_button2').style.color = KM.RED;
	if (play_accel === 4) document.getElementById('bar_button4').style.color = KM.RED;
	if (play_accel > 4)  document.getElementById('bar_button5').style.color = KM.RED;
    };


    function update_button_bar_frame_mode() {

	// A function to populate the bottom button bar 'frame' text
	//
	// expects:
	//
	// returns:
	//

	// enable all buttons
	for (var i = 1; i < 6; i++) {
	    document.getElementById('bar_button' + i).disabled = false;
	}

	// delete all highlights
	for (var i = 1; i < 6; i++) {
	    document.getElementById('bar_button' + i).style.color = KM.BLACK;
	}

	document.getElementById('bar_button1').value = '-event';
	document.getElementById('bar_button2').value = '-frame';
	document.getElementById('bar_button3').value = 'Click to play';
	document.getElementById('bar_button4').value = '+frame';
	document.getElementById('bar_button5').value = '+event';
    };


    function wipe_tline() {

	// A function wipe the time line, used while downloading
	//
	// expects:
	//
	// returns:
	//

	for (var i = 1; i < 289; i++) {
	   document.getElementById('tslot_' + i).src = './images/tline_g0.png';
	}
    }


    function update_tline_marker(secs) {

	// A function to update the time line marker to current 'secs', deletes
	// the old marker if neccessary
	//
	// expects:
	// 'secs' ... the current 'secs'
	//
	// returns:
	//

	var slot = parseInt(secs / (5 * 60)) + 1;
	if (slot != tline_old_slt) {
	    if (tline_old_slt > -1) { // check for 1st time
		document.getElementById('tslot_' + tline_old_slt).src = tline_old_src;
	    }
	    tline_old_slt = slot;
	    tline_old_src = document.getElementById('tslot_' + slot).src;
	    document.getElementById('tslot_' + slot).src = './images/tline_y6.png';
	}
    }


    function remove_tline_marker() {

	// A function to remove the time line marker
	//
	// expects:
	//
	// returns:
	//

	if (tline_old_slt > -1) { // check for 1st time
	    document.getElementById('tslot_' + tline_old_slt).src = tline_old_src;
	}
    }


    function bar_button_clicked(button) {

	// A function called when a bar button is clicked, its function depends
	// on the archive mode
	//
	// expects:
	// button ... the button number 1 to 5
	//
	// returns:
	//

	// play_accel value reference
	//
	// 0, <<<< highlighted
	// 1, <<<  highlighted
	// 2, <<   highlighted
	// 3, <    highlighted
	// 4, >    highlighted
	// 5, >>   highlighted
	// 6, >>>  highlighted
	// 7, >>>> highlighted

	var old_play_accel = play_accel;
	if (play_mode) { // play mode

	    if (button === 1) { // fast play backward
		if (play_accel > 2) {
		    play_accel = 2;
		} else {
		    play_accel--;
		    play_accel = Math.max(1, play_accel);
		}
		update_button_bar_play_mode();


	    } else if (button === 2) { // play backward
		play_accel = 3;
		update_button_bar_play_mode();


	    } else if (button === 3) { // frame mode
		KM.session_id.current++;
		play_mode = false;
		update_button_bar_frame_mode();


	    } else if (button === 4) { // play forward
		play_accel = 4;
		update_button_bar_play_mode();


	    } else if (button === 5) { // fast play forward
		if (play_accel < 5) {
		    play_accel = 5;
		} else {
		    play_accel++;
		    play_accel = Math.min(7, play_accel);
		}
		update_button_bar_play_mode();
	    }


	    // change playback direction if neccessary
	    //if (old_play_accel > 3 && play_accel < 4) {
		//play_backward();
	    //}

	    //if (old_play_accel < 4 && play_accel > 3) {
		//play_forward();
	    //}

		current_play_accel=play_accel;

	} else { // frame mode

	    if (button === 1) { // -event
		prev_event();

	    } else if (button === 2) { // -frame
		play_accel = 3; // play backward
		play_backward();

	    } else if (button === 3) { // play mode
		play_mode = true;
		play_accel = 4; // play forward
		update_button_bar_play_mode();
		play_forward();

	    } else if (button === 4) { // +frame
		play_accel = 4; // play forward
		play_forward();

	    } else if (button === 5) { // +event
		next_event();
	    }
		current_play_accel=4;
	}
    };


    function tline_clicked(tline_secs) {

	// A function called when a the time line is clicked
	//
	// expects:
	// 'tline_secs' ... the timeline secs
	//
	// returns:
	//

	KM.session_id.current++;
	mode_setto_display();

	//play_accel = 4; // ie play forward
	play_accel = (current_play_accel>0)?current_play_accel:4;
	play_mode = true;
	update_button_bar_play_mode();
	play_forward(tline_secs);

    }

    KM.event_clicked = tline_clicked;

	// A function called when an event is clicked
	//
	// expects:
	// 'event_secs' ... the event secs
	//
	// returns:
	//


    function play_forward(from_secs) {

	// A function that plays the archive forward. If 'from_secs' is
	// specified play forward from 'from_secs' else play forward from
	// current position.
	//
	// expects:
	// 'from_secs'  ... play the archive 'from_secs'
	//
	// returns:
	//

	//movie_index=0;
	//for (movie_index=0;i<=movie_start.length-1;movie_index++)
	//{
	//	if (from_secs==movie_start[movie_index])
	//		break;
	//}
	//alert (movie_start);
	//alert (movie_index);

	KM.session_id.current++;
	var session_id = KM.session_id.current;
	KM.kill_timeout_ids(KM.ARCH_LOOP);

	if (from_secs !== undefined) {
	    display_secs = from_secs;
	    update_tline_marker(display_secs);
	    next_movie_frame('reset');
	    next_smovie_frame(0, 0, 'reset');
	    reset_jpeg_html(); // set to jpeg HTML
	    jpeg_html = true;
	}

	var date = dates[document.getElementById('date_select').selectedIndex];
	var cam = cameras[document.getElementById('date_select').selectedIndex][document.getElementById('camera_select').selectedIndex];

	function next_frame(skip) {
	    // reference time to calculate inter frame pauses
	    ref_time_ms = (new Date()).getTime();
	    KM.kill_timeout_ids(KM.ARCH_LOOP);


	    if (play_accel > 3) { // ie forward

		// code to implement frame skipping for faster archive playback
		// skip the next 'skip' frames or until snap
		if (KM.www_rc.skip_frames && play_accel !== 4) {
		    for (var i = 0; i < skip; i++) {

			var skip_next_snap_obj = next_snap_frame(date, cam);

			if (movie_show) { // if a movie check for next frame ...
			    var skip_next_movie_obj =  next_movie_frame();
			    if (skip_next_movie_obj.valid && ((skip_next_movie_obj.secs <= skip_next_snap_obj.secs) || !snap_show || !skip_next_snap_obj.valid)) {

				display_secs = skip_next_movie_obj.secs;
				movie_frame =  skip_next_movie_obj.frame;
				movie_index =  skip_next_movie_obj.index;

				continue
			    }

			} else if (smovie_show) { // if a smovie check for next frame ...
			    var skip_next_smovie_obj = next_smovie_frame(date, cam);
			    if (skip_next_smovie_obj.valid && ((skip_next_smovie_obj.secs <= skip_next_snap_obj.secs) || !snap_show || !skip_next_snap_obj.valid)) {

				display_secs = skip_next_smovie_obj.secs;
				smovie_frame = skip_next_smovie_obj.frame;
				smovie_index = skip_next_smovie_obj.index;

				continue
			    }
			}
			break;
		    }
		}

		// normal archive playback
		var next_snap_obj = next_snap_frame(date, cam);

		if (movie_show) { // if a movie check for next frame ...
		    var next_movie_obj =  next_movie_frame();
		    if (next_movie_obj.valid && ((next_movie_obj.secs <= next_snap_obj.secs) || !snap_show || !next_snap_obj.valid)) {
			var callback = movie_pause;
			if (next_movie_obj.reset_html) {
			    jpeg_html = false;
			    reset_swf_html(next_movie_obj, session_id, callback);
			} else {
			    show_movie_frame(next_movie_obj, session_id, callback);
			}
			return;
		    }

		} else if (smovie_show) { // if a smovie check for next frame ...
		    var next_smovie_obj = next_smovie_frame(date, cam);
		    if (next_smovie_obj.valid && ((next_smovie_obj.secs <= next_snap_obj.secs) || !snap_show || !next_snap_obj.valid)) {
			var callback = smovie_pause;
			KM.display_smovie(next_smovie_obj, session_id, callback);
			return;
		    }
		}

		// if a snapshot check for next frame ...
		if (snap_show && next_snap_obj.valid) {

		    // reset to jpeg HTML if currently swf HTML after movie
		    if (!jpeg_html) {
			reset_jpeg_html();
			jpeg_html = true;
		    }

		    var callback = snap_pause;
		    display_snap(next_snap_obj, session_id, callback);
		    return;
		}
	    }
	}

	function movie_pause(next_movie_obj) {
	    // update vars only after successfull image display,

	    // note, only 'reset_swf_html' has the data to update 'movie_frames'
	    // you have to actually load the 'swf' to get the data

	    if (next_movie_obj.frames !== undefined) {
		movie_frames = next_movie_obj.frames;
	    }

	    display_secs = next_movie_obj.secs;
	    movie_frame =  next_movie_obj.frame;
	    movie_index =  next_movie_obj.index;

	    update_title_clock(display_secs);
	    update_tline_marker(display_secs);

	    if (play_mode) { // only loop if in play mode
		var taken_ms = (new Date()).getTime() - ref_time_ms;
		var sec_per_frame = (1000 / movie_fps[movie_index]) / play_accel_mult[play_accel - 4];
		var delay = sec_per_frame - taken_ms;

		var skip = 0;
		if (delay < 0) {
		    skip = - delay / sec_per_frame;
		    delay = 0;
		}

		var delay = Math.max(0, ((1000 / movie_fps[movie_index]) / play_accel_mult[play_accel - 4]) - taken_ms);
		KM.add_timeout_id(KM.ARCH_LOOP, setTimeout(function () {next_frame(skip); }, delay));
	    }
	}

	function smovie_pause(next_smovie_obj) {
	    // update vars only after successfull image display
	    display_secs = next_smovie_obj.secs;
	    smovie_frame = next_smovie_obj.frame;
	    smovie_index = next_smovie_obj.index;

	    update_title_clock(display_secs);
	    update_tline_marker(display_secs);

	    if (play_mode) { // only loop if in play mode
		var taken_ms = (new Date()).getTime() - ref_time_ms;
		var sec_per_frame = (1000 / smovie_fps[smovie_index]) / play_accel_mult[play_accel - 4];
		var delay = sec_per_frame - taken_ms;

		var skip = 0;
		if (delay < 0) {
		    skip = - delay / sec_per_frame;
		    delay = 0;
		}
		var delay = Math.max(0, ((1000 / smovie_fps[smovie_index]) / play_accel_mult[play_accel - 4]) - taken_ms);
		KM.add_timeout_id(KM.ARCH_LOOP, setTimeout(function () {next_frame(skip); }, delay));
	    }
	}

	function snap_pause(next_snap_obj) {
	    // update vars only after successfull image display
	    display_secs = next_snap_obj.secs;

	    update_title_clock(display_secs);
	    update_tline_marker(display_secs);

	    if (play_mode) { // only loop if in play mode
		var taken_ms = (new Date()).getTime() - ref_time_ms;
		var delay = Math.max(0, (1000 / play_accel_mult[play_accel - 4]) - taken_ms);
		KM.add_timeout_id(KM.ARCH_LOOP, setTimeout(function () {next_frame(0); }, delay));
	    }
	}
	next_frame();
    }



    function next_movie_frame(cmd) {

	// A function that calculates the next avaliable movie frame then
	// returns an object 'obj'.
	//
	// If 'cmd' == 'reset' stop blindly following the current frame 'stream'
	// and re-scan for the next frame when next called, this is an expensive
	// operation.
	//
	// expects :
	// 'cmd'            ... 'reset' ?
	//
	// returns :
	// 'obj.valid'      ... bool true if next movie frame is avaliable
	// 'obj.frame'      ... the frame count for the next frame
	// 'obj.index'      ... the index into movie/start/end lists
	// 'obj.secs'       ... the seconds count for the next frame
	// 'obj.reset_html' ... bool true if 'set_swf_html' call needed

	if (cmd === 'reset') {
	    movie_index = -1;

	} else {

	    if (movie_index !== -1) {

		var next_frame = movie_frame + 1;
		if (next_frame <= movie_frames) {
		    var next_secs = Math.round(((next_frame / movie_frames) * (movie_end[movie_index] - movie_start[movie_index])) + movie_start[movie_index]);
		    return {valid: true, frame: next_frame, secs: next_secs, index: movie_index, reset_html: false};
		} else {
		    movie_index = -1;
		}
	    }

	    // else search for the next movie event using 'display_secs'
	    for (var i = 0; i < movie_start.length; i++) {
		if ((movie_start[i] <= display_secs && movie_end[i] > display_secs) || movie_start[i] > display_secs) {
		    return {valid: true, frame: 1, secs: movie_start[i], index: i, reset_html: true};
		}
	    }

	    return {valid: false, frame: 0, secs: 0, index: 0, reset_html: false};
	}
    }


    function next_smovie_frame(date, cam, cmd) {

	// A function that calculates the next avaliable smovie frame then
	// returns an object 'obj'.
	//
	// If 'cmd' == 'reset' stop blindly following the current frame 'stream'
	// and re-scan for the next frame when next called, this is an expensive
	// operation.
	//
	// expects :
	// 'date'              ... the displayed date
	// 'cam'               ... the displayed camera
	// 'cmd'               ... 'reset' ?
	//
	// returns :
	// 'obj.valid'         ... bool true if next smovie frame is avaliable
	// 'obj.secs'          ... the seconds count (dir) for the next frame
	// 'obj.frame'         ... the frame count 0 - fps
	// 'obj.fq_image_name' ... the fully qualified next snapshot image name

	if (cmd === 'reset') {
	    smovie_index = -1;

	} else {

	    if (smovie_index !== -1) {

		var next_frame = smovie_frame + 1;
		var next_sec = display_secs;

		if (next_sec === smovie_end[smovie_index] && next_frame === smovie_eitems[smovie_index]) {
		    smovie_index = -1; // end of smovie

		} else {

		    if (next_frame >= smovie_fps[smovie_index]) {
			next_frame = 0;
			next_sec++;
		    }

		    return {valid: true, frame: next_frame, secs: next_sec, index: smovie_index,
		    fq_image_name: '/images_dbase/' + date + '/' + KM.pad_out2(cam) + '/smovie/' + KM.secs_hhmmss(next_sec) + '/' + KM.pad_out2(next_frame) + '.jpg'};
		}
	    }

	    // search for the next smovie event using 'display_secs'
	    for (var i = 0; i < smovie_start.length; i++) {
		if (smovie_start[i] <= display_secs && smovie_end[i] > display_secs) {

		    var tmp_frame = smovie_fps[i] - 1;
		    if (smovie_start[i] === display_secs) {
			tmp_frame = smovie_fps[i] - smovie_sitems[i];
		    }

		    return {valid: true, frame: smovie_fps[i] - smovie_sitems[i], secs: display_secs, index: i,
		    fq_image_name: '/images_dbase/' + date + '/' + KM.pad_out2(cam) + '/smovie/' + KM.secs_hhmmss(display_secs) + '/' + KM.pad_out2(tmp_frame) + '.jpg'};

		} else if (smovie_start[i] > display_secs) {

		    return {valid: true, frame: (smovie_fps[i] - smovie_sitems[i]), secs: smovie_start[i], index: i,
		    fq_image_name: '/images_dbase/' + date + '/' + KM.pad_out2(cam) + '/smovie/' + KM.secs_hhmmss(smovie_start[i]) + '/' + KM.pad_out2(smovie_fps[i] - smovie_sitems[i]) + '.jpg'};
		}
	    }

	    return {valid: false, frame: 0, secs: 0, index: 0, fq_image_name: ''};
	}
    }


    function next_snap_frame(date, cam) {

	// A function that calculates the next avaliable snapshot and returns an
	// object 'obj'
	//
	// expects :
	// 'date'              ... the displayed date
	// 'cam'               ... the displayed camera
	//
	// returns :
	// 'obj.valid'         ... bool true if next snapshot is avaliable
	// 'obj.secs'          ... the seconds count for the next snapshot
	// 'obj.fq_image_name' ... the fully qualified next snapshot image name

	var calc_secs = 99999; // invalid secs to start
	var last_valid1 = -1;  // last valid i value
	var last_valid2 = -1;  // last 'last_valid1' value

	for (var i = snap_init.length - 1; i > -1; i--) {
	    if (snap_intvl[i] !== 0) {
		last_valid2 = last_valid1;
		last_valid1 = i;
	    }

	    if (snap_init[i] <= display_secs) {

		if (snap_intvl[i] === 0) {
		    // if 'intvl' is zero and no 'last_valid', skip backwards
		    if (last_valid1 !== -1) {
			// if 'intvl' is zero and a valid 'last_valid', use it
			calc_secs = snap_init[last_valid1];
		    }
		    break;
		}
		var strip = display_secs - snap_init[i];
		var ratio = strip / snap_intvl[i];
		ratio = parseInt(ratio, 10) + 1;
		calc_secs = snap_init[i] + parseInt(ratio, 10) * snap_intvl[i];

		// special case of next 'intvl' crosses 'init' boarder, use 'last_valid2'
		// since we are in a valid position by definition
		if (snap_init[Math.min(i + 1, snap_init.length)] <= calc_secs) {
		    calc_secs = snap_init[last_valid2];
		}
		break;
	    }
	}
	// if 'secs' before earliest 'init', use 'last_valid1'
	if (calc_secs === 99999 && last_valid1 !== -1) {
	    calc_secs = snap_init[last_valid1];
	}

	if (calc_secs <= 86400) { // < 60 * 60 * 24 secs
	    return {valid: true, secs: calc_secs,
	    fq_image_name: '/images_dbase/' + date + '/' + KM.pad_out2(cam) + '/snap/' + KM.secs_hhmmss(calc_secs) + '.jpg'};
	} else {
	    return {valid: false, secs: 0, fq_image_name: ''};
	}
    }


    function next_event() {

	// A function that searches for the next avaliable event and calls
	// 'play_forward'
	//
	// expects :
	//
	// returns :
	//

	KM.session_id.current++;
	if (movie_show) {
	    for (var i = 0; i < movie_start.length; i++) {
		if (movie_start[i] > display_secs) {
		    play_forward(movie_start[i]);
		    break;
		}
	    }

	} else if (smovie_show) {
	    for (var i = 0; i < smovie_start.length; i++) {
		if (smovie_start[i] > display_secs) {
		    play_forward(smovie_start[i]);
		    break;
		}
	    }
	}
    }


    function play_backward(from_secs) {

	// A function that plays the archive backward. If 'from_secs' is
	// specified play backward from 'from_secs' else play backward from
	// current position.
	//
	// expects:
	// 'from_secs'  ... play the archive 'from_secs'
	//
	// returns:
	//

	KM.session_id.current++;
	var session_id = KM.session_id.current;
	KM.kill_timeout_ids(KM.ARCH_LOOP);

	if (from_secs !== undefined) {
	    display_secs = from_secs;


	    prev_movie_frame('reset');
	    prev_smovie_frame(0, 0, 'reset');
	    reset_jpeg_html(); // set to jpeg HTML
	    jpeg_html = true;
	}

	var date = dates[document.getElementById('date_select').selectedIndex];
	var cam = cameras[document.getElementById('date_select').selectedIndex][document.getElementById('camera_select').selectedIndex];

	function prev_frame(skip) {
	    // reference time to calculate inter frame pauses
	    ref_time_ms = (new Date()).getTime();
	    KM.kill_timeout_ids(KM.ARCH_LOOP);

	    if (play_accel < 4) { // ie backward

		// code to implement frame skipping for faster archive playback
		// skip the next 'skip' frames or until snap
		if (KM.www_rc.skip_frames && play_accel !== 3) {
		    for (var i = 0; i < skip; i++) {

			var skip_prev_snap_obj = prev_snap_frame(date, cam);

			if (movie_show) { // if a movie check for prev frame ...
			    var skip_prev_movie_obj =  prev_movie_frame();
			    if (skip_prev_movie_obj.valid && ((skip_prev_movie_obj.secs >= skip_prev_snap_obj.secs) || !snap_show || !skip_prev_snap_obj.valid)) {

				display_secs = skip_prev_movie_obj.secs;
				movie_frame =  skip_prev_movie_obj.frame;
				movie_index =  skip_prev_movie_obj.index;

				continue
			    }

			} else if (smovie_show) { // if a smovie check for prev frame ...
			    var skip_prev_smovie_obj = prev_smovie_frame(date, cam);
			    if (skip_prev_smovie_obj.valid && ((skip_prev_smovie_obj.secs >= skip_prev_snap_obj.secs) || !snap_show || !skip_prev_snap_obj.valid)) {

				display_secs = skip_prev_smovie_obj.secs;
				smovie_frame = skip_prev_smovie_obj.frame;
				smovie_index = skip_prev_smovie_obj.index;

				continue
			    }
			}
			break;
		    }
		}

		// normal archive playback
		var prev_snap_obj = prev_snap_frame(date, cam);

		if (movie_show) { // if a movie check for prev frame ...
		    var prev_movie_obj = prev_movie_frame();
		    if (prev_movie_obj.valid && ((prev_movie_obj.secs >= prev_snap_obj.secs) || !snap_show || !prev_snap_obj.valid)) {
			var callback = movie_pause;
			if (prev_movie_obj.reset_html) {
			    jpeg_html = false;
			    reset_swf_html(prev_movie_obj, session_id, callback);
			} else {
			    show_movie_frame(prev_movie_obj, session_id, callback);
			}
			return;
		    }

		} else if (smovie_show) { // if a smovie check for prev frame ...
		    var prev_smovie_obj = prev_smovie_frame(date, cam);
		    if (prev_smovie_obj.valid && ((prev_smovie_obj.secs >= prev_snap_obj.secs) || !snap_show || !prev_snap_obj.valid)) {
			var callback = smovie_pause;
			KM.display_smovie(prev_smovie_obj, session_id, callback);
			return;
		    }
		}

		// if a snapshot check for prev frame ...
		if (snap_show && prev_snap_obj.valid) {

		    // reset to jpeg HTML if currently swf HTML
		    if (!jpeg_html) {
			reset_jpeg_html();
			jpeg_html = true;
		    }

		    var callback = snap_pause;
		    display_snap(prev_snap_obj, session_id, callback);
		}
	    }
	}

	function movie_pause(prev_movie_obj) {
	    // update vars only after successfull image display,

	    // note, only 'reset_swf_html' has the data to update 'movie_frames'
	    // you have to actually load the 'swf' to get the data

	    if (prev_movie_obj.frames !== undefined) {
		movie_frames = prev_movie_obj.frames;
	    }

	    movie_frame =  prev_movie_obj.frame;
	    movie_index =  prev_movie_obj.index;
	    display_secs = prev_movie_obj.secs;
	    update_title_clock(display_secs);
	    update_tline_marker(display_secs);

	    if (play_mode) { // only loop if in play mode
		var taken_ms = (new Date()).getTime() - ref_time_ms;
		var sec_per_frame = (1000 / movie_fps[movie_index]) / play_accel_mult[3 - play_accel];
		var delay = sec_per_frame - taken_ms;

		var skip = 0;
		if (delay < 0) {
		    skip = - delay / sec_per_frame;
		    delay = 0;
		}

		var delay = Math.max(0, ((1000 / movie_fps[movie_index]) / play_accel_mult[3 - play_accel]) - taken_ms);
		KM.add_timeout_id(KM.ARCH_LOOP, setTimeout(function () {prev_frame(skip); }, delay));
	    }
	}

	function smovie_pause(prev_smovie_obj) {
	    // update vars only after successfull image display
	    display_secs = prev_smovie_obj.secs;
	    smovie_frame = prev_smovie_obj.frame;
	    smovie_index = prev_smovie_obj.index;

	    update_title_clock(display_secs);
	    update_tline_marker(display_secs);

	    if (play_mode) { // only loop if in play mode
		var taken_ms = (new Date()).getTime() - ref_time_ms;
		var sec_per_frame = (1000 / movie_fps[smovie_index]) / play_accel_mult[3 - play_accel];
		var delay = sec_per_frame - taken_ms;

		var skip = 0;
		if (delay < 0) {
		    skip = - delay / sec_per_frame;
		    delay = 0;
		}
		var delay = Math.max(0, ((1000 / smovie_fps[smovie_index]) / play_accel_mult[3 - play_accel]) - taken_ms);
		KM.add_timeout_id(KM.ARCH_LOOP, setTimeout(function () {prev_frame(skip); }, delay));
	    }
	}

	function snap_pause(prev_snap_obj) {
	    // update vars only after successfull image display
	    display_secs = prev_snap_obj.secs;

	    update_title_clock(display_secs);
	    update_tline_marker(display_secs);

	    if (play_mode) { // only loop if in play mode
		var taken_ms = (new Date()).getTime() - ref_time_ms;
		var delay = Math.max(0, (1000 / play_accel_mult[3 - play_accel]) - taken_ms);
		KM.add_timeout_id(KM.ARCH_LOOP, setTimeout(function () {prev_frame(); }, delay));
	    }
	}
	prev_frame();
    }


    function prev_movie_frame(cmd) {

	// A function that calculates the prev avaliable movie frame then
	// returns an object 'obj'.
	//
	// If 'cmd' == 'reset' stop blindly following the current frame 'stream'
	// and re-scan for the prev frame when next called, this is an expensive
	// operation.
	//
	// expects :
	// 'cmd'            ... 'reset' ?
	//
	// returns :
	// 'obj.valid'      ... bool true if prev movie frame is avaliable
	// 'obj.frame'      ... the frame count for the prev frame
	// 'obj.index'      ... the index into movie/start/end lists
	// 'obj.secs'       ... the seconds count for the prev frame
	// 'obj.reset_html' ... bool true if 'set_swf_html' call needed

	if (cmd === 'reset') {
	    movie_index = -1;

	} else {

	    if (movie_index !== -1) {

		var prev_frame = movie_frame - 1;
		if (prev_frame > 0) {
		    var prev_secs = Math.round(((prev_frame / movie_frames) * (movie_end[movie_index] - movie_start[movie_index])) + movie_start[movie_index]);
		    return {valid: true, frame: prev_frame, secs: prev_secs, index: movie_index, reset_html: false};
		} else {
		    movie_index = -1;
		}
	    }

	    // else search for the prev movie event using 'display_secs'
	    for (var i = movie_start.length; i > -1; i--) {
		if ((movie_start[i] < display_secs && movie_end[i] >= display_secs) || movie_end[i] < display_secs) {
		    return {valid: true, frame: 9999, secs: movie_end[i], index: i, reset_html: true};
		}
	    }

	    return {valid: false, frame: 0, secs: 0, index: 0, reset_html: false};
	}
    }


    function prev_smovie_frame(date, cam, cmd) {

	// A function that calculates the prev avaliable smovie frame then
	// returns an object 'obj'.
	//
	// If 'cmd' == 'reset' stop blindly following the current frame 'stream'
	// and re-scan for the prev frame when next called, this is an expensive
	// operation.
	//
	// expects :
	// 'date'              ... the displayed date
	// 'cam'               ... the displayed camera
	// 'cmd'               ... 'reset' ?
	//
	// returns :
	// 'obj.valid'         ... bool true if next smovie frame is avaliable
	// 'obj.secs'          ... the seconds count (dir) for the next frame
	// 'obj.frame'         ... the frame count 0 - fps
	// 'obj.fq_image_name' ... the fully qualified next snapshot image name

	if (cmd === 'reset') {
	    smovie_index = -1;

	} else {

	    if (smovie_index !== -1) {

		var prev_frame = smovie_frame - 1;
		var prev_sec = display_secs;

		if (prev_sec === smovie_start[smovie_index] && prev_frame === (smovie_fps[smovie_index] - smovie_sitems[smovie_index] - 1)) {
		    smovie_index = -1; // end of smovie

		} else {

		    if (prev_frame < 0) {
			prev_frame = smovie_fps[smovie_index] - 1;
			prev_sec--;
		    }

		    return {valid: true, frame: prev_frame, secs: prev_sec, index: smovie_index,
		    fq_image_name: '/images_dbase/' + date + '/' + KM.pad_out2(cam) + '/smovie/' + KM.secs_hhmmss(prev_sec) + '/' + KM.pad_out2(prev_frame) + '.jpg'};
		}
	    }

	    // search for the prev smovie event using 'display_secs'
	    for (var i = smovie_start.length; i > -1; i--) {
		if (smovie_start[i] < display_secs && smovie_end[i] >= display_secs) {

		    var tmp_frame = smovie_fps[i] - 1;
		    if (smovie_end[i] === display_secs) {
			tmp_frame = smovie_eitems[i] - 1;
		    }

		    return {valid: true, frame: tmp_frame, secs: display_secs, index: i,
		    fq_image_name: '/images_dbase/' + date + '/' + KM.pad_out2(cam) + '/smovie/' + KM.secs_hhmmss(display_secs) + '/' + KM.pad_out2(tmp_frame) + '.jpg'};

		} else if (smovie_end[i] < display_secs) {

		    return {valid: true, frame: (smovie_eitems[i] - 1), secs: smovie_end[i], index: i,
		    fq_image_name: '/images_dbase/' + date + '/' + KM.pad_out2(cam) + '/smovie/' + KM.secs_hhmmss(smovie_end[i]) + '/' + (KM.pad_out2(smovie_eitems[i] - 1)) + '.jpg'};

		}
	    }

	    return {valid: false, frame: 0, secs: 0, index: 0, fq_image_name: ''};
	}
    }


    function prev_snap_frame(date, cam) {

	// A function that calculates the prev avaliable snapshot and returns an
	// object 'obj'
	//
	// expects :
	// 'date'              ... the displayed date
	// 'cam'               ... the displayed camera
	//
	// returns :
	// 'obj.valid'         ... bool true if prev snapshot is avaliable
	// 'obj.secs'          ... the seconds count for the prev snapshot
	// 'obj.fq_image_name' ... the fully qualified prev snapshot image name

	var calc_secs = 99999; // invalid secs to start
	var disp_secs = display_secs; // local copy
	for (var i = snap_init.length - 1; i > -1; i--) {

	    if (snap_init[i] < disp_secs) {

		// if 'intvl' is zero jump display_secs backwards and continue
		if (snap_intvl[i] === 0) {
		    disp_secs = Math.max(0, snap_init[i] - 1);
		    continue;
		}

		var strip = disp_secs - snap_init[i];
		var ratio = strip / snap_intvl[i];
		// awkward code to ensure prev no matter what the ratio
		if (parseInt(ratio, 10) === ratio) {
		    ratio = parseInt(ratio, 10) - 1;
		} else {
		    ratio = parseInt(ratio, 10);
		}

		var calc_secs = snap_init[i] + ratio * snap_intvl[i];
		break;
	    }
	}
	if (calc_secs <= 86400) { // < 60 * 60 * 24 secs
	    return {valid: true, secs: calc_secs,
	    fq_image_name: '/images_dbase/' + date + '/' + KM.pad_out2(cam) + '/snap/' + KM.secs_hhmmss(calc_secs) + '.jpg'};
	} else {
	    return {valid: false, secs: 0, fq_image_name: ''};
	}
    }


    function prev_event() {

	// A function that searches for the prev avaliable event and calls
	// 'play_forward'
	//
	// expects :
	//
	// returns :
	//

	KM.session_id.current++;
	if (movie_show) {
	    for (var i = movie_start.length; i > -1; i--) {
		if (movie_end[i] < display_secs) {
		    play_forward(movie_start[i]);
		    break;
		}
	    }

	} else if (smovie_show) {
	    for (var i = smovie_start.length; i > -1; i--) {
		if (smovie_end[i] < display_secs) {
		    play_forward(smovie_start[i]);
		    break;
		}
	    }
	}
    }


    function show_movie_frame(movie_obj, session_id, callback) {

	// A function that displays the selected movie frame
	//
	// expects :
	// 'movie_obj'  ... the movie object
	// 'session_id' ... the current 'session_id'
	// 'callback'   ... the function to be called on completion
	//
	// returns :
	//

	// abort cleanly if new session
	if (session_id === KM.session_id.current) {
	    movie_id.GotoFrame(movie_obj.frame);
	    KM.cull_timeout_ids(KM.ARCH_LOOP);
	    KM.add_timeout_id(KM.ARCH_LOOP, setTimeout(function () {callback(movie_obj); }, 1));
	}
    }


    function reset_swf_html(movie_obj, session_id, callback) {

	// A closure that sets the movie (swf) HTML, and displays the image
	// nearest to 'movie_obj.secs', once completed 'callback' is called
	//
	// expects :
	// 'movie_obj'  ... the movie object
	// 'session_id' ... the current 'session_id'
	// 'callback'   ... the function to be called on completion
	//
	// returns :
	//

	gen_movie_obj(movie_obj, session_id);
	if (session_id === KM.session_id.current) {
	    //disable_button_bar(); // enabled by 'arch_movie_loaded', yuk !
	    movie_obj_loaded(movie_obj, session_id, callback);
	}

	function gen_movie_obj(movie_obj, session_id) {
	    // generate the troublesome movie object
	    var date = dates[document.getElementById('date_select').selectedIndex];
	    var camera = cameras[document.getElementById('date_select').selectedIndex][document.getElementById('camera_select').selectedIndex];
	    var file_ext = movie_ext[movie_obj.index];
	    var name = 'images_dbase/' + date + '/' + KM.pad_out2(camera) + '/movie/' + KM.secs_hhmmss(movie_start[movie_obj.index]) + file_ext;

	    document.getElementById('display_html').innerHTML = '<div id="movie" style="overflow:hidden;background-color:#000000;width:100%;height:100%"> </div>';
		


		function dump(obj, objName){
			var result = "";
			for (var i in obj) // обращение к свойствам объекта по индексу
			result += objName + "." + i + " = " + obj[i] + "<br />\n";
			return result;
		}
		
		
		movie_duration=movie_end[movie_obj.index]-movie_start[movie_obj.index]+3;
		cur_event_secs=movie_obj.secs;
		next_event_secs=movie_obj.secs;
		if (movie_obj.valid)
		{
			next_event_secs=movie_start[movie_obj.index+1];
		}
		update_title_clock(movie_obj.secs);

		//flv
		switch (file_ext) {
		case '.swf':
			document.getElementById('movie').innerHTML = '<div id="player"> </div>';
			document.getElementById('player').innerHTML = "<p><a href=\""+document.URL+name+"\" target='_blank'>DOWNLOAD: "+name.split(/(\\|\/)/g).pop()+"</a></p>";

			var flashvars = {};
			var fparams = {allowFullScreen:'true', allowscriptaccess: 'always', quality:'best', bgcolor:'#000000', scale:'exactfit'};
			var fattributes = {id: 'movie_id', name: 'movie_id'};
			swfobject.embedSWF(name, 'player', backdrop_width - 5, backdrop_height - 5, '9.124.0', 'expressInstall.swf', flashvars, fparams, fattributes);
			movie_id = document.getElementById('movie_id');
			break;
			
		default:
			video_player({id:'movie', name: name, width: backdrop_width-5, height: backdrop_height-5});
			if (document.getElementById('html5player')) {
				var html5player = document.getElementById('html5player');
				html5player.onloadeddata=html5VideoLoaded;				
				html5player.onseeked=html5VideoScrolled;
				html5player.ontimeupdate=html5VideoProgress;
				html5player.onended=html5VideoFinished;
				html5player = null;
			} 			
			break;		
		}
	}



	function movie_obj_loaded(movie_obj, session_id, callback) {
	    // wait until movie object is loaded then set the frame and call
	    // 'callback'

	    try {
	    if (movie_id.PercentLoaded() === 100) {

		if (KM.browser.browser_IE) { // love IE :)
		    movie_obj.frames = movie_id.TotalFrames;
		} else {
		    movie_obj.frames = movie_id.TotalFrames();
		}

		// special case, start of movie
		if (movie_obj.secs === movie_start[movie_obj.index]) {
		    movie_id.GotoFrame(1);
		    movie_obj.frame = 1;
		}

		// special case, end of movie
		else if (movie_obj.secs === movie_end[movie_obj.index]) {
		    movie_id.GotoFrame(movie_obj.frames);
		    movie_obj.frame = movie_obj.frames;
		}

		// else calculate it !
		else {
		    var offset = movie_obj.secs - movie_start[movie_obj.index];
		    movie_obj.frame = parseInt(movie_obj.frames * ((movie_end[movie_obj.index] - movie_start[movie_obj.index]) / offset), 10);
		    movie_id.GotoFrame(movie_obj.frame);
		}

		enable_button_bar();

		// calculation of delay else this 1st frame is overwritten too quick
		var delay = (1000 / movie_fps[movie_obj.index]) / play_accel_mult[play_accel - 4];

		// if new session, do nothing, no callback
		if (session_id === KM.session_id.current) {
		    KM.cull_timeout_ids(KM.ARCH_LOOP);
		    KM.add_timeout_id(KM.ARCH_LOOP, setTimeout(function () {callback(movie_obj); }, delay));
		}

	    } else {
		KM.add_timeout_id(KM.ARCH_LOOP, setTimeout(function () {movie_obj_loaded(movie_obj, session_id, callback); }, 10));
	    }
	  } catch (e) {}
	}
    }


    function display_snap(snap_obj, session_id, callback) {

	// A function that displays a jpeg at 'fq_image_name', when displayed it
	// 'callback' is called
	//
	// expects:
	// 'snap_obj'    ... the movie object
	// 'session_id'  ... the current session id
	// 'callback'    ... the function to be called on completion.
	//
	// returns:
	//

	var callback2 = display_snap2;
	cache_image(snap_obj.fq_image_name, callback2);

	function display_snap2(success) {
	    if (success) { // if !success ignore, better a hesitation than a white flash
		show_ptr++;
		show_ptr = (show_ptr > 3)?0:show_ptr;
		show_jpegs[show_ptr] = snap_obj.fq_image_name;
		// as close to .src as possible to stop javascript errors
		if (session_id === KM.session_id.current) {
			try {
				document.getElementById('image').src = show_jpegs[show_ptr];
			} catch (e) {}
		}
	    }

	    // break the loop here if session_id has moved on
	    if (session_id === KM.session_id.current) {
		KM.kill_timeout_ids(KM.ARCH_LOOP);
		KM.add_timeout_id(KM.ARCH_LOOP, setTimeout(function () {callback(snap_obj); }, 1));
	    }
	}

    }


    KM.display_smovie = display_snap;

	// A function that displays a jpeg at 'fq_image_name', when displayed it
	// 'callback' is called
	//
	// expects:
	// 'movie_obj'   ... the movie object
	// 'session_id'  ... the current session id
	// 'callback'    ... the function to be called on completion.
	//
	// returns:
	//


    function reset_jpeg_html() {

	// A function that sets the jpeg HTML
	//
	// expects:
	//
	// returns:

	var fq_image_name = '/images/ncam.png';
	var html = '<img src=' + fq_image_name + ' id="image" style="width:100%;height:99%" alt="" />';
	document.getElementById('display_html').innerHTML = html;
    }


    function cache_image(fq_image_name, callback) {

	// A function that caches a jpeg at 'fq_image_name', when cached
	// 'callback' is called
	//
	// expects:
	// 'fq_image_name' ... the fully qualified image name
	// 'callback'      ... the function to be called on completion.
	//
	// returns:
	// 'bool'          ... cache successful

	cache_ptr++; // caching fq_image_names as a browser workaround
	cache_ptr = (cache_ptr > 3)?0:cache_ptr;

	// start the timeout clock ...
	KM.add_timeout_id(KM.ARCH_LOOP, setTimeout(function () {callback(false); }, 5000));

	cache_jpeg[cache_ptr].onerror = function () {
	    KM.kill_timeout_ids(KM.ARCH_LOOP); // kill the timeout clock
	    KM.add_timeout_id(KM.ARCH_LOOP, setTimeout(function () {callback(false); }, 1));
	};

	cache_jpeg[cache_ptr].onload = function () {
	    KM.kill_timeout_ids(KM.ARCH_LOOP); // kill the timeout clock
	    KM.add_timeout_id(KM.ARCH_LOOP, setTimeout(function () {callback(true); }, 1));
	};
	try {
		cache_jpeg[cache_ptr].src = fq_image_name;
	} catch (e) {}
    }


    function populate_dates_cams_dbase(callback, session_id) {

	// A closure that populates the dates cameras, titles, movie_flags,
	// smovie_flags, and snap_flags archive database then executes the
	// 'callback' object.
	//
	// this is a near duplicate of 'populate_frame_dbase' but seperate to
	// avoid 'retry' and 'got_coded_str' clashes
	//
	// expects :
	// 'session_id'  ... the current session id
	// 'callback' ...   the callback object
	//
	// returns :
	//

	var got_coded_str = false;
	function request() {
	    // repeat 'xmlHttp' until data blob received from 'xmlHttp_arch.py'
	    // local 'xmlHttp' object to enable multiple instances, one for each
	    // function call.
	    var xmlHttp = KM.get_xmlHttp_obj();
	    xmlHttp.onreadystatechange = function () {
		if (xmlHttp.readyState === 4) {
		    xmlHttp.onreadystatechange = null; // plug memory leak
		    var coded_str = xmlHttp.responseText.trim();
		    // final integrity check - if this data gets corrupted we are
		    // in a world of hurt ...
		    // 'coded_str.substr(coded_str.length - 4)' due to IE bug !
		    if (parseInt(coded_str.substr(coded_str.length - 8), 10) === coded_str.length - 13 &&
		    KM.session_id.current === session_id) {
			got_coded_str = true;
			decode_coded_str(coded_str);
		    }
		}
	    };
	    var cams='';
	    for (var c=1;c<KM.www_rc.feed_enabled.length;c++) {
		if (KM.www_rc.feed_enabled[c]) {
			cams+=c+',';
		}
	    }
	    cams=cams.slice(0,-1);
	    xmlHttp.open('GET', '/cgi_bin/xmlHttp_arch.php?date=00000000&cam=0&func=avail&cams='+cams+'&rnd=' + new Date().getTime(), true);
	    xmlHttp.send(null);
	}

	function retry() {
	    if (!got_coded_str) {
		request();
		KM.add_timeout_id(KM.ARCH_LOOP, setTimeout(function () {retry(); }, 5000));
	    }
	}

	function decode_coded_str(coded_str) {
	    // clear lists
	    dates.length =        0;
	    cameras.length =      0;
	    titles.length =       0;
	    movie_flags.length =  0;
	    smovie_flags.length = 0;
	    snap_flags.length =   0;

	    var split1 = coded_str.split('$');

	    // loop through dates, 'date.length - 1' to strip '$chk:'
	    for (var i = 0; i < split1.length - 2; i++) {
		var split2 = split1[i + 1].split('#');
		dates[i] = split2[0];

		// prep lists to be multi-dimensional
		cameras[i] =      [];
		titles[i] =       [];
		movie_flags[i] =  [];
		smovie_flags[i] = [];
		snap_flags[i] =   [];

		// loop through data
		var k = 0;
		// -1 to remove last '#' slot after 'title'
		for (var j = 1; j < split2.length - 1; j = j + 5) {
		    cameras[i][k] = parseInt(split2[j], 10);
		    movie_flags[i][k] =  (split2[j + 1] === '1');
		    smovie_flags[i][k] = (split2[j + 2] === '1');
		    snap_flags[i][k] =   (split2[j + 3] === '1');
		    titles[i][k] =        split2[j + 4];
		    k++;
		}

	    }
	    dates.reverse();
	    cameras.reverse();
	    titles.reverse();
	    movie_flags.reverse();
	    smovie_flags.reverse();
	    snap_flags.reverse();
	    KM.kill_timeout_ids(KM.ARCH_LOOP);
	    callback(session_id);
	}
	retry();
    }

    function populate_frame_dbase(callback, date, camera, session_id) {

	// A closure that populates the frame archive database given the 'date'
	// and 'camera'. The degree of population depends on the three
	// 'current show' variables.
	//
	// this is a near duplicate of 'populate_dates_cams_dbase' but seperate
	// to avoid 'retry' and	'got_coded_str' clashes
	//
	// expects :
	// 'date' ...   the selected date
	// 'camera' ... the selected camera
	// 'session_id'  ... the current session id
	//
	// returns :
	//

	var got_coded_str = false;
	function request() {
	    // repeat 'xmlHttp' until data blob received from 'xmlHttp_arch.py'
	    // local 'xmlHttp' object to enable multiple instances, one for each
	    // function call.
	    var xmlHttp = KM.get_xmlHttp_obj();
	    xmlHttp.onreadystatechange = function () {
		if (xmlHttp.readyState === 4) {
		    xmlHttp.onreadystatechange = null; // plug memory leak
		    var coded_str = xmlHttp.responseText.trim();
		    // final integrity check - if this data gets corrupted we are
		    // in a world of hurt ...
		    // 'coded_str.substr(coded_str.length - 4)' due to IE bug !
		    if (parseInt(coded_str.substr(coded_str.length - 8), 10) === coded_str.length - 13
		    && KM.session_id.current === session_id) {
			got_coded_str = true;
			decode_coded_str(coded_str);
		    }
		}
	    };
	    xmlHttp.open('GET', '/cgi_bin/xmlHttp_arch.php?date=' + date + '&cam=' + camera + '&func=index' + '&rnd=' + new Date().getTime(), true);
	    xmlHttp.send(null);
	}

	function retry() {
	    if (!got_coded_str) {
		request();
		KM.add_timeout_id(KM.ARCH_LOOP, setTimeout(function () {retry(); }, 5000));
	    }
	}
	retry();



	function decode_coded_str(coded_str) {
	    // clear lists
	    snap_init.length =     0;
	    snap_intvl.length =    0;
	    movie_start.length =   0;
	    movie_ext.length =     0;
	    movie_end.length =     0;
	    movie_fps.length =     0;
	    smovie_start.length =  0;
	    smovie_sitems.length = 0;
	    smovie_end.length =    0;
	    smovie_eitems.length = 0;
	    smovie_fps.length =    0;

	    var split1 = coded_str.split('@');

	    var movies =  split1[0].split('$');
	    var smovies = split1[1].split('$');
	    var snaps =   split1[2].split('$');

	    // 'movie' data so polulate the 'archive.movie_start',
	    // 'archive.movie_end', 'archive.movie_fps'lists
	    for (var i = 0; i < movies.length - 1; i++) {
		var split2 = movies[i + 1].split('#');
		movie_start[i]  = hhmmss_secs(split2[0]);
		movie_fps[i] =       parseInt(split2[1], 10);
		movie_end[i] =    hhmmss_secs(split2[2]);
		if (split2.length==4) {
		    movie_ext[i] = split2[3];
		}
	    }

	    // 'smovie' data so polulate the 'archive.smovie_start',
	    // 'archive.smovie_sitems', 'archive.smovie_end',  'archive.smovie_eitems',
	    // 'archive.smovie_fps' lists
	    for (var i = 0; i < smovies.length - 1; i++) {
		split2 = smovies[i + 1].split('#');
		smovie_start[i] =  hhmmss_secs(split2[0]);
		smovie_sitems[i] = parseInt(split2[1], 10);
		smovie_fps[i] =    parseInt(split2[2], 10);
		smovie_end[i] =    hhmmss_secs(split2[3]);
		smovie_eitems[i] = parseInt(split2[4], 10);
	    }

	    // 'snap' data so populate the 'archive.snapshot_init' and
	    // 'archive.snapshot_intvl' lists. extra -1 to remove '$chk:'
	    for (var i = 0; i < snaps.length - 2; i++) {
		split2 = snaps[i + 1].split('#');
		snap_init[i]  =  hhmmss_secs(split2[0]);
		snap_intvl[i] = parseInt(split2[1], 10);
	    }

	    KM.kill_timeout_ids(KM.ARCH_LOOP);
	    callback();

	    function hhmmss_secs(hhmmss) {
		// convert HHMMSS string to an integer number
		hhmmss = KM.pad_out6(hhmmss);
		var hh=parseInt(hhmmss.slice(0, 2), 10);
		var mm=parseInt(hhmmss.slice(2, 4), 10);
		var ss=parseInt(hhmmss.slice(4, 6), 10);
		return (hh * 60 * 60) + (mm * 60) + ss;
	    }
	}
    }
    return {
	init: init,
	change_date: change_date,
	change_camera: change_camera,
	change_view: change_view,
	change_mode: change_mode,
	bar_button_clicked: bar_button_clicked,
	event_clicked: KM.event_clicked,
	tline_clicked: tline_clicked,
	update_title_clock: update_title_clock
    };
}();

KM.display_archive = KM.display_archive_.init;
KM.arch_change_date = KM.display_archive_.change_date;
KM.arch_change_camera = KM.display_archive_.change_camera;
KM.arch_change_view = KM.display_archive_.change_view;
KM.arch_change_mode = KM.display_archive_.change_mode;
KM.arch_bar_button_clicked = KM.display_archive_.bar_button_clicked;
KM.arch_event_clicked = KM.display_archive_.event_clicked;
KM.arch_tline_clicked = KM.display_archive_.tline_clicked;
KM.arch_play_next=KM.display_archive_.play_next;
KM.update_title_clock=KM.display_archive_.update_title_clock;


/* ****************************************************************************
Log display - Log Code.

Displays logs with critical information highlighted
**************************************************************************** */


KM.display_logs = function () {

    // A function that caches log information and displays it with critical
    // information highlighted
    //
    // expects:
    //
    // returns:
    //

    KM.session_id.current++;
    var session_id = KM.session_id.current;
	var backdrop_width = KM.browser.main_display_width * 0.8;
	var backdrop_height = KM.browser.main_display_height - 75;

	var button_width = backdrop_width / 7;


    document.getElementById('main_display').innerHTML = '' +

    '<div class="title" style="width:'+backdrop_width+'px;">' +
	'kmotion: Logs' +
    '</div>' +

    '<div class="divider" >' +
        '<img src="images/logs_divider_color.png" alt="" style="width:'+backdrop_width+'px;">' +
    '</div>' +

    '<div class="logs_backdrop" id="logs_html" style="width:'+backdrop_width+'px;height:'+backdrop_height+'px;padding-left:10px">' +
    '<p style="text-align: center">Downloading Logs ...</p>' +
    '</div>';

    function show_logs(dblob) {
        // show the logs
        var events = dblob.split('$');
        events.pop(); // remove the 'ck' line
        var log_html = '';
        for (var i = 1; i < events.length; i++) {
	    if (events[i].indexOf('Incorrect') !== -1 || events[i].indexOf('Deleting current') !== -1) {
                log_html += '<span style="color:' + KM.RED + ';">' + format_event(events[i]) + '</span>';
            }
            else if (events[i].indexOf('Deleting') !== -1 || events[i].indexOf('Initial') !== -1) {
                log_html +=  '<span style="color:' + KM.BLUE + ';">' + format_event(events[i]) + '</span>';
            }
            else {
                log_html += format_event(events[i]);
            }
        }
        document.getElementById('logs_html').innerHTML = log_html;
    }

    function format_event(event) {
        // string format an event
        var event_split = event.split('#');
        return 'Date : ' + event_split[0] + '&nbsp;&nbsp;Time : ' +
        event_split[1] + '&nbsp;&nbsp;Event : ' + event_split[2] + '<br>';
    }

    var got_logs = false;
    function request() {
        // repeat 'xmlHttp' until data blob received from 'xmlHttp_logs.py'
        // local 'xmlHttp' object to enable multiple instances, one for each
        // function call.
        var xmlHttp = KM.get_xmlHttp_obj();
        xmlHttp.onreadystatechange = function () {
            if (xmlHttp.readyState === 4) {
                xmlHttp.onreadystatechange = null; // plug memory leak
                var dblob = xmlHttp.responseText.trim();
                // final integrity check - if this data gets corrupted we are
                // in a world of hurt ...
                // 'dblob.substr(dblob.length - 4)' due to IE bug !
                if (parseInt(dblob.substr(dblob.length - 8), 10) === dblob.length - 12 &&
                KM.session_id.current === session_id) {
                    got_logs = true;
		    KM.cull_timeout_ids(KM.LOGS);
                    show_logs(dblob);
                }
            }
        };
        xmlHttp.open('GET', '/cgi_bin/xmlHttp_logs.php' + '?rnd=' + new Date().getTime(), true);
        xmlHttp.send(null);
    }

    function retry() {
        if (!got_logs) {
            request();
            KM.add_timeout_id(KM.LOGS, setTimeout(function () {retry(); }, 5000));
        }
    }
    retry();
};


/* ****************************************************************************
Main display - Config - Misc code

Miscellaneous code that provides general closures and functions for config
**************************************************************************** */


KM.conf_config_track = function() {

    // A closure that tracks changes to the local config and when needed
    // synchronises these changes with 'www_rc' and requests config reloads.
    // Only synchronise changed sections to improve performance.
    //
    // Has the ability to request a single PTZ daemon config reload or a
    // complete reload of all daemons including motion once the changes have
    // been synchronised. If a complete reload is requested alerts the user of
    // a possible 'video' freeze.caches log information and displays it with
    // critical information highlighted
    //
    // expects:
    //
    // returns:
    //

    var misc_modified =       false;
    var display_modified =    false; // the 'display select' and color theme
    var pw_modified =         false;
    var mask_modified =       KM.fill_arr(['pad'], false, max_feed);
    var feed_modified =       KM.fill_arr(['pad'], false, max_feed);
    var ptz_misc_modified =   KM.fill_arr(['pad'], false, max_feed);
    var ptz_en_tt_modified =  KM.fill_arr(['pad'], false, max_feed);
    var sched_modified =      ['pad', false, false, false, false, false,
        false, false, false];
    var except_modified =     ['pad', false, false, false, false];
    var warning_msg = false;

    var coded_str = '';

    function bool_num(flag) {
        if (flag) return 1;
        return 0;
    }

    return {

	// the misc config screen has been modified
	misc_modified: function() {
	    misc_modified = true;
	},

	// the config password has been modified
	pw_modified: function() {
	    pw_modified = true;
	},

	// the color scheme, camera layout or selected layout has been modified
	display_modified: function() {
	    display_modified = true;
	},

	// the feeds has been modified
	feed_modified: function(i) {
	    feed_modified[i] = true;
	    warning_msg = true;
	},

	// the feeds masks have been modified
	mask_modified: function(i) {
	    mask_modified[i] = true;
	    warning_msg = true;
	},

	// the ptz enable or track types have been modified
	ptz_en_tt_modified: function(i) {
	    ptz_en_tt_modified[i] = true;
	    warning_msg = true;
	},

	// the ptz misc options have been modified
	ptz_misc_modified: function(i) {
	    ptz_misc_modified[i] = true;
	},

	// the schedules have been modified
	sched_modified: function(i) {
	    sched_modified[i] = true;
	},

	// the schedule exceptions have been modified
	except_modified: function(i) {
	    except_modified[i] = true;
	},

	reset: function() {
	    misc_modified =       false;
	    pw_modified =         false;
	    mask_modified =       KM.fill_arr(['pad'], false, max_feed),
	    feed_modified =       KM.fill_arr(['pad'], false, max_feed),
	    ptz_misc_modified =   KM.fill_arr(['pad'], false, max_feed),
	    ptz_en_tt_modified =  KM.fill_arr(['pad'], false, max_feed),
	    sched_modified =      ['pad', false, false, false, false, false,
            false, false, false];
	    except_modified =     ['pad', false, false, false, false];
	    display_modified =    false; // the 'display select' and color theme
	    warning_msg = false;
	    coded_str = '';
	},

	sync: function() {
	    // sync 'www_rc' with server 'www_rc'
	    if (misc_modified) {
		// interleave enabled
		coded_str += '$ine:' + bool_num(KM.www_rc.interleave);
		// full screen enabled
		coded_str += '$fse:' + bool_num(KM.www_rc.full_screen);
		// low bandwidth enabled
		coded_str += '$lbe:' + bool_num(KM.www_rc.low_bandwidth);
		// low cpu enabled
		coded_str += '$lce:' + bool_num(KM.www_rc.low_cpu);
		// skip archive frames enabled
		coded_str += '$skf:' + bool_num(KM.www_rc.skip_frames);
		// archive button enabled
		coded_str += '$are:' + bool_num(KM.www_rc.archive_button_enabled);
		// stats button enabled
		coded_str += '$lge:' + bool_num(KM.www_rc.logs_button_enabled);
		// config bitton enabled
		coded_str += '$coe:' + bool_num(KM.www_rc.config_button_enabled);
		// function button enabled
		coded_str += '$fue:' + bool_num(KM.www_rc.func_button_enabled);
		// spare button enabled
		coded_str += '$spa:' + bool_num(KM.www_rc.msg_button_enabled);
		// about button enabled
		coded_str += '$abe:' + bool_num(KM.www_rc.about_button_enabled);
		// logout button enabled
		coded_str += '$loe:' + bool_num(KM.www_rc.logout_button_enabled);
		//hide_button_bar
		coded_str += '$hbb:' + bool_num(KM.www_rc.hide_button_bar);
		// secure config
		coded_str += '$sec:' + bool_num(KM.www_rc.secure);
	    }

	    if (pw_modified) {
		// config password hash
		coded_str += '$coh:' + KM.www_rc.config_hash;
	    }

	    for (var i = 1; i < max_feed; i++) {
		if (mask_modified[i] === true) {
		    // feed mask
		    coded_str += '$fma' + i + ':' + KM.www_rc.feed_mask[KM.config.camera];
		}
	    }

	    for (var i = 1; i < max_feed; i++) {
		if (feed_modified[i] === true) {
		    // feed enabled
		    coded_str += '$fen' + i + ':' + bool_num(KM.www_rc.feed_enabled[KM.config.camera]);
		    // feed pal
		    coded_str += '$fpl' + i + ':' + bool_num(KM.www_rc.feed_pal[KM.config.camera]);
		    // feed device
		    coded_str += '$fde' + i + ':' + KM.www_rc.feed_device[KM.config.camera];
		    // feed input
		    coded_str += '$fin' + i + ':' + KM.www_rc.feed_input[KM.config.camera];
		    // feed url
		    coded_str += '$ful' + i + ':' + KM.expand_chars(KM.www_rc.feed_url[KM.config.camera]);
		    // feed proxy
		    coded_str += '$fpr' + i + ':' + KM.expand_chars(KM.www_rc.feed_proxy[KM.config.camera]);
		    // feed login name
		    coded_str += '$fln' + i + ':' + KM.expand_chars(KM.www_rc.feed_lgn_name[KM.config.camera]);
		    // feed login password
		    coded_str += '$flp' + i + ':' + KM.expand_chars(KM.www_rc.feed_lgn_pw[KM.config.camera]);
		    // feed width
		    coded_str += '$fwd' + i + ':' + KM.www_rc.feed_width[KM.config.camera];
		    // feed height
		    coded_str += '$fhe' + i + ':' + KM.www_rc.feed_height[KM.config.camera];
		    // feed name
		    coded_str += '$fna' + i + ':' + KM.expand_chars(KM.www_rc.feed_name[KM.config.camera]);
		    // feed show box
		    coded_str += '$fbo' + i + ':' + bool_num(KM.www_rc.feed_show_box[KM.config.camera]);
		    // feed fps
		    coded_str += '$ffp' + i + ':' + KM.www_rc.feed_fps[KM.config.camera];
		    // feed snap enabled
		    coded_str += '$fpe' + i + ':' + bool_num(KM.www_rc.feed_snap_enabled[KM.config.camera]);
		    // feed snap interval
		    coded_str += '$fsn' + i + ':' + KM.www_rc.feed_snap_interval[KM.config.camera];
		    // feed frame enabled
		    coded_str += '$ffe' + i + ':' + bool_num(KM.www_rc.feed_smovie_enabled[KM.config.camera]);
		    // feed ffmpeg enabled
		    coded_str += '$fme' + i + ':' + bool_num(KM.www_rc.feed_movie_enabled[KM.config.camera]);
		}
	    }

	    if (display_modified) {
		// user settings
		//coded_str += '$usr:%CURRENT_USER%';
		for (var i = 1; i < 13; i++) {
		    // display feeds
		    coded_str += '$dif' + i + ':' +
		    KM.www_rc.display_cameras[i].slice(1, KM.www_rc.display_cameras[i].length);
		}
		// color select
		coded_str += '$col:' + KM.www_rc.color_select;
		// display select
		coded_str += '$dis:' + KM.www_rc.display_select;
	    }

	    for (var i = 1; i < max_feed; i++) {
		if (ptz_en_tt_modified[i] === true) {
		    // ptz enabled
		    coded_str += '$pte' + i + ':' + bool_num(KM.www_rc.ptz_enabled[i]);
		    // enable or track type modified
		    coded_str += '$ptt' + i + ':' + KM.www_rc.ptz_track_type[i];
		}
	    }

	    for (var i = 1; i < max_feed; i++) {
		if (ptz_misc_modified[i] === true) {
		    // ptz step x
		    coded_str += '$psx' + i + ':' + KM.www_rc.ptz_step_x[i];
		    // ptz step y
		    coded_str += '$psy' + i + ':' + KM.www_rc.ptz_step_y[i];
		    // ptz calibrate first
		    coded_str += '$ptc' + i + ':' + bool_num(KM.www_rc.ptz_calib_first[i]);
		    // ptz servo settle
		    coded_str += '$pts' + i + ':' + KM.www_rc.ptz_servo_settle[i];
		    // ptz park enabled
		    coded_str += '$ppe' + i + ':' + bool_num(KM.www_rc.ptz_park_enabled[i]);
		    // ptz park delay
		    coded_str += '$ppd' + i + ':' + KM.www_rc.ptz_park_delay[i];
		    // ptz park x
		    coded_str += '$ppx' + i + ':' + KM.www_rc.ptz_park_x[i];
		    // ptz park y
		    coded_str += '$ppy' + i + ':' + KM.www_rc.ptz_park_y[i];
		    // ptz preset 1 x
		    coded_str += '$p1x' + i + ':' + KM.www_rc.ptz_preset1_x[i];
		    // ptz preset 1 y
		    coded_str += '$p1y' + i + ':' + KM.www_rc.ptz_preset1_y[i];
		    // ptz preset 2 x
		    coded_str += '$p2x' + i + ':' + KM.www_rc.ptz_preset2_x[i];
		    // ptz preset 2 y
		    coded_str += '$p2y' + i + ':' + KM.www_rc.ptz_preset2_y[i];
		    // ptz preset 3 x
		    coded_str += '$p3x' + i + ':' + KM.www_rc.ptz_preset3_x[i];
		    // ptz preset 3 y
		    coded_str += '$p3y' + i + ':' + KM.www_rc.ptz_preset3_y[i];
		    // ptz preset 4 x
		    coded_str += '$p4x' + i + ':' + KM.www_rc.ptz_preset4_x[i];
		    // ptz preset 4 y
		    coded_str += '$p4y' + i + ':' + KM.www_rc.ptz_preset4_y[i];
		}
	    }

	    for (var i = 1; i < 8; i++) {
		if (ptz_misc_modified[i] === true) {
		    // ptz step x
		    coded_str += '$psx' + i + ':' + KM.www_rc.ptz_step_x[i];
		    // ptz step y
		    coded_str += '$psy' + i + ':' + KM.www_rc.ptz_step_y[i];
		}
	    }

	    for (var i = 1; i < 8; i++) {
		if (sched_modified[i] === true) {
		    // schedule exception
		    coded_str += '$sex' + i + ':' + KM.www_rc.sched_except[i];
		    // schedule time line 1
		    coded_str += '$st1' + i + ':' + KM.www_rc.sched_tline1[index];
		    // schedule time line 2
		    coded_str += '$st2' + i + ':' + KM.www_rc.sched_tline2[index];
		    // schedule time line 3
		    coded_str += '$st3' + i + ':' + KM.www_rc.sched_tline3[index];
		    // schedule time line 4
		    coded_str += '$st4' + i + ':' + KM.www_rc.sched_tline4[index];
		    // schedule time line 5
		    coded_str += '$st5' + i + ':' + KM.www_rc.sched_tline5[index];
		    // schedule time line 6
		    coded_str += '$st6' + i + ':' + KM.www_rc.sched_tline6[index];
		    // schedule time line 7
		    coded_str += '$st7' + i + ':' + KM.www_rc.sched_tline7[index];
		}
	    }

	    for (var i = 1; i < 4; i++) {
		if (except_modified[i] === true) {
		    // exception time line 1 dates
		    coded_str += '$ed1' + i + ':' + KM.www_rc.except_tline1_dates[index];
		    // exception time line 2 dates
		    coded_str += '$ed2' + i + ':' + KM.www_rc.except_tline2_dates[index];
		    // exception time line 3 dates
		    coded_str += '$ed3' + i + ':' + KM.www_rc.except_tline3_dates[index];
		    // exception time line 4 dates
		    coded_str += '$ed4' + i + ':' + KM.www_rc.except_tline4_dates[index];
		    // exception time line 5 dates
		    coded_str += '$ed5' + i + ':' + KM.www_rc.except_tline5_dates[index];
		    // exception time line 6 dates
		    coded_str += '$ed6' + i + ':' + KM.www_rc.except_tline6_dates[index];
		    // exception time line 7 dates
		    coded_str += '$ed7' + i + ':' + KM.www_rc.except_tline7_dates[index];

		    // exception time line 1
		    coded_str += '$et1' + i + ':' + KM.www_rc.except_tline1[index];
		    // exception time line 2
		    coded_str += '$et2' + i + ':' + KM.www_rc.except_tline2[index];
		    // exception time line 3
		    coded_str += '$et3' + i + ':' + KM.www_rc.except_tline3[index];
		    // exception time line 4
		    coded_str += '$et4' + i + ':' + KM.www_rc.except_tline4[index];
		    // exception time line 5
		    coded_str += '$et5' + i + ':' + KM.www_rc.except_tline5[index];
		    // exception time line 6
		    coded_str += '$et6' + i + ':' + KM.www_rc.except_tline6[index];
		    // exception time line 7
		    coded_str += '$et7' + i + ':' + KM.www_rc.except_tline7[index];
		}
	    }

	    var coded_len = coded_str.length;
	    var zero_pad = '00000000'.substring(0, 8 - (coded_len + '').length);
	    coded_str += '$chk:' + zero_pad + coded_len;
		//console.log(coded_str);
	    if (coded_len !== 0) { // ie empty string
		var xmlHttp = KM.get_xmlHttp_obj();
		xmlHttp.open('POST', '/cgi_bin/xmlHttp_settings_wr.php');
		xmlHttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xmlHttp.setRequestHeader("Content-length", coded_str.length);
		xmlHttp.setRequestHeader("Connection", "close");
		xmlHttp.send('dblob=' + coded_str);
	    }

	    if (warning_msg) {
	    alert('The current synchronisation with the remote server\n\
involves reloading of the motion daemon configuration.\n\nDuring the reload \
kmotion will experience temporary\nvideo freezing.');
	    KM.conf_config_track.reset();
	    }
	}
    }
}();


KM.conf_error_daemon = function (session_id) {

    // A closure that acts as a daemon updateing 'KM.config.error_str' with
    // motions output every 2 seconds. If errors are detected in this string
    // enable the 'Motion Errors' button and colour it red.
    //
    // expects:
    //
    // returns:
    //

    KM.add_timeout_id(KM.ERROR_DAEMON, setTimeout(function () {reload(); }, 1));

    function request() {
        // local 'xmlHttp' object to enable multiple instances, one for each
        // function call.
        var xmlHttp = KM.get_xmlHttp_obj();
        xmlHttp.onreadystatechange = function () {
            if (xmlHttp.readyState === 4) {
                xmlHttp.onreadystatechange = null; // plug memory leak
                var data = xmlHttp.responseText.trim();
                // final integrity check - if this data gets corrupted we are
                // in a world of hurt ...
                // 'data.substr(data.length - 4)' due to IE bug !
                // possibly large string so 6 digit checksum
                if (parseInt(data.substr(data.length - 8), 10) === data.length - 12 &&
                KM.session_id.current === session_id) {
                    KM.config.error_str = data.substr(0, data.length - 12);

		    // scan the string looking for errors
		    var error_lines = KM.config.error_str.split("\n");
		    var error_flag = false;
		    for (var i = 0; i < error_lines.length; i++) {
			if (error_lines[i].search(KM.config.error_search_str) !== -1) {
			    error_flag = true;
			}
		    }
		    if (error_flag) {
			KM.conf_highlight_error_button(); // control the 'server error' button
		    } else {
			//KM.conf_disable_error_button();
		    }
		}
	    }
	};
	xmlHttp.open('GET', '/cgi_bin/xmlHttp_out.php' + '?rnd=' + new Date().getTime(), true);
	xmlHttp.send(null);
    }

    function reload() {
        request();
        // check for current session id
        if (KM.session_id.current === session_id) {
            KM.cull_timeout_ids(KM.ERROR_DAEMON);
            KM.add_timeout_id(KM.ERROR_DAEMON, setTimeout(function () {reload(); }, 1000));
			//if (KM.config.error_str!="")
			//	KM.kill_timeout_ids(KM.ERROR_DAEMON);
			//KM.conf_error_html();
        }
    }
};


/* ****************************************************************************
Config display - Login and backdrop

Displays and processes the login and generates backdrop HTML
**************************************************************************** */


KM.display_config = function () {

    // A function that launches the config
    //
    // expects:
    //
    // returns:
    //

    if (KM.www_rc.secure) {
        KM.conf_loggin_html();
    } else {
        KM.conf_backdrop_html();
    }
};


KM.conf_loggin_html = function() {

    // A function that shows the config login screen.
    //
    // expects:
    //
    // returns:
    //

    KM.session_id.current++;
    // awkward hacks to keep consistant interface across browsers
    var title_str = 'title_FF';
    if (KM.browser.browser_OP) title_str = 'title_OP';
    if (KM.browser.browser_IE) title_str = 'title_IE';

    document.getElementById('main_display').innerHTML = '' +
    '<div id="' + title_str + '">' +
        '<span class="italic">kmotion</span>: Config' +
    '</div>' +
    '<div class="divider">' +
        '<img src="images/divider_xl.png" alt="" />' +
    '</div><br>' +
    '<form  name="login" onSubmit="return false">' +
    '<div class="sub_title">' +
        'Password ' +
        '<input type="password" name="password" size="20" />&nbsp;' +
        '<input type="button" OnClick="KM.conf_login_validate_pw();" value="Submit">' +
    '</div>' +
    '</form>';
    document.login.password.focus();
};


KM.conf_login_validate_pw = function() {

    // A function that accepts a password and checks its hash. This offers
    // basic security to stop tampering with kmotions config. __NOTE__ this is
    // not bombproof and anyone with advanced javascript knowledge
    // (That rules me out !) could work around it.
    //
    // If you have let a user view your CCTV it is assumed that you at least
    // partially trust him/her not to be an evil highly skilled hacker.
    //
    // expects:
    //
    // returns:
    //

    if (KM.config_misc_hash_pw(document.login.password.value) === KM.www_rc.config_hash) {
        KM.conf_backdrop_html();
    } else {
        document.login.password.value = '';
    }
};


KM.conf_backdrop_html = function() {

    // A function that generates the config backdrop HTML including the top
    // buttons and the main display
    //
    // expects:
    //
    // returns:
    //

    KM.session_id.current++;
	var backdrop_width = KM.browser.main_display_width * 0.8;
	var backdrop_height = KM.browser.main_display_height - 60;
	var config_height = backdrop_height-30; 
	var button_width = backdrop_width / 7;


    //document.getElementsByTagName('body')[0].style.backgroundColor = KM.WHITE;
    document.getElementById('main_display').innerHTML = '' +

    '<div class="title" style="width:'+backdrop_width+'px;">' +
	'kmotion Config : ' +
	'<span id="update"></span>' +
    '</div>' +

    '<div class="divider" >' +
        '<img src="images/config_divider_color.png" alt="" style="width:'+backdrop_width+'px;">' +
    '</div>' +

    '<div class="config_backdrop" style="width:'+backdrop_width+'px;height:'+backdrop_height+'px;">' +
	'<div id="config_bar" class="config_button_bar" style="height:30px;overflow:hidden;" >' +

	    '<input type="button" value="Misc" id="ptz_button" onclick="KM.conf_misc_html()" '+
	    'style="width:' + button_width + 'px;"/>' +
	    '<input type="button" value="Cameras" id="ptz_button" onclick="KM.conf_feed_html()" '+
	    'style="width:' + button_width + 'px;"/>' +
	    '<input type="button" value="PTZ" id="ptz_button" onclick="KM.conf_ptz_html()" '+
	    'style="width:' + button_width + 'px;"/>' +
	    '<input type="button" value="Schedules" id="ptz_button" onclick="KM.conf_schedule_html()" '+
	    'style="width:' + button_width + 'px;"/>' +
	    '<input type="button" value="Themes" id="ptz_button" onclick="KM.conf_theme_html()" '+
	    'style="width:' + button_width + 'px;"/>' +
	    '<input type="button" value="Motion Errors" id="error_button" onclick="KM.conf_select_errors();" ' +
	    'style="width:' + button_width + 'px;"/>' +
	    '<input type="button" value="Server Load" onclick="KM.conf_select_load();" ' +
	    'style="width:' + button_width + 'px;"/>' +

	'</div>' +

	'<div id="config_html" style="height:'+config_height+'px;"></div>' +

    '</div>';
	
    if (KM.www_rc.version_latest === 'failed_parse') {
        document.getElementById('update').innerHTML = 'Connecting to update server ...';
        document.getElementById('update').style.color = KM.YELLOW;

    } else if (KM.www_rc.version_latest === 'SVN') {
        document.getElementById('update').innerHTML = 'Execute \'svn update\' for latest build.';
        document.getElementById('update').style.color = KM.RED;

    } else if (KM.www_rc.version === KM.www_rc.version_latest) {
        document.getElementById('update').innerHTML = 'No updates avaliable.';
        document.getElementById('update').style.color = KM.GREY;

    } else {
        document.getElementById('update').innerHTML = 'Version ' + KM.www_rc.version_latest + ' is now avaliable.';
        document.getElementById('update').style.color = KM.RED;
    }


    KM.conf_misc_html();
};


KM.conf_highlight_error_button = function() {

    // A function that enables and highlight the 'server error' button
    //
    // expects:
    //
    // returns:
    //

    document.getElementById('error_button').style.fontWeight = 'bold';
    document.getElementById('error_button').style.color = KM.RED;
    document.getElementById('error_button').disabled = false;
};


KM.conf_disable_error_button = function () {

    // A function that disables the 'server error' button
    //
    // expects:
    //
    // returns:
    //

    document.getElementById('error_button').style.fontWeight = 'normal';
    // horrible horrible color hack to simulate greyed out !
    document.getElementById('error_button').style.color = '#c6c7c9';
    document.getElementById('error_button').disabled = true;
};



KM.conf_ptz = function() {

    // A function that is executed when the 'ptz' button is clicked
    //
    // expects:
    //
    // returns:
    //

    KM.session_id.current++;
    KM.conf_error_daemon(KM.session_id.current);
    KM.conf_ptz_html();
};


KM.conf_select_errors = function() {

    // A function that is executed when the 'errors' button is clicked
    //
    // expects:
    //
    // returns:
    //
    //KM.config.error_str="";
    KM.session_id.current++;
    KM.conf_error_daemon(KM.session_id.current);
    KM.conf_error_html();
};


KM.conf_select_load = function() {

    // A function that is executed when the 'load' button is clicked
    //
    // expects:
    //
    // returns:
    //
	
   
    KM.session_id.current++;
    KM.conf_error_daemon(KM.session_id.current);
    KM.conf_load_html();
};


/* ****************************************************************************
Config display - Misc config screen

Displays and processes the misc config screen
**************************************************************************** */


KM.conf_misc_html = function() {

    // A function that generates the misc config HTML. It create the misc
    // config screen on the config backdrop 'slab'. Forces GUI selection of
    // 'interleave' if  either 'low bandwidth' or 'full screen' are selected.
    //
    // Shows update status of the kmotion software. __NOTE__ this is the update
    // status when this browser session was started. If you run a single session
    // for days/weeks this status will be out of date. Refresh your browser to
    // update. A function that is executed when the 'load' button is clicked
    //
    // expects:
    //
    // returns:
    //
	
    document.getElementById('config_html').innerHTML = '<br />\
            <div class="config_group_margin">\
              <input type="checkbox" id="misc_inter" onclick="KM.conf_misc_highlight_apply();" />Interleave mode. Gives preference to cameras where motion has been detected.<br>\
              <input type="checkbox" id="misc_full" onclick="KM.conf_misc_force_inter();" />Full screen mode. Changes to full screen mode when motion has been detected.<br>\
              <input type="checkbox" id="misc_low_bw" onclick="KM.conf_misc_force_inter();" />Low bandwidth mode. Update "no motion" cameras every 15 mins.<br>\
              <input type="checkbox" id="misc_low_cpu" onclick="KM.conf_misc_highlight_apply();" />Low CPU mode. Reduce browser CPU usage by capping update frequency.<br>\
			</div>\
            <br /><hr style="margin:10px;clear:both" />\
			<div class="config_group_margin">\
				<div class="config_tick_margin">\
                  <input type="checkbox" id="misc_live" checked="checked" disabled="disabled" />Live button enabled.<br>\
                  <input type="checkbox" id="misc_logs" onclick="KM.conf_misc_highlight_apply();" />Logs button enabled.<br>\
                  <input type="checkbox" id="misc_func" onclick="KM.conf_misc_highlight_apply();" />Func button enabled.<br>\
                  <input type="checkbox" id="misc_aboutxx" onclick="KM.conf_misc_highlight_apply();" />Panic button enabled.<br>\
                  <input type="checkbox" id="misc_msg" onclick="KM.conf_misc_highlight_apply();" />Msg button enabled.<br>\
                </div>\
				<div class="config_tick_margin">\
					<input type="checkbox" id="misc_archive" onclick="KM.conf_misc_highlight_apply();" />Archive button enabled.<br>\
					<input type="checkbox" id="misc_config" onclick="KM.conf_misc_highlight_apply();" />Config button enabled.<br>\
					<input type="checkbox" id="misc_about" onclick="KM.conf_misc_highlight_apply();" />About button enabled.<br>\
					<input type="checkbox" id="misc_logout" onclick="KM.conf_misc_highlight_apply();" />Logout button enabled.<br>\
					<input type="checkbox" id="misc_hide_button_bar" onclick="KM.conf_misc_highlight_apply();" />Hide button bar.<br>\
				</div>\
            </div>\
            <br /><hr style="margin:10px;clear:both" />\
            <div class="config_group_margin">\
              <input type="checkbox" id="misc_skip_frames" onclick="KM.conf_misc_highlight_apply();" />Enable archive playback acceleration by skipping frames. (may miss events)<br>\
              <input type="checkbox" id="misc_save" onclick="KM.conf_misc_save_display();" />Save the current "Display Select" configuration as default.<br>\
              <input type="checkbox" id="misc_secure" onclick="KM.conf_misc_highlight_apply();" />Enable security login screen. New password : <input type="password" id="misc_pw" />&nbsp;<input type="button" onclick="KM.conf_misc_save_pw();" value="Submit" /><br>\
            </div>\
            <hr style="margin:10px;clear:both" />\
            <div class="config_text_margin" id="conf_text" >\
              <input type="button" id="conf_apply" onclick="KM.conf_misc_apply();" value="Apply" />all changes to the local browser configuration and sync with the remote server.\
           </div>';

    // update the misc config screen
        if (KM.www_rc.low_bandwidth || KM.www_rc.full_screen) {
            // if low bandwidth or full screen selected, force interleave mode
            KM.www_rc.interleave = true;
            document.getElementById('misc_inter').checked = KM.www_rc.interleave;
            document.getElementById('misc_inter').disabled = true;
        }
    document.getElementById('misc_inter').checked = KM.www_rc.interleave;
    document.getElementById('misc_full').checked = KM.www_rc.full_screen;
    document.getElementById('misc_low_bw').checked = KM.www_rc.low_bandwidth;
    document.getElementById('misc_low_cpu').checked = KM.www_rc.low_cpu;
    document.getElementById('misc_skip_frames').checked = KM.www_rc.skip_frames;
    document.getElementById('misc_archive').checked = KM.www_rc.archive_button_enabled;
    document.getElementById('misc_logs').checked = KM.www_rc.logs_button_enabled;
    document.getElementById('misc_config').checked = KM.www_rc.config_button_enabled;
    document.getElementById('misc_func').checked = KM.www_rc.func_button_enabled;
    document.getElementById('misc_msg').checked = KM.www_rc.msg_button_enabled;
    document.getElementById('misc_about').checked = KM.www_rc.about_button_enabled;
    document.getElementById('misc_logout').checked = KM.www_rc.logout_button_enabled;
	document.getElementById('misc_hide_button_bar').checked = KM.www_rc.hide_button_bar;
    document.getElementById('misc_secure').checked = KM.www_rc.secure;
};


KM.conf_misc_force_inter = function() {

    // A function that if low bandwidth or full screen selected, forces
    // interleave mode
    //
    // expects:
    //
    // returns:
    //

    if (!document.getElementById('misc_low_bw').checked &&
    !document.getElementById('misc_full').checked) {
        document.getElementById('misc_inter').disabled = false;
    } else {
        document.getElementById('misc_inter').checked = KM.www_rc.interleave;
        document.getElementById('misc_inter').disabled = true;
    }
    KM.conf_misc_highlight_apply();
};


KM.conf_misc_save_display = function() {

    // A function that saves the display select and color select
    //
    // expects:
    //
    // returns:
    //

    KM.conf_config_track.display_modified();
    KM.conf_misc_highlight_apply();
};


KM.conf_misc_save_pw = function() {

    // A function that saves the config password
    //
    // expects:
    //
    // returns:
    //

    KM.config.pwd_changed = true;
    KM.conf_config_track.pw_modified();
    KM.conf_misc_highlight_apply();
};


KM.conf_misc_highlight_apply = function () {

    // A function that highlights the 'need to apply' warning
    //
    // expects:
    //
    // returns:
    //

    document.getElementById('conf_apply').style.fontWeight = 'bold';
    document.getElementById('conf_apply').style.color = KM.BLUE;
    document.getElementById('conf_text').style.color = KM.BLUE;
};


KM.conf_misc_apply = function () {

    // A function that checks and applys the changes
    //
    // expects:
    //
    // returns:
    //

    KM.www_rc.interleave = document.getElementById('misc_inter').checked;
    KM.www_rc.full_screen = document.getElementById('misc_full').checked;
    KM.www_rc.low_bandwidth = document.getElementById('misc_low_bw').checked;
    KM.www_rc.low_cpu = document.getElementById('misc_low_cpu').checked;
    KM.www_rc.skip_frames = document.getElementById('misc_skip_frames').checked;
    KM.www_rc.archive_button_enabled = document.getElementById('misc_archive').checked;
    KM.www_rc.logs_button_enabled = document.getElementById('misc_logs').checked;
    KM.www_rc.config_button_enabled = document.getElementById('misc_config').checked;
    KM.www_rc.func_button_enabled =  document.getElementById('misc_func').checked;
    KM.www_rc.msg_button_enabled = document.getElementById('misc_msg').checked;
    KM.www_rc.about_button_enabled = document.getElementById('misc_about').checked;
    KM.www_rc.logout_button_enabled = document.getElementById('misc_logout').checked;
	KM.www_rc.hide_button_bar = document.getElementById('misc_hide_button_bar').checked;
    KM.www_rc.secure = document.getElementById('misc_secure').checked;
    if (KM.config.pwd_changed) {
        KM.www_rc.config_hash = KM.config_misc_hash_pw(document.getElementById('misc_pw').value);
        KM.config.pwd_changed = false;
    }
    // reset the 'misc_save' checked box any warning highlight on the apply line
    document.getElementById('misc_save').checked = false;
    document.getElementById('conf_apply').style.fontWeight = 'normal';
    document.getElementById('conf_apply').style.color = KM.BLACK;
    document.getElementById('conf_text').style.color = KM.DARK_GREY;
    KM.update_function_buttons(4); // update button enables
    KM.conf_config_track.misc_modified();
    KM.conf_config_track.sync()
};


KM.config_misc_hash_pw = function(text) {

    // A function that hashes the password 'text'
    //
    // expects:
    // 'text'  ... the password to be hashed
    //
    // returns:
    // 'hash' ... the hash
    //

    // kmotion = 107109111116105111110
    var hash = '';
    for (var i = 0; i < text.length; i++) {
        hash += text.charCodeAt(i);
    }
    return hash
};


/* ****************************************************************************
Config display - Feed config screen

Displays and processes the feed config screens
**************************************************************************** */


KM.conf_feed_html = function () {

    // A function that generates the feed config HTML. It create the feed
    // config screen on the config backdrop 'slab'. The mask selecting
    // interface was difficult to implement. 225 transparent .svg's are added
    // to the top LHS of the screen then moved into position with javascript.
    //
    // expects:
    //
    // returns:
    //

    KM.kill_timeout_ids(KM.MISC_JUMP);
    var image_width = 345;
    var image_height = 255;

    var mask = '';
    var mask_width = image_width / 15;
    var mask_height = image_height / 15;
    var html_str = '';
    for (var i = 1; i < 226; i++) {
        html_str += '<div id="mask_' + i + '" style="position:absolute; left:10px; top:10px;">' +
        '<img id="mask_img_' + i + '" style="width:' + mask_width + 'px; height:' + mask_height + 'px;"' +
        'onclick="KM.conf_toggle_feed_mask(' + i + ');" ' +
        'src="images/mask_trans.png" alt="">' +
        '</div>';
    }

    html_str += '<br>' +

    '<div style="float:left; width:370px;">' +
        '<div class="config_margin_left_20px">' +
            '<img id="image" ' +
            'style="width: ' + image_width + 'px; height: ' + image_height +
            'px;" src="images/gcam.png" alt=""> ' +

            '<input type="button" id="mask_all" style="width:115px;"' +
            'OnClick="KM.conf_feed_mask_button(1);" value="Mask All" disabled>' +
            '<input type="button" id="mask_invert" style="width:115px;" ' +
            'OnClick="KM.conf_feed_mask_button(2);" value="Mask Invert" disabled>' +
            '<input type="button" id="mask_none" style="width:115px;" ' +
            'OnClick="KM.conf_feed_mask_button(3);" value="Mask None" disabled>' +
        '</div>' +
		'<div id="feed_text_9" class="config_margin_left_20px" style="font-weight:bold;padding:10px;text-align:center">Click on the image or buttons to edit the motion mask.</div>' +
    '</div>' +

     '<div class="config_tick_margin">' +
	 '<div  class="config_text_margin">' +
        '<select style="width:190px;" id="feed_camera" onchange="KM.conf_feed_change();">';
		for (var i=1;i<max_feed;i++) {
			html_str+='<option value="'+i+'">Camera '+i+'</option>';
        };
		html_str+='</select>\
					<input type="checkbox" id="feed_enabled" onclick="KM.conf_feed_enabled();" />Enable camera \
					<br><br><input type="checkbox" id="feed_pal_enabled" onclick="KM.conf_feed_pal_selected();" />PAL \
					<input type="checkbox" id="feed_ntsc_enabled" onclick="KM.conf_feed_ntsc_selected();" />NTSC \
			  </div></div><div class="config_tick_margin"> \
            <br /><hr style="margin:10px" class="clear_float"/> \
			<div class="config_tick_margin">\
            <div class="config_tick_margin" id="feed_text_3">\
              <div class="config_text">Device:</div>\
              <div class="config_text">URL:</div>\
			  <div class="config_text">Name:</div>\
              <div class="config_text">Width:</div>\
            </div>\
            <div class="config_tick_margin">\
			<div class="config_text">\
              <select style="width:190px" id="feed_device" onchange="KM.conf_feed_net_highlight();" disabled>';
				for (var i=0;i<max_feed-1;i++) {
					html_str+='<option value="'+i+'">/dev/video'+i+'</option>';			
				};
				html_str+='<option value="-1">Network Cam</option></select>\
			  </select>\
			  </div>\
				<div class="config_text">\
			  <input type="text" id="feed_url" style="width: 190px; margin-left: 1px;" onfocus="KM.conf_feed_highlight_apply();" /></div>\
			  <div class="config_text">\
			  <input type="text" id="feed_lgn_name" style="width: 190px;  margin-left: 1px;" onfocus="KM.conf_feed_highlight_apply();" /></div>\
			  <div class="config_text">\
			  <input type="text" id="feed_width" size="4" onfocus="KM.conf_feed_highlight_apply();" /><span id="feed_text_4">px</span></div>\
            </div></div>\
            <div class="config_tick_margin" id="feed_text_5">\
			<div class="config_tick_margin">\
              <div class="config_text">Input:</div>\
              <div class="config_text">Proxy:</div>\
              <div class="config_text">Password:</div>\
              <div class="config_text">Height:</div>\
            </div>\
            <div class="config_tick_margin">\
			<div class="config_text">\
			<select style="width:190px" id="feed_input" onchange="KM.conf_feed_highlight_apply();" disabled>\
				<option value="0">0</option>\
				<option value="1">1</option>\
				<option value="2">2</option>\
				<option value="3">3</option>\
				<option value="4">4</option>\
				<option value="5">5</option>\
				<option value="6">6</option>\
				<option value="7">7</option>\
				<option value="8">N/A</option>\
			</select>\
		</div> \
              <div class="config_text"><input type="text" id="feed_proxy" style="width: 190px; height: 15px; margin-left: 1px; margin-top:1px;"\ onfocus="KM.conf_feed_highlight_apply();" /></div>\
			  <div class="config_text"><input type="password" id="feed_lgn_pw" style="width: 190px; height: 15px; margin-left: 1px; margin-top:1px;"\ onfocus="KM.conf_feed_highlight_apply();" /></div>\
			  <div class="config_text"><input type="text" id="feed_height" size="4" style="margin-top:1px;" onfocus="KM.conf_feed_highlight_apply();" /><span style="color:#818181;font-size: 17px;font-weight: bold;margin-left: 0px;" id="feed_text_6">px</span></div>\
            </div></div>\
            <br /><hr style="margin:10px" class="clear_float"/>\
            <div class="config_tick_margin" id="feed_text_7">\
              <div class="config_text">Camera name: <input style="width:190px" type="text" id="feed_name" size="15" onfocus="KM.conf_feed_highlight_apply();" value="'+KM.config.camera+'"/></div>\
            </div>\
			</div>\
            <br /><hr style="margin:10px" class="clear_float"/>\
			<div class="config_text_margin" id="feed_text_8">\
              <input type="checkbox" id="feed_box" onclick="KM.conf_feed_highlight_apply();" />Enable motion highlighting. (Draw box around detected motion)\
            </div>\
            <div class="config_text_margin" id="feed_text_10">\
              <input type="checkbox" id="feed_ffmpeg_enabled" onclick="KM.conf_feed_ffmpeg_selected();" />Enable movie mode. Record motion events as a (flash swf) movie. Low bandwidth playback.\
            </div>\
            <div class="config_text_margin" id="feed_text_11">\
              <input type="checkbox" id="feed_frame_enabled" onclick="KM.conf_feed_frame_selected();" />Enable frame mode. Record motion events as a series of discrete frames. High bandwidth playback at : <input type="text" id="feed_fps" size="4" onfocus="KM.conf_feed_highlight_apply();" />fps, (5 fps recommended)\
            </div>\
            <div class="config_text_margin" id="feed_text_13">\
              Schedule : <select id="feed_sched_motion" onchange="KM.conf_feed_highlight_apply();">\
                <option value="0">\
                  None\
                </option>\
              </select>\
			</div>\
            <br /><hr style="margin:10px" class="clear_float"/>\
            <div class="config_text_margin" id="feed_text_14">\
              <input type="checkbox" id="feed_snap_enabled" onclick="KM.conf_feed_highlight_apply();" />Enable snapshot mode. Record an image in time lapse mode with a pause between images.\
            </div>\
            <div class="config_text_margin" style="width:412px;" id="feed_text_15">\
              of : <input type="text" id="feed_snap" size="4" onfocus="KM.conf_feed_highlight_apply();" />Seconds, (300 Seconds recommended)\
            </div>\
            <div class="config_text_margin" id="feed_text_16">\
              Schedule: <select id="feed_sched_snap" onchange="KM.conf_feed_highlight_apply();">\
                <option value="0">\
                  None\
                </option>\
              </select>\
            </div>\
            <br /><hr style="margin:10px" class="clear_float"/>\
            <div class="config_text_margin" style="width:444px;" id="feed_text_17">\
              <input type="checkbox" id="feed_email_enabled" onclick="KM.conf_feed_highlight_apply();" />Enable email notification on motion detection. Set\
            </div>\
            <div class="config_text_margin" id="feed_text_18">\
              Email : <input type="text" id="feed_email_addr" size="40" onfocus="KM.conf_feed_highlight_apply();" />\
            </div>\
            <div class="config_text_margin" style="width:412px;" id="feed_text_19">\
              to : <input type="text" id="feed_email_pause" size="4" onfocus="KM.conf_feed_highlight_apply();" />Seconds (Min) between emails.\
            </div>\
            <div class="config_text_margin" id="feed_text_20">\
              Schedule : <select id="feed_sched_email" onchange="KM.conf_feed_highlight_apply();">\
                <option value="0">\
                  None\
                </option>\
              </select>\
            </div>\
            <br /><hr style="margin:10px" class="clear_float"/>\
            <div class="config_text_margin" id="conf_text">\
              <input type="button" id="conf_apply" onclick="KM.conf_feed_apply();" value="Apply" />all changes to the local browser configuration and sync with the remote server.\
            </div>\
          </div><br />';
    

    if (KM.www_rc.feed_enabled[KM.config.camera]) {
        html_str = html_str.replace(/disabled/g, '');
        html_str = html_str.replace(/gcam.png/, 'bcam.png');

        KM.conf_live_feed_daemon(KM.session_id.current, KM.config.camera);
    }
    document.getElementById('config_html').innerHTML = html_str;

    // has to be this messy way to avoid flicker
	//console.log(KM.www_rc.feed_device[KM.config.camera]);
    if (KM.www_rc.feed_enabled[KM.config.camera]) {
        if (KM.www_rc.feed_device[KM.config.camera] == -1) {
            document.getElementById('feed_input').disabled = true;
            document.getElementById('feed_url').disabled = false;
            document.getElementById('feed_proxy').disabled = false;
            document.getElementById('feed_lgn_name').disabled = false;
            document.getElementById('feed_lgn_pw').disabled = false;
        } else {
            document.getElementById('feed_input').disabled = false;
            document.getElementById('feed_url').disabled = true;
            document.getElementById('feed_proxy').disabled = true;
            document.getElementById('feed_lgn_name').disabled = true;
            document.getElementById('feed_lgn_pw').disabled = true;
        }
    }

    document.getElementById('feed_camera').selectedIndex = KM.config.camera - 1;
    document.getElementById('feed_enabled').checked = KM.www_rc.feed_enabled[KM.config.camera];
    document.getElementById('feed_pal_enabled').checked = KM.www_rc.feed_pal[KM.config.camera];
    document.getElementById('feed_ntsc_enabled').checked = !KM.www_rc.feed_pal[KM.config.camera];
	if (KM.www_rc.feed_device[KM.config.camera]>-1)
		document.getElementById('feed_device').selectedIndex = KM.www_rc.feed_device[KM.config.camera];
	else
		document.getElementById('feed_device').selectedIndex = max_feed-1;
    document.getElementById('feed_input').selectedIndex = KM.www_rc.feed_input[KM.config.camera];
    document.getElementById('feed_url').value = KM.www_rc.feed_url[KM.config.camera];
    document.getElementById('feed_proxy').value = KM.www_rc.feed_proxy[KM.config.camera];
    document.getElementById('feed_lgn_name').value = KM.www_rc.feed_lgn_name[KM.config.camera];
    document.getElementById('feed_lgn_pw').value = KM.www_rc.feed_lgn_pw[KM.config.camera];
    document.getElementById('feed_width').value = KM.www_rc.feed_width[KM.config.camera];
    document.getElementById('feed_height').value = KM.www_rc.feed_height[KM.config.camera];
    document.getElementById('feed_name').value = KM.www_rc.feed_name[KM.config.camera];
    document.getElementById('feed_box').checked = KM.www_rc.feed_show_box[KM.config.camera];
    document.getElementById('feed_fps').value = KM.www_rc.feed_fps[KM.config.camera];
    document.getElementById('feed_snap_enabled').checked = KM.www_rc.feed_snap_enabled[KM.config.camera];
    document.getElementById('feed_snap').value = KM.www_rc.feed_snap_interval[KM.config.camera];
    document.getElementById('feed_frame_enabled').checked = KM.www_rc.feed_smovie_enabled[KM.config.camera];
    document.getElementById('feed_ffmpeg_enabled').checked = KM.www_rc.feed_movie_enabled[KM.config.camera];

    // reposition the masks
    var origin_y = document.getElementById('image').offsetTop;
    var origin_x = document.getElementById('image').offsetLeft;

    // awkward hacks to keep consistant interface across browsers
    var addit_offset = 0;
    if (KM.browser.browser_OP) addit_offset = -2;
    if (KM.browser.browser_IE) addit_offset = -2;
    origin_x += addit_offset;
    origin_y += addit_offset;

    var mask_num = 0;
    for (var y = 0; y < 15; y++) {
        for (var x = 0; x < 15; x++) {
            mask_num = x + 1 + (y * 15);
            document.getElementById('mask_' + mask_num).style.top = (origin_y + (mask_height * y)) + 'px';
            document.getElementById('mask_' + mask_num).style.left = (origin_x + (mask_width * x)) + 'px';
        }
    }

    KM.config.mask = '';
    var mask_lines = KM.www_rc.feed_mask[KM.config.camera].split('#');
    for (var i = 0; i < 15; i++) {
        KM.config.mask += KM.pad_out(parseInt(mask_lines[i], 16).toString(2), 15);
    }
    if (KM.www_rc.feed_enabled[KM.config.camera]) {
        // if enabled show the mask and enable ptz button
        for (var i = 0; i < 225; i++) {
            if (KM.config.mask.charAt(i) === '1') {
                document.getElementById('mask_img_' + (i + 1)).src = 'images/mask.png'
            }
        }
    };

	for (var i = 0; i < max_feed-1; i++) {
		if (KM.conf_config_track.feed_modified[i] == true){
			KM.conf_feed_highlight_apply();
			break;
		};
	};
};


KM.conf_toggle_feed_mask = function (mask_num) {

    // A function that toggles the mask region
    //
    // expects:
    // 'mask_num' ... the mask number to be toggled
    //
    // returns:
    //

    if (KM.config.mask.charAt(mask_num - 1) === '0' && document.getElementById('feed_enabled').checked) {
        document.getElementById('mask_img_' + mask_num).src = 'images/mask.png';
        KM.config.mask = KM.config.mask.substr(0, mask_num - 1) + '1' + KM.config.mask.substr(mask_num);
    } else {
        document.getElementById('mask_img_' + mask_num).src = 'images/mask_trans.png';
        KM.config.mask = KM.config.mask.substr(0, mask_num - 1) + '0' + KM.config.mask.substr(mask_num);
    }
    KM.conf_config_track.mask_modified(KM.config.camera);
    KM.conf_feed_highlight_apply();
};


KM.conf_feed_mask_button = function (button_num) {

    // A function that performs mask wide operations
    //
    // expects:
    // 'button_num' ... the mask button clicked
    //			1: mask all, 2: mask invert, 3: mask none
    //
    // returns:
    //

    for (var mask_num = 1; mask_num < 226; mask_num++) {

	if (button_num === 1) {
	    document.getElementById('mask_img_' + mask_num).src = 'images/mask.png';
	    KM.config.mask = KM.config.mask.substr(0, mask_num - 1) + '1' + KM.config.mask.substr(mask_num);

	} else if (button_num === 2) {
	    if (KM.config.mask.substr(mask_num - 1, 1) === '0') {

		KM.config.mask = KM.config.mask.substr(0, mask_num - 1) + '1' + KM.config.mask.substr(mask_num);
		document.getElementById('mask_img_' + mask_num).src = 'images/mask.png';

	    } else {

		KM.config.mask = KM.config.mask.substr(0, mask_num - 1) + '0' + KM.config.mask.substr(mask_num);
		document.getElementById('mask_img_' + mask_num).src = 'images/mask_trans.png';
	    }

	} else if (button_num === 3) {
	    document.getElementById('mask_img_' + mask_num).src = 'images/mask_trans.png';
	    KM.config.mask = KM.config.mask.substr(0, mask_num - 1) + '0' + KM.config.mask.substr(mask_num);
	}
    }
    KM.conf_config_track.mask_modified(KM.config.camera);
    KM.conf_feed_highlight_apply();
};


KM.conf_feed_change = function () {

    // A function changes the current camera, its breaks good programing
    // practice by incrementing the session id and reloading the HTML from
    // within the HTML .... yuk !!
    //
    // expects:
    //
    // returns:
    //

    KM.session_id.current++; // needed to kill the live feed daemon
    KM.config.camera = document.getElementById('feed_camera').selectedIndex + 1;
    KM.add_timeout_id(KM.MISC_JUMP, setTimeout(function () {KM.conf_feed_html(); }, 1));
};


KM.conf_feed_enabled = function () {

    // A function that enables/disables the current feed gui
    //
    // expects:
    //
    // returns:
    //

    KM.conf_feed_highlight_apply();
    if (document.getElementById('feed_enabled').checked) {
        KM.conf_feed_ungrey();
    } else {
        KM.conf_feed_grey();
    }
    // have to generate new mask on feed enabled
    KM.conf_config_track.mask_modified(KM.config.camera);
};


KM.conf_feed_pal_selected = function () {

    // A function that excludes 'pal' and 'ntsc' from being both selected
    //
    // expects:
    //
    // returns:
    //

    document.getElementById('feed_ntsc_enabled').checked = false;
    KM.conf_feed_highlight_apply();
};


KM.conf_feed_ntsc_selected = function () {

    // A function that excludes 'pal' and 'ntsc' from being both selected
    //
    // expects:
    //
    // returns:
    //

    document.getElementById('feed_pal_enabled').checked = false;
    KM.conf_feed_highlight_apply();
};


KM.conf_feed_net_highlight = function () {

    // A function that enables/disables user inputs for net cams
    //
    // expects:
    //
    // returns:
    //

    if (document.getElementById('feed_device').selectedIndex == max_feed-1) {
        document.getElementById('feed_input').disabled = true;
        document.getElementById('feed_url').disabled = false;
        document.getElementById('feed_proxy').disabled = false;
        document.getElementById('feed_lgn_name').disabled = false;
        document.getElementById('feed_lgn_pw').disabled = false;
    } else {
        document.getElementById('feed_input').disabled = false;
        document.getElementById('feed_url').disabled = true;
        document.getElementById('feed_proxy').disabled = true;
        document.getElementById('feed_lgn_name').disabled = true;
        document.getElementById('feed_lgn_pw').disabled = true;
    KM.conf_feed_highlight_apply()
    }
};


KM.conf_feed_frame_selected = function () {

    // A function that excludes 'frame' and 'ffmpeg' from being both selected
    //
    // expects:
    //
    // returns:
    //

    document.getElementById('feed_ffmpeg_enabled').checked = false;
    KM.conf_feed_highlight_apply();
};


KM.conf_feed_ffmpeg_selected = function () {

    // A function that excludes 'frame' and 'ffmpeg' from being both selected
    //
    // expects:
    //
    // returns:
    //

    document.getElementById('feed_frame_enabled').checked = false;
    KM.conf_feed_highlight_apply();
};


KM.conf_feed_grey = function () {

    // A function that greys out the feed screen
    //
    // expects:
    //
    // returns:
    //

    KM.session_id.current++; // needed to kill updates
    KM.conf_error_daemon(KM.session_id.current);

    var ids = ['mask_all' , 'mask_invert', 'mask_none', 'feed_pal_enabled',
    'feed_ntsc_enabled', 'feed_device', 'feed_url', 'feed_lgn_name', 'feed_width',
    'feed_input', 'feed_proxy', 'feed_lgn_pw', 'feed_height', 'feed_name',
    'feed_box', 'feed_ffmpeg_enabled', 'feed_frame_enabled', 'feed_fps',
    'feed_sched_motion', 'feed_snap_enabled', 'feed_snap', 'feed_sched_snap',
    'feed_email_enabled', 'feed_email_addr', 'feed_email_pause', 'feed_sched_email',
    'feed_audio_enabled', 'feed_audio_file', 'feed_sched_audio']

    for (var i = 0; i < ids.length; i++) {
		try {
			document.getElementById(ids[i]).disabled = true;
		} catch (e) {}
    }
    for (var i = 1; i < 226; i++) {
		try {
			document.getElementById('mask_img_' + (i)).src = 'images/mask_trans.png'
		} catch (e) {}		
    }
	try {
		document.getElementById('image').src = 'images/gcam.png';
	} catch (e) {}
};


KM.conf_feed_ungrey = function () {

    // A function that un-greys out the feed screen
    //
    // expects:
    //
    // returns:
    //

    KM.conf_live_feed_daemon(KM.session_id.current, KM.config.camera);

    var ids = ['mask_all' , 'mask_invert', 'mask_none', 'feed_pal_enabled',
    'feed_ntsc_enabled', 'feed_device', 'feed_url', 'feed_lgn_name', 'feed_width',
    'feed_input', 'feed_proxy', 'feed_lgn_pw', 'feed_height', 'feed_name',
    'feed_box', 'feed_ffmpeg_enabled', 'feed_frame_enabled', 'feed_fps',
    'feed_sched_motion', 'feed_snap_enabled', 'feed_snap', 'feed_sched_snap',
    'feed_email_enabled', 'feed_email_addr', 'feed_email_pause', 'feed_sched_email',
    'feed_audio_enabled', 'feed_audio_file', 'feed_sched_audio']

    for (var i = 0; i < ids.length; i++) {
		try {
			document.getElementById(ids[i]).disabled = false;
		} catch (e) {}
    }
    
    KM.conf_feed_net_highlight();	
    document.getElementById('image').src = 'images/bcam.png';
    // if enabled show the mask
    for (var i = 0; i < 225; i++) {
        if (KM.config.mask.charAt(i) === '1') {
            document.getElementById('mask_img_' + (i + 1)).src = 'images/mask.png'
        }
    }
};


KM.conf_feed_highlight_apply = function () {

    // A function that highlight the 'need to apply' warning
    //
    // expects:
    //
    // returns:
    //

    document.getElementById('conf_apply').style.fontWeight = 'bold';
    document.getElementById('conf_apply').style.color = KM.BLUE;
    document.getElementById('conf_text').style.color = KM.BLUE;

	KM.conf_feed_update();
};

KM.conf_feed_update = function () {
	KM.www_rc.feed_enabled[KM.config.camera] = document.getElementById('feed_enabled').checked;
    KM.www_rc.feed_pal[KM.config.camera] = document.getElementById('feed_pal_enabled').checked;
    if (document.getElementById('feed_device').selectedIndex == max_feed-1) {
	KM.www_rc.feed_device[KM.config.camera]=-1;
    } else {
	KM.www_rc.feed_device[KM.config.camera] = document.getElementById('feed_device').selectedIndex;
    };
    KM.www_rc.feed_input[KM.config.camera] = document.getElementById('feed_input').selectedIndex;
    KM.www_rc.feed_url[KM.config.camera] = document.getElementById('feed_url').value;
    KM.www_rc.feed_proxy[KM.config.camera] = document.getElementById('feed_proxy').value;
    KM.www_rc.feed_lgn_name[KM.config.camera] = document.getElementById('feed_lgn_name').value;
    KM.www_rc.feed_lgn_pw[KM.config.camera] = document.getElementById('feed_lgn_pw').value;
    KM.www_rc.feed_name[KM.config.camera] = document.getElementById('feed_name').value;
    KM.www_rc.feed_show_box[KM.config.camera] = document.getElementById('feed_box').checked;
    KM.www_rc.feed_snap_enabled[KM.config.camera] = document.getElementById('feed_snap_enabled').checked;
    KM.www_rc.feed_smovie_enabled[KM.config.camera] = document.getElementById('feed_frame_enabled').checked;
    KM.www_rc.feed_movie_enabled[KM.config.camera] = document.getElementById('feed_ffmpeg_enabled').checked;

    var tmp = '';
    KM.www_rc.feed_mask[KM.config.camera] = '';
    for (var i = 0; i < 15; i++) {
        tmp = KM.config.mask.substr(i * 15, 15);
        KM.www_rc.feed_mask[KM.config.camera] += parseInt(tmp, 2).toString(16) + '#';
    }

    var width = parseInt(document.getElementById('feed_width').value, 10);
    if (isNaN(width)) width = 0;
    width = parseInt(width / 16) * 16;
    if (KM.www_rc.feed_width[KM.config.camera] !== width) {
        // if the image size changes, change the mask
        KM.conf_config_track.mask_modified(KM.config.camera);
        KM.www_rc.feed_width[KM.config.camera] = width;
    }
    // feed value back to gui in case parseInt changes it
    document.getElementById('feed_width').value = width;

    var height = parseInt(document.getElementById('feed_height').value, 10);
    if (isNaN(height)) height = 0;
    height = parseInt(height / 16) * 16;
    if (KM.www_rc.feed_height[KM.config.camera] !== height) {
        // if the image size changes, change the mask
        KM.conf_config_track.mask_modified(KM.config.camera);
        KM.www_rc.feed_height[KM.config.camera] = height;
    }
    // feed value back to gui in case parseInt changes it
    document.getElementById('feed_height').value = height;

    var fps = parseInt(document.getElementById('feed_fps').value, 10);
    if (isNaN(fps)) fps = 0;
    KM.www_rc.feed_fps[KM.config.camera] = fps;
    // feed value back to gui in case parseInt changes it
    document.getElementById('feed_fps').value = fps;

    var snap = parseInt(document.getElementById('feed_snap').value, 10);
    if (isNaN(snap)) snap = 0;
    KM.www_rc.feed_snap_interval[KM.config.camera] = snap;
    // feed value back to gui in case parseInt changes it
    document.getElementById('feed_snap').value = snap;

    // enable / disable the ptz button
    if (KM.www_rc.feed_enabled[KM.config.camera]) {
        document.getElementById('ptz_button').disabled = false;
    } else {
        document.getElementById('ptz_button').disabled = true;
    };

	KM.conf_config_track.feed_modified(KM.config.camera);

};


KM.conf_feed_apply = function () {

    // A function that checks and applys the changes
    //
    // expects:
    //
    // returns:
    //



    // reset any warning highlight on the apply line
    document.getElementById('conf_apply').style.fontWeight = 'normal';
    document.getElementById('conf_apply').style.color = KM.BLACK;
    document.getElementById('conf_text').style.color = KM.DARK_GREY;


    KM.conf_config_track.sync();
};


KM.conf_live_feed_daemon = function (session_id, feed) {

    // A closure that acts as a daemon constantly refreshing the config display
    // loading feed jpegs and displaying them. Follows the low CPU user
    // setting.
    //
    // expects:
    //
    // returns:
    //

    var session_id_config = session_id;
    var feed_config = feed;
    var ref_time_ms = 0;
    var jpegs = ['', '', '', '', ''];
    var jpeg_ptr = 0;        // jpeg name caching else browser gets confused!
    KM.add_timeout_id(KM.CONFIG_LOOP, setTimeout(function () {refresh_config(); }, 1));

    function refresh_config() {
	// refresh the config screen display
	if (session_id_config === KM.session_id.current) {

	    ref_time_ms = (new Date()).getTime();
	    KM.kill_timeout_ids(KM.CONFIG_LOOP); // free up memory from 'setTimeout' calls
	    KM.add_timeout_id(KM.CONFIG_LOOP, setTimeout(function () {KM.get_jpeg(feed_config, refresh_callback_config, session_id_config); }, 1));
	}
    }

    function refresh_callback_config(jpeg, feed, same, session_id) {
        // called by 'get_jpeg' when jpeg avaliable
        if (session_id === KM.session_id.current) {
	    KM.update_feeds();

	    if (jpeg !== 'null') {

		jpeg_ptr++;
		jpeg_ptr = (jpeg_ptr > 4)?0:jpeg_ptr;
		jpegs[jpeg_ptr] = jpeg;

		try {
		document.getElementById('image').src = jpegs[jpeg_ptr];
		} catch (e) {}
	    }
	    var taken_ms = (new Date()).getTime() - ref_time_ms;
	    var delay = Math.max(0, (1000 - taken_ms));
	    KM.add_timeout_id(KM.CONFIG_LOOP, setTimeout(function () {refresh_config(); }, delay));
	}
    }

};


/* ****************************************************************************
Config display - PTZ config screen

Displays and processes the misc config screen
**************************************************************************** */


KM.conf_ptz_html = function() {

    // A function that generates the PTZ backdrop HTML. It create the PTZ
    // config screen on the config backdrop 'slab'. This is a complex GUI with
    // a lot of workarounds, the price of ...kmotion -> motion -> kernel driver
    // -> hardware with no feedback loop :)
    //
    // From X0:Y0 all LUDR (Left Up Down Right) presses are sent to motion and
    // added to KM.config.ptz_current_x, KM.config.ptz_current_y to track an
    // theoretical 'absolute' position. However if a PTZ mechanical end stop is
    // encountered the 'absolute' position is corrupted and a new X0:Y0
    // alibration will be needed.
    //
    // In addition greying and disabling of the LUDR buttons avoids premature
    // repeat clicking. Excess clicks are discarded which would again cause the
    // 'absolute' position is corrupted.
    //
    // expects:
    //
    // returns:
    //

    KM.config.session_id = KM.session_id.current;
    KM.conf_config_track.reset();
    var image_width = 340;
    var image_height = 250;
    var html_str = '<br>' +

    '<div style="float:left; width:360px;padding-bottom:20px">' +
        '<div class="config_margin_left_20px">' +
            '<img id="image" ' +
            'style="width: ' + image_width + 'px; height: ' + image_height +
            'px;" src="images/gcam.png" alt=""> ' +
            '<input type="button" id="ptz_left" style="width:85px;" ' +
            'OnClick="KM.conf_ptz_servo(1);" value="Left" disabled>' +
            '<input type="button" id="ptz_up" style="width:85px;" ' +
            'OnClick="KM.conf_ptz_servo(2);" value="Up" disabled>' +
            '<input type="button" id="ptz_down" style="width:85px;" ' +
            'OnClick="KM.conf_ptz_servo(3);" value="Down" disabled>' +
            '<input type="button" id="ptz_right" style="width:85px;" ' +
            'OnClick="KM.conf_ptz_servo(4);" value="Right" disabled>' +
        '</div>' +
    '</div>' +

    '<div class="config_tick_margin">' +	
    '<div class="config_button" id="ptz_text_1">' +
	'<input type="checkbox" id="ptz_enabled" onclick="KM.conf_ptz_highlight_apply();" />Enable ptz '+
        'Driver : ' +
        '<select id="ptz_track" onchange="KM.conf_ptz_highlight_apply();" disabled>' +
            '<option value="1">1: stepper (motion tracking project)' +
            '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</option>' +
            '<option value="2">2: iomojo for the smilecam</option>' +
            '<option value="3">3: pwc driver for USB cameras</option>' +
            '<option value="4">4: generic </option>' +
            '<option value="5">5: uvcvideo driver for USB cameras</option>' +
            '<option value="6">6: reserved</option>' +
            '<option value="7">7: reserved</option>' +
            '<option value="8">8: reserved</option>' +
            '<option value="9">9: kmotion Axis 213 driver</option>' +
            '<option value="10">10: kmotion Axis 2130 driver</option>' +
            '<option value="11">11: kmotion Panasonic driver</option>' +
            '<option value="12">12: kmotion Foscam driver</option>' +
        '</select>' +
    '</div><br>' +

    '<br><hr style="margin:10px">' +

    '<div class="config_tick_box" id="ptz_text_2">' +
        '<input type="checkbox" id="ptz_calib_first" onclick="KM.conf_ptz_highlight_apply();" disabled>' +
        'Auto recalibrate. (Causes addition pan / tilting)' +
    '</div>' +

    '<div style="float:left; width:120px;" class="config_button" id="ptz_text_3">' +
        'Steps Click X :<br>' +
        'Button Delay :<br>' +
    '</div>' +

    '<div >' +
        '<input type="text" id="ptz_step_x" size="3" onfocus="KM.conf_ptz_highlight_apply();" disabled>&nbsp;' +
        '<span class="config_text_basic" id="ptz_text_4">' +
            '&nbsp;&nbsp;&nbsp;Steps Click Y :&nbsp;&nbsp;' +
            '<input type="text" id="ptz_step_y" size="3" onfocus="KM.conf_ptz_highlight_apply();" disabled>&nbsp;<br>' +
        '</span>' +
        '<input type="text" id="ptz_servo_settle" size="3" onfocus="KM.conf_ptz_highlight_apply();" disabled>' +
    '</div>' +

    '<br><hr style="margin:10px">' +

    '<div class="config_button" id="ptz_text_5">' +
        'Always ' +
        '<input type="button" id="ptz_calib" OnClick="KM.conf_ptz_calibrate();" value="Calibrate PT(Z) to X0:Y0"> ' +
        ' before moving<br>the camera and selecting any \'Set Position\'s.' +
        '<br><br>' +
        'Failure to do so may cause inaccurate positional<br>data to be stored.' +
    '</div>' +

    '<br><hr style="margin:10px">' +

    '<div class="config_tick_box" id="ptz_text_6">' +
        '<input type="checkbox" id="ptz_park_enabled" onclick="KM.conf_ptz_highlight_apply();" disabled>' +
        'Enable auto park. Moves the camera to a set position if no activity for a preset time.' +
    '</div>' +

    '<div class="config_button" id="ptz_text_7">' +
        '<input type="button" id="ptz_park_1" OnClick="KM.conf_ptz_set_park();" value="Set Position" disabled>' +
        '<input type="button" id="ptz_park_2" OnClick="KM.conf_ptz_test_park();" value="Test" disabled>' +
        ' Auto park seconds : ' +
        '<input type="text" id="ptz_park_delay" size="3" onfocus="KM.conf_ptz_highlight_apply();" disabled>&nbsp;' +
    '</div>' +

    '<br><hr style="margin:10px">' +

    '<div >' +
        '<div class="config_button" id="ptz_text_8">' +
            '<input type="button" id="ptz_preset_1" OnClick="KM.conf_ptz_set_preset(1);" value="Set Position" disabled>' +
            '<input type="button" id="ptz_preset_2" OnClick="KM.conf_ptz_test_preset(1);" value="Test" disabled>' +
            ' Preset 1: Activated by executing \'kmotion_ptz ' + KM.config.camera + ' 1\' in a BASH shell.'+
        '</div>' +

    '<div class="config_button" id="ptz_text_9">' +
        '<input type="button" id="ptz_preset_3" OnClick="KM.conf_ptz_set_preset(2);" value="Set Position" disabled>' +
        '<input type="button" id="ptz_preset_4" OnClick="KM.conf_ptz_test_preset(2);" value="Test" disabled>' +
        ' Preset 2: Activated by executing \'kmotion_ptz ' + KM.config.camera + ' 2\' in a BASH shell.'+
    '</div>' +

    '<div class="config_button" id="ptz_text_10">' +
        '<input type="button" id="ptz_preset_5" OnClick="KM.conf_ptz_set_preset(3);" value="Set Position" disabled>' +
        '<input type="button" id="ptz_preset_6" OnClick="KM.conf_ptz_test_preset(3);" value="Test" disabled >' +
        ' Preset 3: Activated by executing \'kmotion_ptz ' + KM.config.camera + ' 3\' in a BASH shell.'+
    '</div>' +

    '<div class="config_button" id="ptz_text_11">' +
        '<input type="button" id="ptz_preset_7" OnClick="KM.conf_ptz_set_preset(4);" value="Set Position" disabled>' +
        '<input type="button" id="ptz_preset_8" OnClick="KM.conf_ptz_test_preset(4);" value="Test" disabled>' +
        ' Preset 4: Activated by executing \'kmotion_ptz ' + KM.config.camera + ' 4\' in a BASH shell.'+
    '</div>' +
    '</div>' +

   '<br><hr style="margin:10px">' +

    '<div class="config_button" id="ptz_text_12" style="margin-top:50px">' +
        '<input type="button" id="ptz_apply" OnClick="KM.conf_ptz_apply();" value="Apply"> ' +
        'all changes to the local browser configuration and sync with the remote server.' +
    '</div>'+
	'<div>';

    if (KM.www_rc.ptz_enabled[KM.config.camera]) {
        html_str = html_str.replace(/disabled/g, '');
        html_str = html_str.replace(/gcam.png/, 'bcam.png');
        KM.conf_live_feed_daemon(KM.session_id.current, KM.config.camera);
    }
    document.getElementById('config_html').innerHTML = html_str;

    document.getElementById('ptz_enabled').checked = KM.www_rc.ptz_enabled[KM.config.camera];
    document.getElementById('ptz_track').selectedIndex = KM.www_rc.ptz_track_type[KM.config.camera] - 1;
    document.getElementById('ptz_calib_first').checked = KM.www_rc.ptz_calib_first[KM.config.camera];
    document.getElementById('ptz_step_x').value = KM.www_rc.ptz_step_x[KM.config.camera];
    document.getElementById('ptz_step_y').value = KM.www_rc.ptz_step_y[KM.config.camera];
    document.getElementById('ptz_servo_settle').value = KM.www_rc.ptz_servo_settle[KM.config.camera];
    document.getElementById('ptz_park_enabled').checked = KM.www_rc.ptz_park_enabled[KM.config.camera];
    document.getElementById('ptz_park_delay').value = KM.www_rc.ptz_park_delay[KM.config.camera];
    KM.config.ptz_alert_status_1 = false;
};


KM.conf_ptz_servo = function (button) {

    // A function that moves the camera by sending coded string crf<feed 2 digit>b<button 2 digit>$
    //
    // expects:
    // 'button' ... the clicked button
    //
    // returns:
    //

    KM.exe_script('/cgi_bin/xmlHttp_ptz.php', 'crf' + KM.pad_out2(KM.config.camera) + 'b' + KM.pad_out2(button) + '$')
    KM.conf_ptz_grey_LUDR();
    // all ptz cameras are set to 0:0 at the start, track the movements to
    // calculate abs position (in theory)
    if      (button === 1) KM.config.ptz_current_x -= KM.www_rc.ptz_step_x[KM.config.camera];
    else if (button === 2) KM.config.ptz_current_y += KM.www_rc.ptz_step_y[KM.config.camera];
    else if (button === 3) KM.config.ptz_current_y -= KM.www_rc.ptz_step_y[KM.config.camera];
    else                   KM.config.ptz_current_x += KM.www_rc.ptz_step_x[KM.config.camera];
};


KM.conf_ptz_calibrate = function () {

    // A function that moves the camera to 0:0
    //
    // expects:
    //
    // returns:
    //

    KM.conf_ptz_grey_LUDR();
    // reset camera to 0:0 by sending coded string 'caf<feed 2 digit>x<4 digits + 5000>y<4 digits + 5000>$'
    KM.exe_script('/cgi_bin/xmlHttp_ptz.php', 'caf' + KM.pad_out2(KM.config.camera) + 'x5000y5000$');
    KM.config.ptz_current_x = 0;
    KM.config.ptz_current_y = 0;
};


KM.conf_ptz_set_park = function () {

    // A function that sets the park position
    //
    // expects:
    //
    // returns:
    //

    KM.www_rc.ptz_park_x[KM.config.camera] = KM.config.ptz_current_x;
    KM.www_rc.ptz_park_y[KM.config.camera] = KM.config.ptz_current_y;
    KM.conf_ptz_highlight_apply();
};


KM.conf_ptz_test_park = function () {

    // A function that tests the park position
    //
    // expects:
    //
    // returns:
    //

    KM.conf_ptz_grey_LUDR();
    KM.config.ptz_current_x = KM.www_rc.ptz_park_x[KM.config.camera];
    KM.config.ptz_current_y = KM.www_rc.ptz_park_y[KM.config.camera];
    // test park position with string 'caf<feed 2 digit>x<4 digits>y<4 digits>$'
    KM.exe_script('/cgi_bin/xmlHttp_ptz.php', 'caf' + KM.pad_out2(KM.config.camera) + 'x' +
    KM.pad_out4(KM.www_rc.ptz_park_x[KM.config.camera] + 5000) + 'y' +
    KM.pad_out4(KM.www_rc.ptz_park_y[KM.config.camera] + 5000) + '$');
};


KM.conf_ptz_set_preset = function (preset) {

    // A function that sets the preset position
    //
    // expects:
    //
    // returns:
    //

    KM.www_rc['ptz_preset' + preset + '_x'][KM.config.camera] = KM.config.ptz_current_x;
    KM.www_rc['ptz_preset' + preset + '_y'][KM.config.camera] = KM.config.ptz_current_y;
    KM.conf_ptz_highlight_apply();
};


KM.conf_ptz_test_preset = function (preset) {

    // A function that tests the preset position
    //
    // expects:
    // 'preset' ... the preset number to test
    //
    // returns:
    //

    KM.conf_ptz_grey_LUDR();
    KM.config.ptz_current_x = KM.www_rc['ptz_preset' + preset + '_x'][KM.config.camera];
    KM.config.ptz_current_y = KM.www_rc['ptz_preset' + preset + '_y'][KM.config.camera];
    // test preset position with string 'caf<feed 2 digit>x<4 digits>y<4 digits>$'
    KM.exe_script('/cgi_bin/xmlHttp_ptz.php', 'caf' + KM.pad_out2(KM.config.camera) + 'x' +
    KM.pad_out4(KM.www_rc['ptz_preset' + preset + '_x'][KM.config.camera] + 5000) + 'y' +
    KM.pad_out4(KM.www_rc['ptz_preset' + preset + '_y'][KM.config.camera] + 5000) + '$');
};


KM.conf_ptz_enabled = function () {

    // A function that enables/disables the current PTZ gui
    //
    // expects:
    //
    // returns:
    //

    KM.conf_config_track.ptz_en_tt_modified(KM.config.camera);
    KM.conf_ptz_highlight_apply();
    if (document.getElementById('ptz_enabled').checked) {
        KM.conf_ptz_ungrey();
    } else {
        KM.conf_ptz_grey();
    }
};


KM.conf_ptz_highlight_apply = function () {

    // A function that highlights the 'need to apply' warning
    //
    // expects:
    //
    // returns:
    //

    document.getElementById('ptz_apply').style.fontWeight = 'bold';
    document.getElementById('ptz_apply').style.color = KM.BLUE;
    document.getElementById('ptz_text_12').style.color = KM.BLUE;
};


KM.conf_ptz_grey = function () {

    // A function that greys out the ptz screen
    //
    // expects:
    //
    // returns:
    //

    KM.session_id.current++; // needed to kill updates
    KM.conf_error_daemon(KM.session_id.current);
    KM.conf_ptz_grey_LUDR();
    var ids = ['ptz_track', 'ptz_calib_first', 'ptz_step_x', 'ptz_step_y',
    'ptz_servo_settle', 'ptz_calib', 'ptz_park_enabled', 'ptz_park_delay',
    'ptz_park_1', 'ptz_park_2', 'ptz_preset_1', 'ptz_preset_2', 'ptz_preset_3',
    'ptz_preset_4', 'ptz_preset_5', 'ptz_preset_6', 'ptz_preset_7',
    'ptz_preset_8'];

    for (var i = 0; i < ids.length; i++) {
		try {
			document.getElementById(ids[i]).disabled = true;
		} catch (e) {}
    }    
    document.getElementById('image').src = 'images/gcam.png';
};


KM.conf_ptz_grey_LUDR = function () {

    // A function that greys out the Left Up Down Right buttons
    //
    // expects:
    //
    // returns:
    //

    var ids = ['ptz_left', 'ptz_up', 'ptz_down', 'ptz_right'];
    for (var i = 0; i < ids.length; i++) {
		try {
			document.getElementById(ids[i]).disabled = true;
		} catch (e) {}
    }
};


KM.conf_ptz_ungrey = function () {

    // A function that un-greys the PTZ gui
    //
    // expects:
    //
    // returns:
    //

    KM.conf_live_feed_daemon(KM.session_id.current, KM.config.camera);

    var ids = ['ptz_track', 'ptz_calib_first', 'ptz_step_x', 'ptz_step_y',
    'ptz_servo_settle', 'ptz_calib', 'ptz_park_enabled', 'ptz_park_delay',
    'ptz_park_1', 'ptz_park_2', 'ptz_preset_1', 'ptz_preset_2', 'ptz_preset_3',
    'ptz_preset_4', 'ptz_preset_5', 'ptz_preset_6', 'ptz_preset_7',
    'ptz_preset_8'];
    for (var i = 0; i < ids.length; i++) {
		try {
			document.getElementById(ids[i]).disabled = false;
		} catch (e) {}
    }

    var ids = ['ptz_left', 'ptz_up', 'ptz_down', 'ptz_right'];
    for (var i = 0; i < ids.length; i++) {
		try {
			document.getElementById(ids[i]).disabled = false;
		} catch (e) {}
    }

    document.getElementById('image').src = 'images/bcam.png';
};


KM.conf_ptz_ungrey_LUDR = function () {

    // A function that un-greys out the Left Up Down Right buttons
    //
    // expects:
    //
    // returns:
    //

    if (KM.www_rc.ptz_enabled[KM.config.camera] && KM.config.session_id === KM.session_id.current) {
        var ids = ['ptz_left', 'ptz_up', 'ptz_down', 'ptz_right'];
        for (var i = 0; i < ids.length; i++) {
			try {
				document.getElementById(ids[i]).disabled = false;
			} catch (e) {}
        }
    }
};


KM.conf_ptz_apply = function () {

    // A function that checks and applys the changes
    //
    // expects:
    //
    // returns:
    //

    KM.www_rc.ptz_enabled[KM.config.camera] = document.getElementById('ptz_enabled').checked;
    KM.www_rc.ptz_calib_first[KM.config.camera] = document.getElementById('ptz_calib_first').checked;
    KM.www_rc.ptz_servo_settle[KM.config.camera] = document.getElementById('ptz_servo_settle').value;
    KM.www_rc.ptz_park_enabled[KM.config.camera] = document.getElementById('ptz_park_enabled').checked;

    // check for changes in key fields
    if (KM.www_rc.ptz_step_x[KM.config.camera] !== parseInt(document.getElementById('ptz_step_x').value, 10) ||
    KM.www_rc.ptz_step_y[KM.config.camera] !== parseInt(document.getElementById('ptz_step_y').value, 10)) {

        var step_x = parseInt(document.getElementById('ptz_step_x').value, 10);
        var step_y = parseInt(document.getElementById('ptz_step_y').value, 10);
        if (isNaN(step_x)) step_x = 0;
        if (isNaN(step_y)) step_y = 0;
        KM.www_rc.ptz_step_x[KM.config.camera] = step_x;
        KM.www_rc.ptz_step_y[KM.config.camera] = step_y;
        // feed value back to gui in case parseInt changes it
        document.getElementById('ptz_step_x').value = step_x;
        document.getElementById('ptz_step_y').value = step_y;
    }

    if (KM.www_rc.ptz_track_type[KM.config.camera] !== parseInt(document.getElementById('ptz_track').value, 10)) {
        KM.www_rc.ptz_track_type[KM.config.camera] = document.getElementById('ptz_track').value
        KM.conf_config_track.ptz_en_tt_modified(KM.config.camera);
    }

    var settle = parseFloat(document.getElementById('ptz_servo_settle').value, 10);
    if (isNaN(settle)) settle = 0;
    KM.www_rc.ptz_servo_settle[KM.config.camera] = settle;
    // feed value back to gui in case parseFloat changes it
    document.getElementById('ptz_servo_settle').value = settle;

    var delay = parseInt(document.getElementById('ptz_park_delay').value, 10);
    if (isNaN(delay)) delay = 0;
    KM.www_rc.ptz_park_delay[KM.config.camera] = delay;
    // feed value back to gui in case parseInt changes it
    document.getElementById('ptz_park_delay').value = delay;

    // reset any warning highlight on the apply line
    document.getElementById('ptz_apply').style.fontWeight = 'normal';
    document.getElementById('ptz_apply').style.color = KM.BLACK;
    document.getElementById('ptz_text_12').style.color = KM.DARK_GREY;

    KM.conf_config_track.ptz_misc_modified(KM.config.camera);
    KM.conf_config_track.sync();
};


/* ****************************************************************************
Config display - Schedules config screen

Displays and processes the schedules config screen
**************************************************************************** */

KM.conf_schedule_html = function (sched) {

    // A function that generates the weekly schedule HTML. It create the
    // schedule config screen on the config backdrop 'slab'.
    //
    // expects:
    // 'sched' ... the schedule number
    //
    // returns:
    //


sched = 1;



	var config_html = document.getElementById('config_html');	
	var width = config_html.clientWidth*0.9; 
    var html_str = '<br>' +

    '<div class="sched_selector" style="width:'+width+'px;">' +

	    '<select id="feed_camera" onchange="KM.conf_feed_change();">' +
		'<option value="1">Schedule 1</option>' +
		'<option value="2">Schedule 2</option>' +
		'<option value="3">Schedule 3</option>' +
		'<option value="4">Schedule 4</option>' +
		'<option value="5">Schedule 5</option>' +
		'<option value="6">Schedule 6</option>' +
		'<option value="7">Schedule 7</option>' +
		'<option value="8">Schedule 8</option>' +
	    '</select>' +

	    '<input type="button" id="sched_week"' +
	    'OnClick="KM.conf_sched_week();" value="Weekly Schedule">' +

	    '<input type="button" id="sched_except"' +
	    'OnClick="KM.conf_sched_week_except();" value="Exceptions to Weekly Schedule">' +

	'<span class="sched_status">&nbsp;Schedule Status : Inactive</span>' +

   '</div><br>' +

    KM.conf_sched_weekday(sched, 1, 'Monday') +
    KM.conf_sched_weekday(sched, 2, 'Tuesday') +
    KM.conf_sched_weekday(sched, 3, 'Wednesday') +
    KM.conf_sched_weekday(sched, 4, 'Thursday') +
    KM.conf_sched_weekday(sched, 5, 'Friday') +
    KM.conf_sched_weekday(sched, 6, 'Saturday') +
    KM.conf_sched_weekday(sched, 7, 'Sunday') +

    '<div class="config_text_margin">' +
	'<input type="button" id="sched_apply" OnClick="KM.conf_sched_apply(' + sched + ');" value="Apply Schedule Changes"> ' +
    '</div>';

    document.getElementById('config_html').innerHTML = html_str;
};


KM.conf_sched_weekday = function (sched, index, day) {

    // A function that generates the schedule buttons and time line html for
    // a particular day
    //
    // expects:
    // 'sched' ... the schedule number
    // 'index' ... the time line index number
    // 'day'   ... the 'day' string
    //
    // returns:
    // 'html' ... time line html
	var config_html = document.getElementById('config_html');	
	var width = config_html.clientWidth*0.9;
	var btn_width = width*0.15;

    return '<div class="sched_selector" style="width:'+width+'px; margin-bottom: 4px;">' +
		'<input type="button" style="width: '+btn_width+'px;" value="' + day + '">' +

		'<span style="float:right;">' +
		    '<input type="button"' +
		    'OnClick="KM.conf_sched_select_all(' + index + ');" value="Select All">' +

		    '<input type="button"' +
		    'OnClick="KM.conf_sched_select_invert(' + index + ');" value="Select Invert">' +

		    '<input type="button"' +
		    'OnClick="KM.conf_sched_select_none(' + index + ');" value="Select None">' +

		    '<input type="button"' +
		    'OnClick="KM.conf_sched_copy(' + index + ');" value="Copy">' +

		    '<input type="button"' +
		    'OnClick="KM.conf_sched_paste(' + index + ');" value="Paste">' +

		'</span>' +

	    '</div>' +

	    KM.conf_sched_tline(sched, index) +

	    '<div style="height: 10px;"></div>'
};


KM.conf_sched_tline = function (sched, index) {

    // A function that generates the schedule time line html
    //
    // expects:
    // 'sched' ... the schedule number
    // 'index' ... the time line index number
    //
    // returns:
    // 'html'  ... time line html

    // calculated rather than hard coded
	var config_html = document.getElementById('config_html');	
	var width = config_html.clientWidth*0.9;   
    var height = 25;
    var pos = 0, old_pos = 0;
    var mins = 0, hours = 0, title = '';
    var segments = (24 * 60) / 15;
    var scale = width / segments;
    var segment_width;

    // convert 4 x 6 digit hex to 96 bit bin, truncating as necessary
    var tline = KM.www_rc['sched_tline' + index][sched];
    var tmp;
    var segments_data = '';

    var tmp1 = tline.split('#');
    for (var i = 0; i < 4; i++) {
	var tmp2 = parseInt('0x' + tmp1[i], 16).toString(2)
	segments_data += tmp2.slice(0, 24);
    };

    // construct the html
    var tline = '' +
    '<div id="timeline" class="sched_timeline" style="width:' + width + 'px;">'

    for (var i = 1; i < segments + 1; i++) {
	pos = (i * scale);
	segment_width = pos - old_pos;
	old_pos = pos;

	// generate 'title' HH:MM-HH:MM
	mins = (i - 1) * 15;
	hours = parseInt(mins / 60);
	mins = mins - (hours * 60);
	title = KM.pad_out2(hours) + ":" + KM.pad_out2(mins) + " - " + KM.pad_out2(hours) + ":" + KM.pad_out2(mins + 14);

	tline += '<img id="tline_' + index + '_' + i + '" ' ;

	if (segments_data.charAt(i - 1) == '1') {
	    tline += 'src="./images/sched_green.png" ';
	} else {
	    tline += 'src="./images/sched_grey.png" ';
	}

	tline += 'style="width:' + segment_width + 'px;height:' + height +
	'px;" onClick="KM.sched_tline_clicked(' + index + ', ' + i + ')" title="' +
	title  + '" alt=" schedule timeline">';
    }

    tline += '</div>';
    return tline;
};


KM.sched_tline_clicked = function(index, segment) {

    // A function that inverts the clicked time line segment
    //
    // expects:
    // 'index'   ... the time line index number
    // 'segment' ... the clicked segment
    //
    // returns:
    //

    var ref = 'tline_' + index + '_' + segment;
    // a bodge, but an efficient one ... ouch !!!
    if (document.getElementById(ref).src.indexOf('green.png') != -1) {
	document.getElementById(ref).src = './images/sched_grey.png';
    } else {
	document.getElementById(ref).src = './images/sched_green.png';
    }
    KM.conf_sched_highlight_apply();
};


KM.conf_sched_select_all = function(index) {

    // A function that sets all the time line segments to green
    //
    // expects:
    // 'index' ... the time line index number
    //
    // returns:
    //

    var segments = (24 * 60) / 15;
    for (var i = 1; i < segments + 1; i++) {

	document.getElementById('tline_' + index + '_' + i).src = './images/sched_green.png';
    }
    KM.conf_sched_highlight_apply();
};


KM.conf_sched_select_invert = function(index) {

    // A function that inverts all the time line segments
    //
    // expects:
    // 'index' ... the time line index number
    //
    // returns:
    //

    var segments = (24 * 60) / 15;
    var ref;

    for (var i = 1; i < segments + 1; i++) {
	ref = 'tline_' + index + '_' + i;
	// a bodge, but an efficient one ... ouch !!!
	if (document.getElementById(ref).src.indexOf('green.png') != -1) {
	    document.getElementById(ref).src = './images/sched_grey.png';
	} else {
	    document.getElementById(ref).src = './images/sched_green.png';
	}
    }
    KM.conf_sched_highlight_apply();
};


KM.conf_sched_select_none = function(index) {

    // A function that sets all the time line segments to grey
    //
    // expects:
    // 'index' ... the time line index number
    //
    // returns:
    //

    var segments = (24 * 60) / 15;
    for (var i = 1; i < segments + 1; i++) {

	document.getElementById('tline_' + index + '_' + i).src = './images/sched_grey.png';
    }
    KM.conf_sched_highlight_apply();
};


KM.conf_sched_copy = function(index) {

    // A function that copies the state of the time line segments
    //
    // expects:
    // 'index' ... the time line index number
    //
    // returns:
    //

    var segments = (24 * 60) / 15;
    KM.config.sched_pastebin = '';

    for (var i = 1; i < segments + 1; i++) {
	if (document.getElementById('tline_' + index + '_' + i).src.indexOf('green.png') != -1) {
	    KM.config.sched_pastebin += '1';
	} else {
	    KM.config.sched_pastebin += '0';
	}
    }
    KM.conf_sched_highlight_apply();
};


KM.conf_sched_paste = function(index) {

    // A function that pastes the state of the time line segments
    //
    // expects:
    // 'index' ... the time line index number
    //
    // returns:
    //

    var segments = (24 * 60) / 15;

    for (var i = 1; i < segments + 1; i++) {
	if (KM.config.sched_pastebin.charAt(i - 1) === '1') {
	    document.getElementById('tline_' + index + '_' + i).src = './images/sched_green.png';
	} else {
	    document.getElementById('tline_' + index + '_' + i).src = './images/sched_grey.png';
	}
    }
    KM.conf_sched_highlight_apply();
};


KM.conf_sched_highlight_apply = function () {

    // A function that highlight the 'need to apply' warning
    //
    // expects:
    //
    // returns:
    //

    document.getElementById('sched_apply').style.fontWeight = 'bold';
    document.getElementById('sched_apply').style.color = KM.BLUE;
};


KM.conf_sched_apply = function (sched) {

    // A function that checks and applys the changes
    //
    // expects:
    //
    // returns:
    //

    var segments = (24 * 60) / 15;
    var tline;

    for (var index = 1; index < 8; index++) {

	// read the raw segment data
	tline = '';
	for (var segment = 1; segment < segments + 1; segment++) {
	    // a bodge, but an efficient one ... ouch !!!
	    if (document.getElementById('tline_' + index + '_' + segment).src.indexOf('green.png') != -1) {
		tline += '1';
	    } else {
		tline += '0';
	    }
	}

	// spliting and encodeing to hex
	for (var i = 1; 1 < 5; i++) {
	    alert(parseInt(tline.slice((i - 1) * 24, i * 24), 10).toString(16))
	}


    }

    alert(tline)
};




/* ****************************************************************************
Config display - Themes config screen

Displays and processes the themes config screen
**************************************************************************** */

KM.conf_theme_html = function() {
    document.getElementById('config_html').innerHTML = '<div style="height:50px;line-height:50px;background-color:#000000;color:#c1c1c1;margin:10px;padding-left:10px"><input type="radio" name="theme" value="0" onchange="KM.background_button_clicked(0);">Dark theme</div>' +
						'<div style="height:50px;line-height:50px;background-color:#ffffff;color:#505050;margin:10px;padding-left:10px"><input type="radio" name="theme" value="1" onchange="KM.background_button_clicked(1);">Light theme</div>'+
						'<input type="button" id="conf_apply" onclick="KM.conf_theme_apply();" value="Save">';
    document.getElementsByName('theme')[KM.www_rc.color_select].checked = true;

    //KM.www_rc.color_select = ;
}

KM.conf_theme_apply = function() {
	KM.conf_config_track.misc_modified();
    KM.conf_config_track.sync()
}

/* ****************************************************************************
Config display - motion error screen

Displays the motion error code
**************************************************************************** */


KM.conf_error_html = function() {

    // A function that generates the error backdrop HTML. It sisplay the motion
    // error text on the config backdrop 'slab'. If kernel/driver lockup
    // detected displays advice. This option is only available if the error
    // daemon detects motions output text containing errors.
    //
    // expects:
    //
    // returns:
    //
	
    var error_lines = KM.config.error_str.split("\n");
	KM.config.error_str=null;
	var error_str = '';
    for (var i = error_lines.length-1; i>=0; i--) {
	//for (var i = 0; i<error_lines.length; i++) {
        if (error_lines[i].search(KM.config.error_search_str) !== -1) {
			error_str += '<span style="color:' + KM.RED + ';">' + error_lines[i] + '</span><br>';
        }
		else {
			error_str += error_lines[i]+'<br>';
		}
    }
    document.getElementById('config_html').innerHTML = error_str;
};


/* ****************************************************************************
Config display - Load screen

Displays the server load error code
**************************************************************************** */


KM.conf_load_html = function() {

    // A function that generates the load backdrop HTML. It create the server
    // load screen on the config backdrop 'slab'. The server gets the stats by
    // parsing the output of 'top' and 'uname'.
    //
    // These stats are turned into colour coded cool bar graphs with an uptime
    // indicator for bragging rights.
    //
    // expects:
    //
    // returns:
    //

    var session_id = KM.session_id.current;	    
    var BAR_OK    = '#00FF00';
    var BAR_ALERT = '#FF0000';
	
	var config_html = document.getElementById('config_html');	
	var MAX_PX = config_html.clientWidth*0.9;

    config_html.innerHTML = '<br>' +

    '<div id="server_info" class="config_text_center">' +
        'Please wait - Downloading server data.' +
    '</div>' +

    '<br /><hr style="margin:10px" class="clear_float"/>'+

    '<div id="load_av_title" class="config_text_center">' +
        'Load Averages' +
    '</div>' +

    create_bar('1 min', 1) +
    create_bar('5 min', 2) +
    create_bar('15 min', 3) +

    '<br /><hr style="margin:10px" class="clear_float"/>' +

    '<div id="cpu_title" class="config_text_center">' +
        'Central Processing Unit' +
    '</div>' +

    create_bar('User', 4) +
    create_bar('System', 5) +
    create_bar('IO Wait', 6) +

    '<br /><hr style="margin:10px" class="clear_float"/>' +

    '<div id="memory_title" class="config_text_center">' +
        'Memory' +
    '</div>' +

    create_bar('System', 7) +
    create_bar('Buffered', 8) +
    create_bar('Cached', 9) +

    '<br /><hr style="margin:10px" class="clear_float"/>' +

    '<div id="swap_title" class="config_text_center">' +
        'Swap' +
    '</div>' +	

    create_bar('Swap', 10) +
	'<br /><hr style="margin:10px" class="clear_float"/>';

    function create_bar(text, bar_number) {
        if (KM.browser.browser_IE) { // ugly hack as a workaround for IE
            return '' +
            '<div class="bar_bground" style="margin-top:9px;width:'+MAX_PX+'px;">' +
                '<div id="bar_fground' + bar_number + '" class="bar_fground" style="background-color:' + BAR_OK + ';">' +
                '</div>' +
                '<span id="bar_text' + bar_number + '" class="bar_text_IE">' +
                text +
                '</span>' +
                '<span id="bar_value' + bar_number + '" class="bar_text_IE">' +
                '</span>' +
            '</div>';
        } else {
            return '' +
            '<div class="bar_bground" style="margin-top:9px;width:'+MAX_PX+'px;">' +
                '<span id="bar_text' + bar_number + '" class="bar_text">' +
                text +
                '</span>' +
                '<span id="bar_value' + bar_number + '" class="bar_value">' +
                '</span>' +
                '<div id="bar_fground' + bar_number + '" class="bar_fground" style="background-color:' + BAR_OK + ';">' +
                '</div>' +
            '</div>';
        }
    }

    function update_all(dblob) {
        // parse the passed data blob and create dbase object
        var dbase = {};
        var dblob_secs = dblob.split("$");

        // i = 1 because datablob starts with a $
        for (var i = 1; i < dblob_secs.length; i++) {
            var key = dblob_secs[i].substr(0, 2);

            // special case for string values else parseFloat
            if (key === 'bx' || key === 'sr' || key === 'up') {
                dbase[key] = dblob_secs[i].substr(3);
            } else {
                dbase[key] = parseFloat(dblob_secs[i].substr(3), 10);
            }
        }
		try {
			update_text(dbase);
			update_bars(dbase);
		} catch (e) {			
            KM.kill_timeout_ids(KM.CONFIG_LOOP);        
		}
    }

    function update_text(dbase) {
        document.getElementById('server_info').innerHTML = dbase.bx + ' ' +
        dbase.sr + ' Uptime ' + dbase.up;
        document.getElementById('memory_title').innerHTML = 'Memory ' + dbase.mt + 'k';
        document.getElementById('swap_title').innerHTML = 'Swap ' + dbase.st + 'k';
    }

    function update_bars(dbase) {
        // load average 1 min
        document.getElementById('bar_value1').innerHTML = dbase.l1;
        var tmp = Math.min(dbase.l1, 1.5);
        document.getElementById('bar_fground1').style.width = (tmp * (MAX_PX / 1.5)) + 'px';

        // load average 5 min
        document.getElementById('bar_value2').innerHTML = dbase.l2;
        tmp = Math.min(dbase.l2, 1.5);
        document.getElementById('bar_fground2').style.width = (tmp * (MAX_PX / 1.5)) + 'px';
        if (tmp >= 1) {
            document.getElementById('bar_fground2').style.backgroundColor = BAR_ALERT;
        } else {
            document.getElementById('bar_fground2').style.backgroundColor = BAR_OK;
        }

        // load average 15 min
        document.getElementById('bar_value3').innerHTML = dbase.l3;
        tmp = Math.min(dbase.l3, 1.5);
        document.getElementById('bar_fground3').style.width = (tmp * (MAX_PX / 1.5)) + 'px';
        if (tmp >= 1) {
            document.getElementById('bar_fground3').style.backgroundColor = BAR_ALERT;
        } else {
            document.getElementById('bar_fground3').style.backgroundColor = BAR_OK;
        }

        // CPU user
        document.getElementById('bar_value4').innerHTML = dbase.cu + '%';
        tmp = (dbase.cu / 100) * MAX_PX;
        document.getElementById('bar_fground4').style.width = tmp + 'px';

        // CPU system
        document.getElementById('bar_value5').innerHTML = dbase.cs + '%';
        tmp = (dbase.cs / 100) * MAX_PX;
        document.getElementById('bar_fground5').style.width = tmp + 'px';

        // CPU IO wait
        document.getElementById('bar_value6').innerHTML = dbase.ci + '%';
        tmp = (dbase.ci / 100) * MAX_PX;
        document.getElementById('bar_fground6').style.width = tmp + 'px';

        // memory system
        var non_app = dbase.mf + dbase.mb + dbase.mc;
        var app = dbase.mt - non_app;
        document.getElementById('bar_value7').innerHTML = app + 'k';
        tmp = (app / dbase.mt) * MAX_PX;
        document.getElementById('bar_fground7').style.width = tmp + 'px';

        // memory buffers
        document.getElementById('bar_value8').innerHTML = dbase.mb + 'k';
        tmp = (dbase.mb / dbase.mt) * MAX_PX;
        document.getElementById('bar_fground8').style.width = tmp + 'px';

        // memory cached
        document.getElementById('bar_value9').innerHTML = dbase.mc + 'k';
        tmp = (dbase.mc / dbase.mt) * MAX_PX;
        document.getElementById('bar_fground9').style.width = tmp + 'px';

        // swap
        document.getElementById('bar_value10').innerHTML = dbase.su + 'k';
        dbase.st = Math.max(dbase.st, 1);  // if no swap, avoids div 0
        tmp = (dbase.su / dbase.st);
        document.getElementById('bar_fground10').style.width = (tmp * MAX_PX) + 'px';
        if (tmp >= 0.1) {
            document.getElementById('bar_fground10').style.backgroundColor = BAR_ALERT;
        } else {
            document.getElementById('bar_fground10').style.backgroundColor = BAR_OK;
        }
    }

    function rolling_update() {
        // repeat until data blob received from 'xmlHttp_load.py'
        // then call 'update' with the received data blob, then repeat.

        function request() {
            // local 'xmlHttp' object to enable multiple instances, one for each
            // function call.
            var xmlHttp = KM.get_xmlHttp_obj();
            xmlHttp.onreadystatechange = function () {
                if (xmlHttp.readyState === 4) {
                    xmlHttp.onreadystatechange = null; // plug memory leak
                    var dblob = xmlHttp.responseText.trim();
                    // final integrity check - if this data gets corrupted we are
                    // in a world of hurt ...
                    // 'dblob.substr(dblob.length - 4)' due to IE bug !
                    if (parseInt(dblob.substr(dblob.length - 4), 10) === dblob.length - 8 &&
                    KM.session_id.current === session_id) {
                        update_all(dblob);
                    }
                }
            };
            xmlHttp.open('GET', '/cgi_bin/xmlHttp_load.php' + '?rnd=' + new Date().getTime(), true);
            xmlHttp.send(null);
        }

        function reload() {
            request();
            // check for current session id
            if (KM.session_id.current === session_id) {
                KM.add_timeout_id(KM.CONFIG_LOOP, setTimeout(function () {reload(); }, 2000));
            }
        }
            reload(); // starts the enclosure process when 'rolling_update' is started
    }
    rolling_update();
};


/* ****************************************************************************
Main Display - About Code

Insert the 'about' HTML and provide linking code
**************************************************************************** */


KM.display_about = function () {

    // A function to insert the 'about' HTML and provide linking code
    //
    // expects:
    //
    // returns:
    //

    KM.session_id.current++;

    document.getElementById('main_display').innerHTML = '' +


    '<div class="title" style="width: 992px;">' +
	'kmotion: About' +
    '</div>' +

    '<div class="divider">' +
        '<img src="images/about_divider_color.png" alt="" >' +
    '</div>' +

    '<div class="para_msg">' +
	'<p>My name is Dave Selby the developer of kmotion and ' +
	'<span class="link_word" onClick="javascript: ' +
	'KM.about_link_to(\'http://code.google.com/p/kmotion2\');">kmotion v2</span>' +
	'. This is my pet project which I develop in my spare time. ' +
	'Unfortunately I don\'t work in the IT industry but if you email me at '+
	'dave6502@googlemail.com I will send you my CV ;)</p>' +

	'<p>On a personal note I would like to thank ' +
	'<span class="link_word" onClick="javascript: ' +
	'KM.about_link_to(\'http://picasaweb.google.com/jazzcommunication\');">Gudy</span>' +
	' for his many many hours of ' +
	'testing and bug reporting on the \'live\' code. kmotion v2 would not be where it is now without ' +
	'his help - thank you Gudy.</p>' +

	'<p>I would also like to thank ' +
	'<span class="link_word" onClick="javascript: ' +
	'KM.about_link_to(\'http://www.prunk.si\');">Jan Prunk </span>' +
	'for providing the '+
	'<span class="link_word" onClick="javascript: ' +
	'KM.about_link_to(\'http://www.kmotion.eu\');">\'www.kmotion.eu\' </span>' +
	'domain, website and blog all without charge allowing kmotion to move ' +
	'to the next level - thank you Jan.</p>' +

	'<p>And I would like to thank ' +
	'<span class="link_word" onClick="javascript: ' +
	'KM.about_link_to(\'http://www.wingware.com/\');">Wingware</span> ' +
	'for supplying a copy of their superb Python IDE without which this ' +
	'project would have taken much much longer. It has also proven itself ' +
	'as an excellent Javascript, BASH, HTML and CSS editor!</p>' +

	'<p>Lastly if you like the software please feel free to drop me some $ ' +
	'via paypal to the above address. Failing that if you are as poor as ' +
	'me, do me a favour and send me a screenshot of your site. If you ' +
	'give permission I will paste it on the site. Enjoy.</p>' +
	'<p>Released under the ' +
	'<span class="link_word" onClick="javascript: ' +
	'KM.about_link_to(\'http://www.gnu.org/licenses/gpl.html\');">GPL v3.</span></p>' +
    '</div>';
};

KM.about_link_to = function (url) {
    // link to the URL
    document.getElementById('main_display').innerHTML = '' +
    '<object data="' + url + '" type="text/html"' +
    'width="100%" height="100%"' +
    '</object>';
};


/* ****************************************************************************
Main Display - Msg Code

Insert the 'msg' HTML and populate with a custom message if avaliable.
**************************************************************************** */


KM.display_msg = function() {

    // A function to insert the 'msg' HTML and populate with a custom message
    // if avaliable.
    //
    // expects:
    //
    // returns:
    //

    KM.session_id.current++;

    if (KM.www_rc.msg.length < 5) {

        document.getElementById('main_display').innerHTML = '' +

	'<div class="title" style="width: 992px;">' +
	    'kmotion: Message' +
	'</div>' +

	'<div class="divider">' +
	    '<img src="images/message_divider_color.png" alt="" >' +
	'</div>' +

        '<div class="para_msg"><p style="text-align: center">No Messages ...</p></div>';

    } else {
	document.getElementById('main_display').innerHTML = '' +
	'<div class="para_msg">' + KM.collapse_chars(KM.www_rc.msg) + '</div>';
    }
};


/* ****************************************************************************
System - Misc code

The bootup code ...
**************************************************************************** */


KM.init1 = function () {

    // A function that performs early system initialization and downloads the
    // settings data from the server before calling 'init2'
    //
    // expects :
    //
    // returns :
    //

    KM.feed_cache_setup();
    KM.update_feeds();
    var callback = KM.init2;
    KM.load_settings(callback);
};


KM.init2 = function (data) {

    // A function that performs the main startup initialization. Delays are
    // built in to enable preload and default values are set.
    //
    // expects :
    // 'data' ... the settings data
    //
    // returns :
    //

    KM.add_timeout_id(KM.DISPLAY_LOOP, setTimeout(function () {init_interface(); }, 1000));

    function init_interface() {

	// A function that performs final initialization and 'msg' handleing
	//
	// expects :
	//
	// returns :
	//
        KM.background_button_clicked(KM.www_rc.color_select);
        KM.enable_display_buttons(KM.www_rc.display_select);
        KM.enable_camera_buttons();
		if (KM.www_rc.hide_button_bar)
			KM.toggle_button_bar();

	    // flip mode if 'msg' avaliable
            if (KM.www_rc.msg.length < 5) {
                KM.enable_function_buttons(1); // select 'live' mode
                KM.function_button_clicked(1); // start 'live' mode
            } else {
                KM.enable_function_buttons(7); // select 'msg' mode
                KM.function_button_clicked(7); // start 'live' mode
            }
    }
};

var tm=0;
var paused=false;
var movie_duration=0;
var next_event_secs=0;
var cur_event_secs=0;
var current_play_accel=0;

///////////////////FLASHPLAYER EVENTS//////////////////////////////

function ktVideoProgress(time) {
// вызывается каждую секунду проигрывания видео
	tm=parseInt(time,10);
	if ((current_play_accel>4)&&(current_play_accel<8)){
		if (document.getElementById('flashplayer')['jsScroll']) {
			document.getElementById('flashplayer').jsScroll(++tm);
		}
	}
	KM.update_title_clock(cur_event_secs);
}

function ktVideoFinished() {
	tm=0;
	KM.arch_event_clicked(next_event_secs);
}

function ktVideoScrolled(time) {
// вызовется при перемотке видео
	tm=parseInt(time,10);
	KM.update_title_clock(cur_event_secs);
}

function ktVideoStarted() {
// вызовется при нажатии на кнопку play
	paused=false;
}

function ktVideoPaused() {
// вызовется при нажатии на кнопку pause
	paused=true;
}

function ktVideoStopped() {
// вызовется при нажатии на кнопку stop
	paused=true;
}

function ktPlayerLoaded() {
	tm=0;
	document.onkeydown = function(e) {
		if (document.getElementById('flashplayer')) {			
			var flashplayer=document.getElementById('flashplayer');
			switch (e.which) {
			case 39:
				if (flashplayer['jsScroll']) {
					tm+=1;
					if (tm<=movie_duration-1)
						flashplayer.jsScroll(tm);
				}
				break;
			case 37:
				if (flashplayer['jsScroll']) {
					tm-=1;	
					if (tm>=1)
						flashplayer.jsScroll(tm);
				}
				break;
			case 32:
				if (paused) {
					if (flashplayer['jsPlay']) {
						flashplayer.jsPlay();
						paused=false;
					}
				}
				else {
					if (flashplayer['jsPause']) {
						flashplayer.jsPause();
						paused=true;
					}
				}
				break;
			}
			KM.update_title_clock(cur_event_secs);
			flashplayer=null;
		}
	}
}

/////////////////HTML5PLAYER EVENTS/////////////////////////

function html5VideoProgress() {
	if (document.getElementById('html5player')) {
		var html5player=document.getElementById('html5player');
		var rate=1;
		if (current_play_accel<4)
			rate=0.5;
		if (current_play_accel>4)
			rate=2;
			
		html5player.playbackRate=rate;
		tm=html5player.currentTime;
		KM.update_title_clock(cur_event_secs);
		html5player=null;
	}	
	
}

function html5VideoScrolled() {
	if (document.getElementById('html5player')) {
		var html5player=document.getElementById('html5player');
		tm=html5player.currentTime;
		KM.update_title_clock(cur_event_secs);
		html5player=null;
	}
}

function html5VideoFinished() {
	tm=0;
	KM.arch_event_clicked(next_event_secs);
}

function html5playerPlayPause() {
	if (document.getElementById('html5player')) {
		var html5player=document.getElementById('html5player');
		if (html5player.paused)
			html5player.play();
		else
			html5player.pause();
		html5player=null;
	}	
}

function html5VideoLoaded() {
	document.onkeydown = function(e) {
		if (document.getElementById('html5player')) {
			var html5player=document.getElementById('html5player'); 
			switch (e.which) {
			case 39:
				tm+=1;
				if (tm<=html5player.duration-1)
					html5player.currentTime=tm;
				break;
			case 37:
				tm-=1;
				if (tm>=1)
					html5player.currentTime=tm;
				break;
			case 32:
				html5playerPlayPause();
				tm=html5player.currentTime;
				break;
			}
			KM.update_title_clock(cur_event_secs);
			html5player=null;
		}
	}
};




KM.init1();










