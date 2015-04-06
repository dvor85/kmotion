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
    camera_sec_enabled:  false    
};

KM.live = {
    last_camera_select: 0, // the last camera selected
    latest_events: [],
    fps: 1
};


KM.conf = {
    session_id:	     0, // the session id
    camera:          1, // the current camera
    mask:           '', // the current expanded mask string
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

KM.max_feed = function () {
    var max = 0;
    for (var feed in KM.config.feeds) {
        max = Math.max(max,feed)
    }
    return max;
};

KM.config = {};

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

KM.browser.setTitle = function() {
    document.getElementById('version_num').innerHTML = 'Ver ' + KM.config.version;
	document.getElementsByTagName('title')[0].innerHTML = KM.config.title;
};

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
                try {
                    KM.config = JSON.parse(xmlHttp.responseText);
                    got_settings = true;
                    KM.kill_timeout_ids(KM.GET_DATA);
                    set_settings(callback);
                } catch(e) {
                }
                
            }
	    };
	    xmlHttp.open('GET', '/ajax/config?read='+ Math.random(), true);
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


    function set_settings(callback) {

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
        if (list[i].toString() == str_item) {
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
        if (i == button) {
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

KM.menu_bar_buttons.construct_camera_sec = function() {
    var camsel='';
    for (var f in KM.config.feeds) {
        if ((f % 4) == 0)
            camsel+='<div id="cb'+f+'" class="camera_button" onClick="KM.camera_func_button_clicked('+f+');"><span id="ct'+f+'">'+f+'</span></div>\n</div>';							
        else if 	((f % 4) == 1)
            camsel+='<div class="button_line">\n<div id="cb'+f+'" class="camera_button" onClick="KM.camera_func_button_clicked('+f+');"><span id="ct'+f+'">'+f+'</span></div>';							
        else
            camsel+='<div id="cb'+f+'" class="camera_button" onClick="KM.camera_func_button_clicked('+f+');"><span id="ct'+f+'">'+f+'</span></div>\n';							
    }			
    f=f-1;			
    if ((f % 4) != 0) 
        camsel+='</div>';
    document.getElementById('camera_sec').innerHTML = camsel;
};


KM.enable_camera_buttons = function () {

    // A function that enables the 16 camera buttons
    //
    // expects :
    //
    // returns :
    //

    document.getElementById('camera_func_header').innerHTML = 'Camera Select';
    for (var f in KM.config.feeds) {
        try {
            document.getElementById('ct' + f).innerHTML = f;
            document.getElementById('cb' + f).style.background = 'url(images/temp1.png) no-repeat bottom left';
            if (KM.config.feeds[f].feed_enabled) {
                document.getElementById('ct' + f).style.color = KM.BLUE;
            } else {
                document.getElementById('ct' + f).style.color = KM.GREY;
            }
        } catch(e) {}
    }
    KM.menu_bar_buttons.camera_sec_enabled = true;
};

// update camera buttons
KM.update_camera_buttons = KM.enable_camera_buttons;
    
KM.disable_camera_buttons = function () {

    // A function that disables the 16 camera buttons
    //
    // expects :
    //
    // returns :
    //

    document.getElementById('camera_func_header').innerHTML = 'Camera Select';
    for (var f in KM.config.feeds) {
        try {
            document.getElementById('cb' + f).style.background = 'url(images/temp1.png) no-repeat bottom left';
            document.getElementById('ct' + f).innerHTML = f;
            document.getElementById('ct' + f).style.color = KM.GREY;
        } catch(e) {}
    }
    KM.menu_bar_buttons.camera_sec_enabled = false;
};


KM.enable_func_buttons = function () {

    // A function that enables the 16 camera function buttons
    //
    // expects :
    //
    // returns :
    //

    document.getElementById('camera_func_header').innerHTML = 'Function Select';
    for (var f in KM.config.feeds) {
        try {
            document.getElementById('ct' + f).innerHTML = 'f' + f;
            document.getElementById('cb' + f).style.background = 'url(images/temp3.png) no-repeat bottom left';
            if (KM.config.func_enabled[f]) {
                document.getElementById('ct' + f).style.color = KM.BLUE;
            } else {
                document.getElementById('ct' + f).style.color = KM.GREY;
            }
        } catch (e) {}
    }
    KM.menu_bar_buttons.camera_sec_enabled = false;
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
    }
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
    'logs_button_enabled', 'config_button_enabled'];

	var misc_function_display="none";

    for (var i = 1; i < buttons.length; i++) {
        if (KM.config.misc[buttons[i]] || i == 1) {
            if (i == button) {
                document.getElementById('ft' + i).style.color = KM.RED;
				document.getElementById('ft' + i).parentNode.style.display="block";
				misc_function_display="block";

	    } else {
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
        KM.config.misc.display_select = button;
        KM.live.last_camera_select = 0;
        KM.display_live_normal();

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

    if (KM.menu_bar_buttons.camera_sec_enabled) {
        KM.blink_camera_func_button(button);
        if (KM.menu_bar_buttons.camera_sec_enabled) {
            KM.live.last_camera_select = button;
            KM.config.display_feeds[1][0] =  button;
            if (KM.config.misc.display_select == 1) {
                // if '1' change view directly as a special case               
                KM.live.last_camera_select = 0;
                KM.display_live_normal();
               
            }
        
        }
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
                KM.enable_display_buttons(KM.config.misc.display_select);
                KM.enable_camera_buttons();	    
                KM.display_live_normal();
                break;

            case 2: // 'archive button'
                KM.disable_display_buttons();
                KM.disable_camera_buttons();
                KM.display_archive();
                current_play_accel=4;
                break;

            case 3: // 'log button'
                KM.disable_display_buttons();
                KM.disable_camera_buttons();
                KM.display_logs();
                break;

            case 4: // 'config button'
                KM.disable_display_buttons();
                KM.disable_camera_buttons();
                KM.display_config();
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
        'logs_button_enabled', 'config_button_enabled'];
    return (button < 2 || KM.config.misc[buttons[button]]);
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

    KM.config.misc.color_select = color;
};


/* ****************************************************************************
Live display - Misc code

Miscellaneous code that provides general closures and functions for kmotions
live display
**************************************************************************** */


KM.update_events = function () {

    // A function that get the latest jpeg filenames and event status from
    // the server with an 'xmlHttp' call then splits the returned data and
    // stores it in 'KM.feeds.latest_jpegs' and 'KM.feeds.latest_events'.
    //
    // expects :
    //
    // returns :
    //

    var xmlHttp = KM.get_xmlHttp_obj();

    xmlHttp.onreadystatechange = function () {
	if (xmlHttp.readyState === 4) {
	    xmlHttp.onreadystatechange = null; // plug memory leak
	    var jdata = JSON.parse(xmlHttp.responseText);
		KM.live.latest_events = jdata.events;
	    }
    };

    xmlHttp.open('GET', '/ajax/feeds?'+Math.random() + '&rdd='+encodeURIComponent(KM.config.ramdisk_dir), true);
    xmlHttp.send(null);
	
};

KM.get_jpeg = function (feed) {
    return  '/kmotion_ramdisk/'+KM.pad_out2(feed)+'/last.jpg?'+Math.random();
}

KM.update_jpegs = function () {
	for (var feed in KM.config.display_feeds[KM.config.misc.display_select]) {
        try {            
            if (KM.config.feeds[feed].feed_enabled && (KM.item_in_array(feed, KM.live.latest_events))) {	
                if (document.getElementById('image_'+feed))
                    document.getElementById('image_'+feed).src=KM.get_jpeg(feed);
            }
        } catch (e) {}
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

    var text_color;
    for (var feed in KM.config.display_feeds[KM.config.misc.display_select]) {
        try {
            text_color = KM.WHITE;           
            if (KM.config.feeds[feed].feed_enabled) {
                text_color = KM.BLUE;
                if (KM.item_in_array(feed, KM.live.latest_events)) {
                    text_color = KM.RED;
                }
            }
            if (document.getElementById("text_" + feed))
                document.getElementById("text_" + feed).style.color = text_color;
        } catch (e) {}
    }
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
    if (html_count>KM.max_feed()) return;
	
    try {
        var feed = KM.config.display_feeds[display_num][html_count];
        if (KM.config.feeds[feed].feed_enabled) {
            jpeg = KM.get_jpeg(feed);	    
            text_color = KM.BLUE;	 
            if (KM.config.feeds[feed].feed_name) {
                text = KM.config.feeds[feed].feed_name;
            } else {
                text = 'Cam ' + (html_count+1);
            }
        }
        text = feed + ' : ' + text;

        
        var l1 = '<img id="image_' + feed + '" ';
        var l2 = 'style="position:absolute; ';
        var l3 = 'left:' + left + 'px; ';
        var l4 = 'top:' + top + 'px; ';
        var l5 = 'width:' + width + 'px; ';
        var l6 = 'height:' + height + 'px;" ';
        var l7 = 'src="' + jpeg + '"; ';
        var l8 = 'onClick="KM.camera_jpeg_clicked(' + feed + ')"; ';
        var l9 = 'alt="">';
        html = html + l1 + l2 + l3 + l4 + l5 + l6 + l7 + l8 + l9;

        var l10 = '<span id="text_' + feed + '"; ';
        var l11 = 'style="position:absolute; ';
        var l12 = 'left:' + (left + text_left) + 'px; ';
        var l13 = 'top:' +  (top + text_top) + 'px;';
        var l14 = 'font-weight: bold;';
        var l15 = 'color:' + text_color  + ';';
        var l16 = '">' + text + '</span>';
        html = html + l10 + l11 + l12 + l13 + l14 + l15 + l16;
    } catch (e) {}
    html_count++;
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

	    cols = Math.ceil(Math.sqrt(KM.max_feed()));//5;//
		rows = Math.ceil((KM.max_feed())/cols);
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
    var camera_pos=KM.config.display_feeds[KM.config.misc.display_select].indexOf(camera);
    if (KM.live.last_camera_select !== 0) {
		var camera_last_pos=KM.config.display_feeds[KM.config.misc.display_select].indexOf(KM.live.last_camera_select);
		var camera_old=KM.config.display_feeds[KM.config.misc.display_select][camera_pos];
		if (KM.config.feeds[KM.live.last_camera_select].feed_enabled) {
		    KM.config.display_feeds[KM.config.misc.display_select][camera_pos]=KM.live.last_camera_select;
		    if (camera_last_pos>0) {
			KM.config.display_feeds[KM.config.misc.display_select][camera_last_pos]=camera_old;
		    }
		}
        KM.live.last_camera_select = 0;
    } else {
        KM.config.display_feeds[1][0] = KM.config.display_feeds[KM.config.misc.display_select][camera_pos];
        KM.config.misc.display_select = 1;
        KM.update_display_buttons(1);
        
    }
   
    KM.display_live_normal();
   
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
    KM.init_display_grid(KM.config.misc.display_select);

    // exit if no feeds enabled, else 100% CPU usage
    var no_feeds = true;
    for (var feed in KM.config.display_feeds[KM.config.misc.display_select]) {
        try {
            if (KM.config.feeds[feed].feed_enabled) {
                no_feeds = false;
            }
        } catch (e) {}
    }
    if (no_feeds) return; // no feeds
    refresh(KM.session_id.current);   

        function refresh(session_id) {

            // A function that performs the main refresh loop, complex by
            // necessity
            //
            // expects:
            //
            // returns:
            //

            // refresh the grid display
            
            KM.kill_timeout_ids(KM.DISPLAY_LOOP); // free up memory from 'setTimeout' calls
            if (KM.session_id.current === session_id) {
                KM.update_events();
                KM.text_refresh();
                KM.update_jpegs();                 
                KM.add_timeout_id(KM.DISPLAY_LOOP, setTimeout(function () {refresh(session_id); }, 1000/KM.live.fps));
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

	    if (button == 1) { // fast play backward
		if (play_accel > 2) {
		    play_accel = 2;
		} else {
		    play_accel--;
		    play_accel = Math.max(1, play_accel);
		}
		update_button_bar_play_mode();


	    } else if (button == 2) { // play backward
		play_accel = 3;
		update_button_bar_play_mode();


	    } else if (button == 3) { // frame mode
		KM.session_id.current++;
		play_mode = false;
		update_button_bar_frame_mode();


	    } else if (button == 4) { // play forward
		play_accel = 4;
		update_button_bar_play_mode();


	    } else if (button == 5) { // fast play forward
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

	    if (button == 1) { // -event
		prev_event();

	    } else if (button == 2) { // -frame
		play_accel = 3; // play backward
		play_backward();

	    } else if (button == 3) { // play mode
		play_mode = true;
		play_accel = 4; // play forward
		update_button_bar_play_mode();
		play_forward();

	    } else if (button == 4) { // +frame
		play_accel = 4; // play forward
		play_forward();

	    } else if (button == 5) { // +event
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
	    for (var f in KM.config.feeds) {
            try {
                if (KM.config.feeds[f].feed_enabled) 
                    cams+=f+',';
            } catch(e) {}                
	    }
	    cams=cams.slice(0,-1);
	    xmlHttp.open('GET', '/cgi_bin/xmlHttp_arch.php?'+Math.random()+'&date=00000000&cam=0&func=avail&cams='+cams, true);
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
	    xmlHttp.open('GET', '/cgi_bin/xmlHttp_arch.php?'+Math.random()+'&date=' + date + '&cam=' + camera + '&func=index', true);
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
        var events = JSON.parse(dblob).split('\n');
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
                if (KM.session_id.current === session_id) {
                    got_logs = true;
					KM.cull_timeout_ids(KM.LOGS);
                    show_logs(dblob);
                }
            }
        };
        xmlHttp.open('GET', '/ajax/logs?'+Math.random(), true);
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
    
    var config = {};
    var warning_msg = false;
    
    return {
    
        init: function() {
            config = JSON.parse(JSON.stringify(KM.config));
        },
   
        misc_modified: function() {
            config._misc_modified = true;
        },

        // the color scheme, camera layout or selected layout has been modified
        display_modified: function() {
            config._display_modified = true;
        },

        // the feeds has been modified
        feed_modified: function(i) {
            config.feeds[i]._modified = true;            
            warning_msg = true;
        },

        // the feeds masks have been modified
        mask_modified: function(i) {
            config.feeds[i]._mask_modified = true;
            warning_msg = true;
        },
        
        reset: function() {
            KM.conf_config_track.init();
        },

        sync: function() {
            // sync 'www_rc' with server 'www_rc'
            if (!config._misc_modified) {
                delete(config.misc.archive_button_enabled);
                delete(config.misc.archive_button_enabled);
                delete(config.misc.config_button_enabled);
                delete(config.misc.hide_button_bar); 
            };
            
            if (!config._display_modified) {
                delete(config.display_feeds);
                delete(config.misc.color_select);
                delete(config.misc.display_select);
            }
            
            for (var feed in config.feeds) {
                try {
                    if (!config.feeds[feed]["_modified"]) {
                        if (!config.feeds[feed]["_mask_modified"]) {
                            delete(config.feeds[feed]);                            
                        }
                    } else if (!config.feeds[feed]["_mask_modified"]) { 
                        delete(config.feeds[feed]["feed_mask"]);
                        delete(config.feeds[feed]["_mask_modified"]);
                    }
                } catch (e) {}
            }
            
            var jdata = JSON.stringify(config);
            var xmlHttp = KM.get_xmlHttp_obj();
            xmlHttp.open('POST', '/ajax/config?write='+Math.random());
            xmlHttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            xmlHttp.send('jdata=' + jdata);
        

            if (warning_msg) {
                alert('The current synchronisation with the remote server\n\
                        involves reloading of the motion daemon configuration.\n\nDuring the reload \
                        kmotion will experience temporary\nvideo freezing.');
            };
            KM.conf_config_track.reset();
        }
    }
}();


KM.conf_error_daemon = function (session_id) {

    // A closure that acts as a daemon updateing 'KM.conf.error_str' with
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
                if (KM.session_id.current === session_id) {
                    KM.conf.error_str = JSON.parse(data);
					// scan the string looking for errors
					var error_lines = KM.conf.error_str.split("\n");
					var error_flag = false;
					for (var i = 0; i < error_lines.length; i++) {
						if (error_lines[i].search(KM.conf.error_search_str) !== -1) {
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
		xmlHttp.open('GET', '/ajax/outs?'+Math.random(), true);
		xmlHttp.send(null);
    }

    function reload() {
        request();
        // check for current session id
        if (KM.session_id.current === session_id) {
            KM.cull_timeout_ids(KM.ERROR_DAEMON);
            KM.add_timeout_id(KM.ERROR_DAEMON, setTimeout(function () {reload(); }, 2000));
			//if (KM.conf.error_str!="")
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

    
    KM.conf_backdrop_html();

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
	var button_width = backdrop_width / 5;


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

	    '<input type="button" value="Misc" id="misc_button" onclick="KM.conf_misc_html()" '+
	    'style="width:' + button_width + 'px;"/>' +
	    '<input type="button" value="Cameras" id="feed_button" onclick="KM.conf_feed_html()" '+
	    'style="width:' + button_width + 'px;"/>' +	    
	    '<input type="button" value="Themes" id="theme_button" onclick="KM.conf_theme_html()" '+
	    'style="width:' + button_width + 'px;"/>' +
	    '<input type="button" value="Motion Errors" id="error_button" onclick="KM.conf_select_errors();" ' +
	    'style="width:' + button_width + 'px;"/>' +
	    '<input type="button" value="Server Load" onclick="KM.conf_select_load();" ' +
	    'style="width:' + button_width + 'px;"/>' +

	'</div>' +

	'<div id="config_html" style="height:'+config_height+'px;"></div>' +

    '</div>';
	
    
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



KM.conf_select_errors = function() {

    // A function that is executed when the 'errors' button is clicked
    //
    // expects:
    //
    // returns:
    //
    //KM.conf.error_str="";
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
				<div class="config_tick_margin">\
                  <input type="checkbox" id="misc_live" checked="checked" disabled="disabled" />Live button enabled.<br>\
                  <input type="checkbox" id="misc_logs" onclick="KM.conf_misc_highlight_apply();" />Logs button enabled.<br>\
                  <input type="checkbox" id="misc_archive" onclick="KM.conf_misc_highlight_apply();" />Archive button enabled.<br>\
                </div>\
				<div class="config_tick_margin">\
					<input type="checkbox" id="misc_config" onclick="KM.conf_misc_highlight_apply();" />Config button enabled.<br>\
					<input type="checkbox" id="misc_hide_button_bar" onclick="KM.conf_misc_highlight_apply();" />Hide button bar.<br>\
				</div>\
            </div>\
            <br /><hr style="margin:10px;clear:both" />\
            <div class="config_group_margin">\
              <input type="checkbox" id="misc_save" onclick="KM.conf_misc_save_display();" />Save the current "Display Select" configuration as default.<br>\
            </div>\
            <hr style="margin:10px;clear:both" />\
            <div class="config_text_margin" id="conf_text" >\
              <input type="button" id="conf_apply" onclick="KM.conf_misc_apply();" value="Apply" />all changes to the local browser configuration and sync with the remote server.\
           </div>';


    document.getElementById('misc_archive').checked = KM.config.misc.archive_button_enabled;
    document.getElementById('misc_logs').checked = KM.config.misc.logs_button_enabled;
    document.getElementById('misc_config').checked = KM.config.misc.config_button_enabled;
	document.getElementById('misc_hide_button_bar').checked = KM.config.misc.hide_button_bar;
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

    KM.config.misc.archive_button_enabled = document.getElementById('misc_archive').checked;
    KM.config.misc.logs_button_enabled = document.getElementById('misc_logs').checked;
    KM.config.misc.config_button_enabled = document.getElementById('misc_config').checked;
	KM.config.misc.hide_button_bar = document.getElementById('misc_hide_button_bar').checked;
    
    // reset the 'misc_save' checked box any warning highlight on the apply line
    document.getElementById('misc_save').checked = false;
    document.getElementById('conf_apply').style.fontWeight = 'normal';
    document.getElementById('conf_apply').style.color = KM.BLACK;
    document.getElementById('conf_text').style.color = KM.DARK_GREY;
    KM.update_function_buttons(4); // update button enables
    KM.conf_config_track.misc_modified();
    KM.conf_config_track.sync();
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
		for (var f in KM.config.feeds) {
			html_str+='<option value="'+f+'">Camera '+f+'</option>';
        };
		html_str+='</select>\
					<input type="checkbox" id="feed_enabled" onclick="KM.conf_feed_enabled();" />Enable camera \
					<br><br> \
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
				for (var i=0;i<=KM.max_feed();i++) {
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
              <div class="config_text">Camera name: <input style="width:190px" type="text" id="feed_name" size="15" onfocus="KM.conf_feed_highlight_apply();" value="'+KM.conf.camera+'"/></div>\
            </div>\
			</div>\
            <br /><hr style="margin:10px" class="clear_float"/>\
			<div class="config_text_margin" id="feed_text_8">\
              <input type="checkbox" id="feed_box" onclick="KM.conf_feed_highlight_apply();" />Enable motion highlighting. (Draw box around detected motion)\
            </div>\
            <br /><hr style="margin:10px" class="clear_float"/>\
            <div class="config_text_margin" id="feed_text_14">\
              <input type="checkbox" id="feed_snap_enabled" onclick="KM.conf_feed_highlight_apply();" />Enable snapshot mode. Record an image in time lapse mode with a pause between images.\
            </div>\
            <div class="config_text_margin" style="width:412px;" id="feed_text_15">\
              of : <input type="text" id="feed_snap" size="4" onfocus="KM.conf_feed_highlight_apply();" />Seconds, (300 Seconds recommended)\
            </div>\
            <br /><hr style="margin:10px" class="clear_float"/>\
            <br /><hr style="margin:10px" class="clear_float"/>\
            <div class="config_text_margin" id="conf_text">\
              <input type="button" id="conf_apply" onclick="KM.conf_feed_apply();" value="Apply" />all changes to the local browser configuration and sync with the remote server.\
            </div>\
          </div><br />';
    

    if (KM.config.feeds[KM.conf.camera].feed_enabled) {
        html_str = html_str.replace(/disabled/g, '');
        html_str = html_str.replace(/gcam.png/, 'bcam.png');

        KM.conf_live_feed_daemon(KM.session_id.current, KM.conf.camera);
    }
    document.getElementById('config_html').innerHTML = html_str;

    // has to be this messy way to avoid flicker
	//console.log(KM.config.feed_device[KM.conf.camera]);
    if (KM.config.feeds[KM.conf.camera].feed_enabled) {
        if (KM.config.feeds[KM.conf.camera].feed_device == -1) {
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

    document.getElementById('feed_camera').selectedIndex = KM.conf.camera -1;
    document.getElementById('feed_enabled').checked = KM.config.feeds[KM.conf.camera].feed_enabled;   
	if (KM.config.feeds[KM.conf.camera].feed_device>-1)
		document.getElementById('feed_device').selectedIndex = KM.config.feeds[KM.conf.camera].feed_device;
	else
		document.getElementById('feed_device').selectedIndex = KM.max_feed()+1;
    document.getElementById('feed_input').selectedIndex = KM.config.feeds[KM.conf.camera].feed_input;
    document.getElementById('feed_url').value = KM.config.feeds[KM.conf.camera].feed_url;
    document.getElementById('feed_proxy').value = KM.config.feeds[KM.conf.camera].feed_proxy;
    document.getElementById('feed_lgn_name').value = KM.config.feeds[KM.conf.camera].feed_lgn_name;
    document.getElementById('feed_lgn_pw').value = KM.config.feeds[KM.conf.camera].feed_lgn_pw;
    document.getElementById('feed_width').value = KM.config.feeds[KM.conf.camera].feed_width;
    document.getElementById('feed_height').value = KM.config.feeds[KM.conf.camera].feed_height;
    document.getElementById('feed_name').value = KM.config.feeds[KM.conf.camera].feed_name;
    document.getElementById('feed_box').checked = KM.config.feeds[KM.conf.camera].feed_show_box;
    document.getElementById('feed_snap_enabled').checked = KM.config.feeds[KM.conf.camera].feed_snap_enabled;
    document.getElementById('feed_snap').value = KM.config.feeds[KM.conf.camera].feed_snap_interval;

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

    KM.conf.mask = '';
    var mask_lines = KM.config.feeds[KM.conf.camera].feed_mask.split('#');
    for (var i = 0; i < 15; i++) {
        KM.conf.mask += KM.pad_out(parseInt(mask_lines[i], 16).toString(2), 15);
    }
    if (KM.config.feeds[KM.conf.camera].feed_enabled) {
        // if enabled show the mask
        for (var i = 0; i < 225; i++) {
            if (KM.conf.mask.charAt(i) === '1') {
                document.getElementById('mask_img_' + (i + 1)).src = 'images/mask.png'
            }
        }
    };

	for (var f in KM.config.feeds) {
        try {
            if (KM.conf_config_track.feed_modified[f] == true){
                KM.conf_feed_highlight_apply();
                break;
            };
        } catch (e) {};
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

    if (KM.conf.mask.charAt(mask_num - 1) === '0' && document.getElementById('feed_enabled').checked) {
        document.getElementById('mask_img_' + mask_num).src = 'images/mask.png';
        KM.conf.mask = KM.conf.mask.substr(0, mask_num - 1) + '1' + KM.conf.mask.substr(mask_num);
    } else {
        document.getElementById('mask_img_' + mask_num).src = 'images/mask_trans.png';
        KM.conf.mask = KM.conf.mask.substr(0, mask_num - 1) + '0' + KM.conf.mask.substr(mask_num);
    }
    KM.conf_config_track.mask_modified(KM.conf.camera);
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
	    KM.conf.mask = KM.conf.mask.substr(0, mask_num - 1) + '1' + KM.conf.mask.substr(mask_num);

	} else if (button_num === 2) {
	    if (KM.conf.mask.substr(mask_num - 1, 1) === '0') {

		KM.conf.mask = KM.conf.mask.substr(0, mask_num - 1) + '1' + KM.conf.mask.substr(mask_num);
		document.getElementById('mask_img_' + mask_num).src = 'images/mask.png';

	    } else {

		KM.conf.mask = KM.conf.mask.substr(0, mask_num - 1) + '0' + KM.conf.mask.substr(mask_num);
		document.getElementById('mask_img_' + mask_num).src = 'images/mask_trans.png';
	    }

	} else if (button_num === 3) {
	    document.getElementById('mask_img_' + mask_num).src = 'images/mask_trans.png';
	    KM.conf.mask = KM.conf.mask.substr(0, mask_num - 1) + '0' + KM.conf.mask.substr(mask_num);
	}
    }
    KM.conf_config_track.mask_modified(KM.conf.camera);
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
    KM.conf.camera = document.getElementById('feed_camera').selectedIndex + 1;
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
    KM.conf_config_track.mask_modified(KM.conf.camera);
};

KM.conf_feed_net_highlight = function () {

    // A function that enables/disables user inputs for net cams
    //
    // expects:
    //
    // returns:
    //

    if (document.getElementById('feed_device').selectedIndex == KM.max_feed()) {
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

KM.conf_feed_grey = function () {

    // A function that greys out the feed screen
    //
    // expects:
    //
    // returns:
    //

    KM.session_id.current++; // needed to kill updates
    KM.conf_error_daemon(KM.session_id.current);

    var ids = ['mask_all' , 'mask_invert', 'mask_none',
    'feed_device', 'feed_url', 'feed_lgn_name', 'feed_width',
    'feed_input', 'feed_proxy', 'feed_lgn_pw', 'feed_height', 'feed_name',
    'feed_box', 'feed_snap_enabled', 'feed_snap']

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

    KM.conf_live_feed_daemon(KM.session_id.current, KM.conf.camera);

    var ids = ['mask_all' , 'mask_invert', 'mask_none',
    'feed_device', 'feed_url', 'feed_lgn_name', 'feed_width',
    'feed_input', 'feed_proxy', 'feed_lgn_pw', 'feed_height', 'feed_name',
    'feed_box', 'feed_snap_enabled', 'feed_snap']

    for (var i = 0; i < ids.length; i++) {
		try {
			document.getElementById(ids[i]).disabled = false;
		} catch (e) {}
    }
    
    KM.conf_feed_net_highlight();	
    document.getElementById('image').src = 'images/bcam.png';
    // if enabled show the mask
    for (var i = 0; i < 225; i++) {
        if (KM.conf.mask.charAt(i) === '1') {
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
	KM.config.feeds[KM.conf.camera].feed_enabled = document.getElementById('feed_enabled').checked;
    if (document.getElementById('feed_device').selectedIndex == KM.max_feed()+1) {
        KM.config.feeds[KM.conf.camera].feed_device=-1;
    } else {
        KM.config.feeds[KM.conf.camera].feed_device = document.getElementById('feed_device').selectedIndex;
    };
    KM.config.feeds[KM.conf.camera].feed_input = document.getElementById('feed_input').selectedIndex;
    KM.config.feeds[KM.conf.camera].feed_url = document.getElementById('feed_url').value;
    KM.config.feeds[KM.conf.camera].feed_proxy = document.getElementById('feed_proxy').value;
    KM.config.feeds[KM.conf.camera].feed_lgn_name = document.getElementById('feed_lgn_name').value;
    KM.config.feeds[KM.conf.camera].feed_lgn_pw = document.getElementById('feed_lgn_pw').value;
    KM.config.feeds[KM.conf.camera].feed_name = document.getElementById('feed_name').value;
    KM.config.feeds[KM.conf.camera].feed_show_box = document.getElementById('feed_box').checked;
    KM.config.feeds[KM.conf.camera].feed_snap_enabled = document.getElementById('feed_snap_enabled').checked;

    var tmp = '';
    KM.config.feeds[KM.conf.camera].feed_mask = '';
    for (var i = 0; i < 15; i++) {
        tmp = KM.conf.mask.substr(i * 15, 15);
        KM.config.feeds[KM.conf.camera].feed_mask += parseInt(tmp, 2).toString(16) + '#';
    }

    var width = parseInt(document.getElementById('feed_width').value, 10);
    if (isNaN(width)) width = 0;
    width = parseInt(width / 16) * 16;
    if (KM.config.feeds[KM.conf.camera].feed_width !== width) {
        // if the image size changes, change the mask
        KM.conf_config_track.mask_modified(KM.conf.camera);
        KM.config.feeds[KM.conf.camera].feed_width = width;
    }
    // feed value back to gui in case parseInt changes it
    document.getElementById('feed_width').value = width;

    var height = parseInt(document.getElementById('feed_height').value, 10);
    if (isNaN(height)) height = 0;
    height = parseInt(height / 16) * 16;
    if (KM.config.feeds[KM.conf.camera].feed_height !== height) {
        // if the image size changes, change the mask
        KM.conf_config_track.mask_modified(KM.conf.camera);
        KM.config.feed_height[KM.conf.camera] = height;
    }
    // feed value back to gui in case parseInt changes it
    document.getElementById('feed_height').value = height;

    var snap = parseInt(document.getElementById('feed_snap').value, 10);
    if (isNaN(snap)) snap = 0;
    KM.config.feeds[KM.conf.camera].feed_snap_interval = snap;
    // feed value back to gui in case parseInt changes it
    document.getElementById('feed_snap').value = snap;

	KM.conf_config_track.feed_modified(KM.conf.camera);

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
    
    refresh(session_id, feed);

    function refresh(session_id, feed) {
        KM.kill_timeout_ids(KM.CONFIG_LOOP); // free up memory from 'setTimeout' calls	
        if (session_id === KM.session_id.current) {
            try {
                document.getElementById('image').src = KM.get_jpeg(feed);
            } catch (e) {}
                        
            KM.add_timeout_id(KM.CONFIG_LOOP, setTimeout(function () {refresh(session_id, feed); }, 1000/KM.live.fps));
        }
    }
};



/* ****************************************************************************
Config display - Themes config screen

Displays and processes the themes config screen
**************************************************************************** */

KM.conf_theme_html = function() {
    document.getElementById('config_html').innerHTML = '<div style="height:50px;line-height:50px;background-color:#000000;color:#c1c1c1;margin:10px;padding-left:10px"><input type="radio" name="theme" value="0" onchange="KM.background_button_clicked(0);">Dark theme</div>' +
						'<div style="height:50px;line-height:50px;background-color:#ffffff;color:#505050;margin:10px;padding-left:10px"><input type="radio" name="theme" value="1" onchange="KM.background_button_clicked(1);">Light theme</div>'+
						'<input type="button" id="conf_apply" onclick="KM.conf_theme_apply();" value="Save">';
    document.getElementsByName('theme')[KM.config.misc.color_select].checked = true;

    //KM.config.color_select = ;
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
	
    var error_lines = KM.conf.error_str.split("\n");
	KM.conf.error_str=null;
	var error_str = '';
    for (var i = error_lines.length-1; i>=0; i--) {
	//for (var i = 0; i<error_lines.length; i++) {
        if (error_lines[i].search(KM.conf.error_search_str) !== -1) {
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
	var dbase = {}

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

    function update_all() {
		try {
			update_text();
			update_bars();
		} catch (e) {			
            KM.kill_timeout_ids(KM.CONFIG_LOOP);        
		}
    }

    function update_text() {
        document.getElementById('server_info').innerHTML = dbase.uname + ' Uptime ' + dbase.up;
        document.getElementById('memory_title').innerHTML = 'Memory ' + dbase.mt + 'k';
        document.getElementById('swap_title').innerHTML = 'Swap ' + dbase.st + 'k';
    }

    function update_bars() {
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
        var non_app = parseInt(dbase.mf) + parseInt(dbase.mb) + parseInt(dbase.mc);
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
					dbase = JSON.parse(dblob);
                    
                    if (KM.session_id.current === session_id) {
                        update_all();
                    }
                }
            };
            xmlHttp.open('GET', '/ajax/loads?'+Math.random(), true);
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

   // KM.feed_cache_setup();
    // setTimeout(function() {			
				// KM.update_events();				
				// setTimeout(arguments.callee,1000);
			
	// }, 1000);
    KM.update_events();
    var callback = KM.init2;
    KM.load_settings(callback);
};


KM.init2 = function () {

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
        KM.conf_config_track.init();
        KM.browser.setTitle();
        KM.background_button_clicked(KM.config.misc.color_select);
        KM.enable_display_buttons(KM.config.misc.display_select);
        KM.menu_bar_buttons.construct_camera_sec();
        KM.enable_camera_buttons();
		if (KM.config.misc.hide_button_bar) {
			KM.toggle_button_bar();
		}

	    
		KM.enable_function_buttons(1); // select 'live' mode
		KM.function_button_clicked(1); // start 'live' mode
           
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










