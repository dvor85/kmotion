﻿/* *****************************************************************************
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
KM.BUTTON_BLINK = 'BUTTON_BLINK';
KM.GET_DATA     = 'GET_DATA';
KM.DISPLAY_LOOP = 'DISPLAY_LOOP';
KM.ARCH_LOOP    = 'ARCH_LOOP';
KM.LOGS         = 'LOGS_LOOP';
KM.CONFIG_LOOP  = 'CONFIG_LOOP';
KM.MISC_JUMP    = 'MISC_JUMP';

KM.browser = {
    browser_FF: false,      // browser is firefox
    browser_IE: false,      // browser is internet explorer
    browser_OP:	false,	    // browser is opera
    browser_SP:	false,	    // browser is on a smartphone
};

KM.session_id = {
    current: 0 // the current 'live' session id, used to kill old sessions
};

KM.config = {};

KM.menu_bar_buttons = {
    function_selected:   0,     // the function selected
    display_sec_enabled: false, // enabled sections ...
    camera_sec_enabled:  false
};

KM.max_feed = function () {
    var max = 0;
    for (var feed in KM.config.feeds) {
        max = Math.max(max,feed)
    }
    return max;
};

// использование Math.round() даст неравномерное распределение!
KM.getRandomInt = function(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


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
		h_button_bar.style.right='175px';
		document.getElementById('main_display').style.right='185px';
	} else {
		button_bar.style.display='none';
		h_button_bar.style.right='0px';
		document.getElementById('main_display').style.right='10px';
	}

	//KM.function_button_clicked(KM.menu_bar_buttons.function_selected);
}

KM.browser.set_title = function() {
    document.getElementById('version_num').innerHTML = 'Ver ' + KM.config.version;
	document.getElementsByTagName('title')[0].innerHTML = KM.config.title;
};

KM.timeout_ids = function () {

    // A closure that stores and purges 'setTimeout' ids to stop memory leaks.
    // ids are split into 'groups' for up to eight different sections of code.

    var timeout_ids = {};

    return {

	add_id: function (group, timeout_id) {

	    // A function to add a timeout id
	    //
	    // expects :
	    //
	    // 'group' ...	group
	    // 'timeout_id' ... timeout id
	    //
        if (timeout_ids[group] === undefined) {
            timeout_ids[group] = [];
        }
	    timeout_ids[group].push(timeout_id);
	},

	cull_ids: function (group) {

	    // A function to kill all but the last timeout id
	    //
	    // expects :
	    //
	    // 'group' ...	group
	    //

	    if (timeout_ids[group] !== undefined && timeout_ids[group].length > 1) {
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

	    if (timeout_ids[group] !== undefined && timeout_ids[group].length > 0) {
            for (var i = 0; i < timeout_ids[group].length; i++) {
                clearTimeout(timeout_ids[group][i]);
                delete timeout_ids[group][i];
            }
            delete timeout_ids[group];
	    }
	}
    };
}();

// add a timeout id
KM.add_timeout_id = KM.timeout_ids.add_id;
// cull all but the last timeout id, freeing memory
KM.cull_timeout_ids = KM.timeout_ids.cull_ids;
// kill all ids, freeing memory
KM.kill_timeout_ids = KM.timeout_ids.kill_ids;


KM.get_xmlHttp_obj = function () {
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

KM.json_request = function(url, json, callback, onerror){
	var xmlHttp = KM.get_xmlHttp_obj();
	var jreq = json;
	var json = JSON.stringify(jreq);
	xmlHttp.open('POST', url, true);
	xmlHttp.setRequestHeader("Content-type", "application/json");
	xmlHttp.onreadystatechange = function() {
		if (xmlHttp.readyState == 4) {
			xmlHttp.onreadystatechange = null; // plug memory leak
			if (xmlHttp.status == 200) {
				try {
                    var jres = JSON.parse(xmlHttp.responseText);
                    if (jres.id != jreq.id){
                        console.log("Invalid ID");
                        if (onerror)
                            try {
                                onerror();
                            } catch (e) {
                                console.log(e);
                            }
                        return false;
                    }
                    if (jres.error) {
                        console.log(jres.error.message);
                        if (onerror)
                            try {
                                onerror();
                            } catch (e) {
                                console.log(e);
                            }
                        return false;
                    }
                    if (callback)
                        try {
                            callback(jres.result);
                        } catch (e) {
                            console.log(e);
                            return false;
                        }

                    return true;
				} catch (e) {
                    console.log(e);
                    if (onerror)
                        try {
                            onerror();
                        } catch (e) {
                            console.log(e);
                        }
                    return false;
                }
			}
		}
	}
	xmlHttp.send(json);
}

KM.load_settings = function () {
    function init_interface() {
        KM.browser.set_title();
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

    function get_settings() {
        function retry() {
            KM.kill_timeout_ids(KM.GET_DATA);
            KM.add_timeout_id(KM.GET_DATA, setTimeout(function () {get_settings(); }, 5000));
        }

        function callback(obj_data) {
            KM.config = obj_data;
            set_settings();
            init_interface();
        }

        var jreq = {jsonrpc: '2.0', method: 'config', id: Math.random(), params: {read: '1'} };
        KM.json_request("/ajax/config", jreq, callback, onerror=retry);
    }

    function set_settings() {
        var user_agent = navigator.userAgent.toLowerCase();

        KM.browser.browser_IE = user_agent.search('msie') > -1;
        KM.browser.browser_FF = user_agent.search('firefox') > -1;
        KM.browser.browser_OP = user_agent.search('opera') > -1;

        KM.browser.browser_SP = (user_agent.search('iphone') > -1 ||
        user_agent.search('ipod') > -1 || user_agent.search('android') > -1 || user_agent.search('ipad') > -1 ||
        user_agent.search('iemobile') > -1 ||  user_agent.search('blackberry') > -1);
    };

    get_settings();

    return {
        init: get_settings
    }
}();

KM.init = KM.load_settings.init;

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

KM.hhmmss_secs = function (hhmmss) {
    // convert HHMMSS string to an integer number
    hhmmss = KM.pad_out6(hhmmss);
    var hh=parseInt(hhmmss.slice(0, 2), 10);
    var mm=parseInt(hhmmss.slice(2, 4), 10);
    var ss=parseInt(hhmmss.slice(4, 6), 10);
    return (hh * 60 * 60) + (mm * 60) + ss;
}

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

    KM.kill_timeout_ids(KM.BUTTON_BLINK);
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
    //for (var f in KM.config.feeds) {
    for (var f=1;f<=KM.max_feed();f++) {
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
    //for (var f in KM.config.feeds) {
    for (var f=1;f<=KM.max_feed();f++) {
        try {
            document.getElementById('ct' + f).innerHTML = f;
            if (KM.config.feeds[f] && KM.config.feeds[f].feed_enabled) {
                document.getElementById('ct' + f).style.color = KM.BLUE;
            } else {
                document.getElementById('ct' + f).style.color = KM.GREY;
            }
        } catch(e) {}
    }
    KM.menu_bar_buttons.camera_sec_enabled = true;
};

KM.update_camera_buttons = KM.enable_camera_buttons;

KM.disable_camera_buttons = function () {

    // A function that disables the 16 camera buttons
    //
    // expects :
    //
    // returns :
    //

    document.getElementById('camera_func_header').innerHTML = 'Camera Select';
    for (var f=1;f<=KM.max_feed();f++) {
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

KM.disable_func_buttons = KM.disable_camera_buttons;

KM.blink_camera_func_button = function (button) {

    // A function that blinks camera button 'button'
    //
    // expects :
    // 'button' ... the button to blink
    //
    // returns :
    //

    if (KM.menu_bar_buttons.camera_sec_enabled) {
        KM.blink_button(document.getElementById('ct' + button));
        document.getElementById('ct' + button).style.color = KM.RED;
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

    var buttons = ['pad', 'pad', 'archive_enabled',
    'logs_enabled', 'config_enabled'];

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
        KM.display_live.set_last_camera(0);
        KM.display_live();

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
            KM.display_live.set_last_camera(button)
            KM.config.display_feeds[1][0] =  button;
            if (KM.config.misc.display_select == 1) {
                // if '1' change view directly as a special case
                KM.display_live.set_last_camera(0)
                KM.display_live();

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
                KM.display_live();
                break;

            case 2: // 'archive button'
                KM.disable_display_buttons();
                KM.disable_camera_buttons();
                KM.display_archive();
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

    var buttons = ['pad', 'pad', 'archive_enabled',
        'logs_enabled', 'config_enabled'];
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


KM.get_jpeg = function (feed) {
    return  '/kmotion_ramdisk/'+KM.pad_out2(feed)+'/last.jpg?'+Math.random();
}


/* ****************************************************************************
Live display - Live code

Code to constantly refreshes the display grid loading feed jpegs and displaying
them.
**************************************************************************** */


KM.display_live_ = function () {

    // A closure that constantly refreshes the display grid loading feed jpegs
    // and displaying them. If selected interleave feed jpeg refreshes. If
    // selected enable low bandwidth mode.
    //
    // expects:
    //
    // returns:
    //

    var last_camera_select = 0; // the last camera selected
    var latest_events = [];
    var max_streams = 10;
    var update_counter = {};
    var stream_counter = 0; //счетчик одновременных обновлений

    function init() {
        // setup for grid display
        KM.session_id.current++;
        init_display_grid(KM.config.misc.display_select);

        // exit if no feeds enabled, else 100% CPU usage
        var no_feeds = true;
        var feed;
        for (var i=0;i<KM.config.display_feeds[KM.config.misc.display_select].length;i++) {
            try {
                feed = KM.config.display_feeds[KM.config.misc.display_select][i];
                if (KM.config.feeds[feed].feed_enabled) {
                    no_feeds = false;
                }
            } catch (e) {}
        }
        if (no_feeds) return; // no feeds
        refresh(KM.session_id.current);
    }

    function refresh(session_id) {
        KM.kill_timeout_ids(KM.DISPLAY_LOOP); // free up memory from 'setTimeout' calls
        if (KM.session_id.current === session_id) {
            update_latest_events(session_id);
            KM.add_timeout_id(KM.DISPLAY_LOOP, setTimeout(function () {refresh(session_id); }, 1000));
        }
    }

    image_loads = function() {
        var loads = {};

        function onload(feed) {
            loads[feed] = true;
        }

        function onerror(feed) {
            loads[feed] = false;
        }

        function is_loaded(feed) {
            return (loads[feed] === true);
        }

        function is_error(feed) {
            return (loads[feed] === false);
        }

        function reset(feed) {
            delete loads[feed];
        }

        return {
            onload: onload,
            onerror: onerror,
            is_loaded: is_loaded,
            is_error: is_error,
            reset: reset
        }
    }();

    function camera_jpeg_clicked(camera) {

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
        if (last_camera_select !== 0) {
            var camera_last_pos=KM.config.display_feeds[KM.config.misc.display_select].indexOf(last_camera_select);
            var camera_old=KM.config.display_feeds[KM.config.misc.display_select][camera_pos];
            if (KM.config.feeds[last_camera_select] && KM.config.feeds[last_camera_select].feed_enabled) {
                KM.config.display_feeds[KM.config.misc.display_select][camera_pos]=last_camera_select;
                if (camera_last_pos>=0) {
                    KM.config.display_feeds[KM.config.misc.display_select][camera_last_pos]=camera_old;
                }
            }
            last_camera_select = 0;
        } else {
            KM.config.display_feeds[1][0] = KM.config.display_feeds[KM.config.misc.display_select][camera_pos];
            KM.config.misc.display_select = 1;
            KM.update_display_buttons(1);

        }

        init();
    };

    function init_display_grid(display_select) {

        // a closure that calculates and generates the HTML for a display grid of
        // 'display_select' assigning consecutive jpeg and text id's and updates
        // 'main_display' HTML.


        var left_margin =  0;
        var top_margin =   0;
        var total_width =  0;
        var total_height = 0;

        var html = '';
        var feed_index = 0;

        clear_html();
        construct_grid_html(display_select);
        set_html();


        function clear_html() {
            // reset the constructed html string and counter
            html = '';
            feed_index = 0;
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
        // 'left'        ... cells left %
        // 'right'       ... cells right %
        // 'width'       ... cells width %
        // 'height'      ... cells height %
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
            text_left = 1;
        }
        if (typeof text_top === 'undefined') {
            text_top = 1;
        }

        var jpeg = gcam_jpeg;
        var text = 'No Video';
        var text_color = KM.WHITE;

        try {
            var feed = KM.config.display_feeds[display_num][feed_index++];
            if (!feed || feed>KM.max_feed()) {
                return;
            }
            if (KM.config.feeds[feed].feed_enabled) {
                jpeg = KM.get_jpeg(feed);
                text_color = KM.BLUE;
                if (KM.config.feeds[feed].feed_name) {
                    text = KM.config.feeds[feed].feed_name;
                } else {
                    text = 'Cam ' + feed;
                    KM.config.feeds[feed].feed_name = text;
                }
            }
        } catch (e) {}

        text = feed + ' : ' + text;

        var l = [];

        l.push('<img id="image_' + feed + '" ');
        l.push('style="left:' + left + '%; ');
        l.push('top:' + top + '%; ');
        l.push('width:' + width + '%; ');
        l.push('height:' + height + '%;" ');
        l.push('src="' + jpeg + '"; ');
        l.push('alt="">');

        l.push('<span id="text_' + feed + '"');
        l.push('style="left:' + (left + text_left) + '%; ');
        l.push('top:' +  (top + text_top) + '%;');
        l.push('color:' + text_color  + ';');
        l.push('">' + text + '</span>');
        html += l.join(' ');

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
            // 4 ... symetrical   all grid
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

        var row, col, rows, cols, inner_jpeg_width, inner_jpeg_height,
        jpeg_width, jpeg_height, total_width, total_height;

        total_width = 100;
        total_height = 100;

        switch (display_select) {
        case 1:  // symetrical 1 grid
            rows = 1;
            cols = 1;

            jpeg_width = total_width / cols;
            jpeg_height = total_height / rows;
            for (row = 0; row < rows; row++) {
            for (col = 0; col < cols; col++) {
                construct_cell_html(display_select,
                left_margin + (col * (jpeg_width)),
                top_margin + (row * (jpeg_height)),
                jpeg_width, jpeg_height);
            }
            }
            break;

        case 2:  // symetrical 4 grid
            rows = 2;
            cols = 2;

            jpeg_width = total_width / cols;
            jpeg_height = total_height / rows;

            for (row = 0; row < rows; row++) {
            for (col = 0; col < cols; col++) {
                construct_cell_html(display_select,
                left_margin + (col * (jpeg_width)),
                top_margin + (row * (jpeg_height)),
                jpeg_width, jpeg_height);
            }
            }
            break;

        case 3:  // symetrical 9 grid
            rows = 3;
            cols = 3;

            jpeg_width = total_width / cols;
            jpeg_height = total_height / rows;

            for (row = 0; row < rows; row++) {
            for (col = 0; col < cols; col++) {
                construct_cell_html(display_select,
                left_margin + (col * (jpeg_width)),
                top_margin + (row * (jpeg_height)),
                jpeg_width, jpeg_height);
            }
            }
            break;

        case 4:  // symetrical 16 grid

            cols = Math.ceil(Math.sqrt(KM.max_feed()));//5;//
            rows = Math.ceil((KM.max_feed())/cols);

            jpeg_width = total_width / cols;
            jpeg_height = total_height / rows;

            for (row = 0; row < rows; row++) {
            for (col = 0; col < cols; col++) {
                construct_cell_html(display_select,
                left_margin + (col * (jpeg_width)),
                top_margin + (row * (jpeg_height)),
                jpeg_width, jpeg_height);
            }
            }
            break;

        case 5:  // asymmetrical 6 grid
            rows = [0, 1, 2, 2, 2];
            cols = [2, 2, 0, 1, 2];

            jpeg_width = total_width / 3;
            jpeg_height = total_height / 3;

            construct_cell_html(display_select, left_margin, top_margin,
            (jpeg_width * 2), (jpeg_height * 2));

            for (var i = 0; i < 5; i++) {
            row = rows[i];
            col = cols[i];
            construct_cell_html(display_select,
            left_margin + (col * (jpeg_width)),
            top_margin + (row * (jpeg_height)),
            jpeg_width, jpeg_height);
            }
            break;

        case 6:  // asymmetrical 13 grid
            rows = [0, 0, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3];
            cols = [2, 3, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3];

            jpeg_width = total_width / 4;
            jpeg_height = total_height / 4;

            construct_cell_html(display_select, left_margin, top_margin,
            (jpeg_width * 2), (jpeg_height * 2));

            for (i = 0; i < 12; i++) {
            row = rows[i];
            col = cols[i];
            construct_cell_html(display_select,
            left_margin + (col * (jpeg_width)),
            top_margin + (row * (jpeg_height)),
            jpeg_width, jpeg_height);
            }
            break;

        case 7:  // asymmetrical 8 grid
            rows = [0, 1, 2, 3, 3, 3, 3];
            cols = [3, 3, 3, 0, 1, 2, 3];

            jpeg_width = total_width / 4;
            jpeg_height = total_height / 4;

            construct_cell_html(display_select, left_margin, top_margin,
            (jpeg_width * 3), (jpeg_height * 3));

            for (i = 0; i < 7; i++) {
            row = rows[i];
            col = cols[i];
            construct_cell_html(display_select,
            left_margin + (col * (jpeg_width)),
            top_margin + (row * (jpeg_height)),
            jpeg_width, jpeg_height);
            }
            break;

        case 8:  // asymmetrical 10 grid
            rows = [0, 0, 1, 1, 2, 2, 3, 3];
            cols = [2, 3, 2, 3, 0, 1, 0, 1];

            jpeg_width = total_width / 4;
            jpeg_height = total_height / 4;


            construct_cell_html(display_select, left_margin, top_margin,
             (jpeg_width * 2), (jpeg_height * 2) );

            for (i = 0; i < 8; i++) {
            row = rows[i];
            col = cols[i];
            construct_cell_html(display_select,
            left_margin + (col * (jpeg_width)),
            top_margin + (row * (jpeg_height)),
            jpeg_width, jpeg_height);
            }

            construct_cell_html(display_select,
            left_margin + (jpeg_width * 2),
            top_margin + (jpeg_height * 2),
            (jpeg_width * 2)-left_margin , (jpeg_height * 2)-top_margin);
            break;

        case 9:  // P in P 2 grid
            jpeg_width = total_width;
            jpeg_height = total_height;

            inner_jpeg_width = jpeg_width * 0.28;
            inner_jpeg_height = jpeg_height * 0.28;

            construct_cell_html(display_select, left_margin, top_margin,
            jpeg_width, jpeg_height, false,
            (jpeg_width * 0.02) + inner_jpeg_width + 1,
            (jpeg_height * 0.02) + 1);

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
            (jpeg_width * 0.02),
            (jpeg_height * 0.02));

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
            (jpeg_width * 0.02),
            (jpeg_height * 0.02));

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
            (jpeg_width * 0.02),
            (jpeg_height * 0.02));

            construct_cell_html(display_select,
            left_margin + jpeg_width - inner_jpeg_width - (jpeg_width * 0.02),
            top_margin + jpeg_height - inner_jpeg_height - (jpeg_height * 0.02),
            inner_jpeg_width, inner_jpeg_height, true);
            break;
        }
        }
    };

    function update_latest_events(session_id) {
        function retry() {
            KM.kill_timeout_ids(KM.DISPLAY_LOOP);
            if (KM.session_id.current === session_id) {
                KM.add_timeout_id(KM.DISPLAY_LOOP, setTimeout(function () {update_latest_events(); }, 100));
            }
        }

        function callback(obj_data) {
            latest_events = obj_data;
            text_refresh();
            update_feeds();
        }

        if (KM.session_id.current === session_id) {
            var jreq = {jsonrpc: '2.0', method: 'feeds', id: Math.random()};
            KM.json_request("/ajax/feeds", jreq, callback, onerror=retry);
        }
    }

    function text_refresh() {

        // A function that refresh the display text colors, 'white' for feed
        // disabled, 'blue' for no motion 'red' for motion.
        //
        // expects :
        //
        // returns :
        //

        var text_color,feed,border_color;
        for (var i=0;i<KM.config.display_feeds[KM.config.misc.display_select].length;i++) {
            try {
                feed = KM.config.display_feeds[KM.config.misc.display_select][i]
                text_color = KM.WHITE;
                if (KM.config.feeds[feed].feed_enabled) {
                    text_color = KM.BLUE;
                    border_color = KM.BLACK;
                    if (KM.item_in_array(feed, latest_events)) {
                        text_color = KM.RED;
                        border_color = KM.RED;
                    }
                }
                document.getElementById("text_" + feed).style.color = text_color;
                //document.getElementById("image_" + feed).style.borderColor = border_color;
            } catch (e) {}
        }
    };

    function display_feeds_compare_by_counter(a, b) {
        return update_counter[b] - update_counter[a];
    }

    function display_feeds_compare_by_latest(a, b) {
        var a_in = KM.item_in_array(a, latest_events);
        var b_in = KM.item_in_array(b, latest_events);
        if (a_in && b_in) {
            return 0;
        } else if (a_in) {
            return -1;
        } else {
            return 1;
        }
    }

    function update_feed(feed, feeds_length) {
        var image_feed;
        var fps=KM.config['feeds'][feed].feed_fps;
        var timeout_id=KM.DISPLAY_LOOP+feed;

        KM.kill_timeout_ids(timeout_id);
        try {
            image_feed = document.getElementById('image_'+feed);
            if (image_feed === null)
                return false;
            if (image_feed.onclick === null)
                image_feed.onclick = function(feed) {return function() {camera_jpeg_clicked(feed)}}(feed);

            if (KM.config.feeds[feed].feed_enabled){
                if (image_feed.onload === null)
                    image_feed.onload = function(feed) {return function() {image_loads.onload(feed)}}(feed);
                if (image_feed.onerror === null)
                    image_feed.onerror = function(feed) {return function() {image_loads.onerror(feed)}}(feed);


               /* console.log('error = ' + image_loads.is_error(feed));
                console.log('update_counter = ' + (update_counter[feed]>=KM.getRandomInt(5,10)));
                console.log('length = ' + display_feeds_sorted.length);
                console.log('in_latest = ' + KM.item_in_array(feed, latest_events));
                console.log('is_loaded = ' + image_loads.is_loaded(feed));
                console.log('max_counter = ' + (max_counter<1));*/

                /*  Обновление с приоритетами
                    Обновить если:
                    1) Произошла ошибка загрузки
                        или
                    2)  а) счетчик обновлений каждой камеры больше случайного значения между 5 и 10 или
                        б) выбран вид одной камеры или
                        в) камера в последних событиях
                        и
                    3)  а) изображение загружено и
                        б) счетчик одновременных обновлений меньше 10
                */
                if (image_loads.is_error(feed) ||

                   ((update_counter[feed]>=KM.getRandomInt(5,10)) ||
                   (feeds_length == 1) ||
                   (KM.item_in_array(feed, latest_events))) &&

                   (image_loads.is_loaded(feed) && (stream_counter<max_streams)))  {

                        /*console.log('\n');
                        console.log('UPDATE FEED ' + feed);
                        console.log('\n');*/
                        update_counter[feed] = 0;
                        stream_counter++;
                        image_loads.reset(feed);
                        image_feed.src=KM.get_jpeg(feed);
                        if (KM.item_in_array(feed, latest_events))    {
                            KM.add_timeout_id(timeout_id, setTimeout(function () {update_feed(feed, feeds_length); }, 1000/fps));
                        }

                } else {
                    if (update_counter[feed] !== undefined) {
                        update_counter[feed]++;
                    } else {
                        update_counter[feed] = 1;
                    }

                }
            }
        } catch (e) {
            console.log(e);
        }
    }

    function update_feeds() {
        var display_feeds_sorted = KM.config.display_feeds[KM.config.misc.display_select].slice(0);

        display_feeds_sorted.sort(display_feeds_compare_by_counter).sort(display_feeds_compare_by_latest);
        stream_counter = 0;

        /*console.log('display_feeds_b = ' + KM.config.display_feeds[KM.config.misc.display_select]);
        console.log('display_feeds_sorted = ' + display_feeds_sorted);
        console.log('display_feeds_a = ' + KM.config.display_feeds[KM.config.misc.display_select]);*/

        for (var i=0;i<display_feeds_sorted.length;i++) {
            var feed = display_feeds_sorted[i];
            update_feed(feed, display_feeds_sorted.length);
        }
    };

    function set_last_camera(last_camera) {
        last_camera_select = last_camera
    }

    return {
        init: init,
        set_last_camera: set_last_camera,
    }
}();

KM.display_live = KM.display_live_.init;
KM.display_live.set_last_camera = KM.display_live_.set_last_camera;


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

    var dates =         {}; // array of avaliable dates
    var cameras =       {}; // multi-dimensional array of cameras per date
    var movies =        {};

    var display_secs =   0; // the current secs count


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
        init_backdrop_html();
        window.onresize=null;
        update_dates_dbase(session_id);
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
        set_null_playback_info();

        document.getElementById('date_select').disabled =   false;
        document.getElementById('camera_select').disabled = false;
        document.getElementById('view_select').disabled =   false;

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

    document.getElementById('main_display').innerHTML = '\
    <div class="title">Kmotion: Archive-><span id="playback_info"></span></div>\
    <div id="arch_display">\
		<div id="config_bar">\
            <select id="date_select" onchange="KM.arch_change_date();" > </select> \
            <select id="camera_select" onchange="KM.arch_change_camera();" > </select> \
            <select id="view_select" onchange="KM.arch_change_view();" > </select> \
		</div>\
		<div id="arch_display_html">\
			<div id="arch_playlist"></div>\
			<div id="arch_player"></div>\
            <form id="playback_form">\
                <input id="playback_rate" type="range" value="1" min="0.1" max="10" step="0.1" list="tickmarks">\
                    <datalist id="tickmarks">\
                        <option value="0" label="0">\
                        <option value="1" label="1">\
                        <option value="2" label="2">\
                        <option value="3" label="3">\
                        <option value="4" label="4">\
                        <option value="5" label="5">\
                        <option value="6" label="6">\
                        <option value="7" label="7">\
                        <option value="8" label="8">\
                        <option value="9" label="9">\
                        <option value="10" label="10">\
                    </datalist>\
            </form>\
		</div>\
	</div>';

    }

    function update_cams_dbase(date, session_id) {
        function retry() {
            KM.kill_timeout_ids(KM.ARCH_LOOP);
            KM.add_timeout_id(KM.ARCH_LOOP, setTimeout(function () {update_cams_dbase(date, session_id); }, 5000));
        }

        function callback(obj_data) {
            cameras = obj_data;
            if (cameras !== {}) {
                populate_camera_dropdown();
                init_main_menus(session_id);
            }
        }

        if (KM.session_id.current === session_id) {
            var jreq = {jsonrpc: '2.0', method: 'archive', id: Math.random(), params: {func:"feeds", date:date} };
            KM.json_request("/ajax/archive", jreq, callback, onerror=retry);
        }
    }

    function update_dates_dbase(session_id) {
        function retry() {
            KM.kill_timeout_ids(KM.ARCH_LOOP);
            KM.add_timeout_id(KM.ARCH_LOOP, setTimeout(function () {update_dates_dbase(session_id); }, 5000));
        }

        function callback(obj_data) {
            dates = obj_data;
            if (dates !== {}) {
                populate_date_dropdown();
            }
        }

        if (KM.session_id.current === session_id) {
            var jreq = {jsonrpc: '2.0', method: 'archive', id: Math.random(), params: {func:"dates"} };
            KM.json_request("/ajax/archive", jreq, callback, onerror=retry);
        }
    }

    function update_movies_dbase(date, camera, session_id) {
        function retry() {
            KM.kill_timeout_ids(KM.ARCH_LOOP);
            KM.add_timeout_id(KM.ARCH_LOOP, setTimeout(function () {update_movies_dbase(date, camera, session_id); }, 5000));
        }

        function callback(obj_data) {
            movies = obj_data;
            populate_view_dropdown();
            KM.add_timeout_id(KM.ARCH_LOOP, setTimeout(retry, 60000));
        }

        if (KM.session_id.current === session_id) {
            var jreq = {jsonrpc: '2.0', method: 'archive', id: Math.random(), params: {date: date, feed: camera, func:"movies"} };
            KM.json_request("/ajax/archive", jreq, callback, onerror=retry);
        }
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
        for (var i=0; i<dates.length; i++) {
            var date = dates[i];
            new_opt = document.createElement('option');
            new_opt.text = date.slice(0, 4) + ' / ' + date.slice(4, 6) + ' / ' + date.slice(6);
            new_opt.value = date;
            try {
              date_select.add(new_opt, null); // standards compliant; doesn't work in IE
            }
            catch(ex) {
              date_select.add(new_opt); // IE only
            }
        }
        document.getElementById('date_select').selectedIndex = 0;
        change_date();

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
        var selected_index = camera_select.selectedIndex;
        var selected_feed = parseInt(camera_select.value);
        if (isNaN(selected_feed))
            selected_feed = KM.config.display_feeds[KM.config.misc.display_select][0];

        for (var i = camera_select.options.length - 1; i > -1; i--) {
            camera_select.remove(i);
        }

        // add the avaliable cameras based on 'archive.dates'
        var date = document.getElementById('date_select').value;
        var new_opt = '';
        for (var feed in cameras) {
            new_opt = document.createElement('option');
            new_opt.text = KM.pad_out2(feed) + ' : ' + cameras[feed]['title'];
            new_opt.value = feed;
            try {
              camera_select.add(new_opt, null); // standards compliant; doesn't work in IE
            }
            catch(ex) {
              camera_select.add(new_opt); // IE only
            }
        }
        if (!isNaN(selected_feed)) {
            camera_select.value = selected_feed;
        } else {
            camera_select.selectedIndex = 0;
        }
        change_camera();
    }

    function populate_view_dropdown() {

	// A function that populates the view dropdown and selects the
	// first one. View is dependent on camera.
	//
	// expects:
	//
	// returns:
	//

        var view_select = document.getElementById('view_select');
        var selected_index = view_select.selectedIndex;
        var selected_value = parseInt(view_select.value);


        for (var i = view_select.options.length - 1; i > -1; i--) {
            view_select.remove(i);
        }

        var movie_enabled =  cameras[document.getElementById('camera_select').value]['movie_flag'];
        var snap_enabled =   cameras[document.getElementById('camera_select').value]['snap_flag'];
        var drop_opts = [];
        if (movie_enabled)
            drop_opts.push('Movies');
        if (snap_enabled)
            drop_opts.push('Snapshots');


        for (var i = 0; i < drop_opts.length; i++) {
            var new_opt = document.createElement('option');
            new_opt.text = drop_opts[i];
            new_opt.value = i;

            try { view_select.add(new_opt, null); } // standards compliant; doesn't work in IE
            catch(e) { view_select.add(new_opt); } // IE only
        }

        if (!isNaN(selected_value)) {
            view_select.value = selected_value;
        } else {
            view_select.selectedIndex = 0;
        }
        change_view();
    }

    function fill_events() {

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
        var start, end;

        var view = parseInt(document.getElementById('view_select').value);
        var date = document.getElementById('date_select').value;
        var camera = document.getElementById('camera_select').value;

        if (view == 0) { // movie events
            var hlight = top_10pc();
            for (var i=0; i<movies['movies'].length; i++) {
                start = movies['movies'][i]['start'];
                end = movies['movies'][i]['end'];
                span_html = 'onclick="KM.arch_event_clicked(' + i + ')"';
                duration = end - start;
                if (KM.item_in_array(duration, hlight))
                    span_html += ' style="color:#D90000"';
                html += '<span ' + span_html + '>';
                html += KM.secs_hh_mm_ss(start);
                html += '&nbsp;&nbsp;-&nbsp;&nbsp;';
                html += KM.secs_hh_mm_ss(end);
                html += '<br>';
                html += '</span>';
            }
        } else if (view == 1) { //snap events
            for (var i=0; i<movies['snaps'].length; i++) {
                start = movies['snaps'][i]['start'];
                html += '<span ' + 'onclick="KM.arch_event_clicked(' + i + ')">';
                html += KM.secs_hh_mm_ss(start);
                html += '<br>';
                html += '</span>';
            }
        } else {
            html = '';
        }

        document.getElementById('arch_playlist').innerHTML = html;

        function top_10pc() {
            // return a list of the top 10% event durations
            var top = [];
            var start, end;

            for (var i=0; i<movies['movies'].length; i++) {
                start = movies['movies'][i]['start'];
                end = movies['movies'][i]['end'];
                top[i] = end - start;
            }
            top = top.sort(function(a,b){return a - b});
            var num_hlight = Math.max(1, parseInt(top.length / 10, 10));
            return top.splice(top.length - num_hlight, num_hlight);
        }
    };

    function change_date() {

        // A function that is executed when the date is changed, re-inits
        // 'camera', 'view' and 'mode' dropdowns, reloads the frame dbase and
        //
        // expects:
        //
        // returns:
        //

        KM.session_id.current++;
        var session_id = KM.session_id.current;
        display_secs = 0;
        update_cams_dbase(document.getElementById('date_select').value, session_id);
		reset_display_html();
    };

    function change_camera() {

        // A function that is executed when the camera is changed, re-inits
        // 'view' and 'mode' dropdowns, reloads the frame dbase and
        //
        // expects:
        //
        // returns:
        //

        KM.session_id.current++;
        var session_id = KM.session_id.current;
        display_secs = 0;
        update_movies_dbase(document.getElementById('date_select').value,
                                       document.getElementById('camera_select').value, session_id);
        reset_display_html();
    };

    function change_view() {

        // A function that is executed when the view is changed, calls
        // expects:
        //
        // returns:
        //

        fill_events();
        reset_display_html();
    };

    function playlist_hlight(movie_index) {
        KM.videoPlayer.set_next_movie(movie_index+1);
        var playlist = document.getElementById('arch_playlist');
        if (playlist === null){
            return false;
        }
        var lines = playlist.children;
        for (var i = 0; i < lines.length; i++) {
            if (i != movie_index) {
                lines[i].classList.remove('playlist_hlight');
            } else {
                lines[i].classList.add('playlist_hlight');
                lines[i].scrollIntoView(false);
            }
        }
    }

    function update_playback_info(secs) {

	// A function to updates the title and 'clock'
	//
	// expects:
	// 'secs' ... the 'secs' to display
	//
	// returns:
	//

	var feed = document.getElementById('camera_select').value;
	var title = cameras[feed]['title'];
	var time = KM.secs_hh_mm_ss(secs+KM.videoPlayer.get_time());
    var rate = document.getElementById('playback_rate').value;
	document.getElementById('playback_info').innerHTML = title + ' <' + time + '> [' + rate + ']';
	feed = null; // stop memory leak
	title = null;
    };

    function set_null_playback_info() {

	// A function to updates the title but does not show the 'clock'
	//
	// expects:
	//
	// returns:
	//

	var feed = document.getElementById('camera_select').value;
	var title = cameras[feed]['title'];
	document.getElementById('playback_info').innerHTML = title;
	feed = null; // stop memory leak
	title = null;
    };

    function event_clicked(id) {
        var view = parseInt(document.getElementById('view_select').value);

        if (view == 0) {
            play_movie(id);

        } else if (view == 1) {
            play_snap(id);
        }

    }

    function play_movie(movie_id) {

        // A function that plays the archive forward. If 'from_secs' is
        // specified play forward from 'movie_id' else play forward from
        // current position.
        //
        // expects:
        // 'movie_id'  ... play the archive 'movie_id'
        //
        // returns:
        //

        KM.session_id.current++;
        KM.kill_timeout_ids(KM.ARCH_LOOP);

        if (movies['movies'][movie_id]) {
            playlist_hlight(movie_id);
            display_secs = movies['movies'][movie_id]['start'];
            if (!document.getElementById('html5player')) {
                reset_display_html();
            }
            build_video_player(movie_id);
        }
    }

    function play_snap(snap_id) {
        KM.session_id.current++;
        reset_display_html();
        document.getElementById('arch_player').innerHTML = '<div id="player_obj"> </div>';
        snap_player.set_player({id:'player_obj', width: '100%', height: '100%', snap_id: snap_id});
    }

    function build_video_player(movie_id) {

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

	    // generate the troublesome movie object
	    var date = document.getElementById('date_select').value;
	    var camera = document.getElementById('camera_select').value;
	    var name = movies['movies'][movie_id]['file'];
        var file_ext = name.substr(name.lastIndexOf('.'));
        var start = movies['movies'][movie_id]['start'];
        var end = movies['movies'][movie_id]['end'];
        var next_id = parseInt(movie_id)+1;
        var html5player = document.getElementById('html5player');

        if (!html5player) {
            document.getElementById('arch_player').innerHTML = '<div id="player_obj"></div>';
        }

		KM.videoPlayer.set_movie_duration(end-start);
		KM.videoPlayer.set_cur_event_secs(start);
		KM.videoPlayer.set_next_movie(next_id);

		update_playback_info(start);


		switch (file_ext) {

		case '.swf':
			document.getElementById('arch_player').innerHTML = '<div id="player_obj"></div>';
			document.getElementById('player_obj').innerHTML = "<p><a href=\""+document.URL+name+"\" target='_blank'>DOWNLOAD: "+name.split(/(\\|\/)/g).pop()+"</a></p>";

			var flashvars = {};
			var fparams = {allowFullScreen:'true', allowscriptaccess: 'always', quality:'best', bgcolor:'#000000', scale:'exactfit'};
			var fattributes = {id: 'player_obj', name: 'player_obj'};
			swfobject.embedSWF(name, 'player_obj', '100%', '100%', '9.124.0', 'expressInstall.swf', flashvars, fparams, fattributes);
			movie_id = document.getElementById('player_obj');
			break;

		default:
            if (!html5player) {
                var rate = document.getElementById('playback_rate').value;
                KM.videoPlayer.set_video_player({
                    id:'player_obj',
                    src: name,
                    width: '100%',
                    height: '100%',
                    config: {
                        autoplay:true,
                        controls:true,
                        muted:true,
                        playbackRate:rate
                    }
                });
                html5player = document.getElementById('html5player');
                if (html5player) {
                    html5player.onloadeddata=html5VideoLoaded;
                    html5player.onseeked=html5VideoScrolled;
                    html5player.ontimeupdate=html5VideoProgress;
                    html5player.onended=html5VideoFinished;
                    html5player.onclick=html5playerPlayPause;
                    html5player = null;
                }
            } else {
                html5player.src = name;
            }

			break;
		}
    }

    snap_player = function() {

        var session_id;
        var fps = 1;
        var player;
        var snap = new Image();
        var snap_id = -1;
        var direct = 1;
        var delay = 1000;
        var time = 0;


        function set_player(params) {
            KM.session_id.current++;
            player = document.getElementById(params.id);
            snap.style.width = params.width;
            snap.style.height = params.height;
            add_events();
            snap.onload = function() {reload()};
            snap.onerror = function() {reload()};
            snap.onclick = playpause;
            player.appendChild(snap);
            snap_id = params.snap_id;
            playpause();
        }

        function reload() {
            if (KM.session_id.current === session_id) {
                if (movies['snaps'][snap_id]) {
                    KM.add_timeout_id(KM.ARCH_LOOP, setTimeout(function() {play()}, delay-get_delta()));
                }
            }
        }

        function add_events() {
            document.onkeydown = function(e) {
                    switch (e.which) {
                    case 39:
                        snap_id+=1;
                        playlist_hlight(snap_id);
                        break;
                    case 37:
                        snap_id-=1;
                        playlist_hlight(snap_id);
                        break;
                    case 32:
                        playpause();
                        break;
                    }
                return false;
                }

            }


        function get_delta() {
            return Math.min(100, new Date().getTime()-time);
        }

        function play() {
            KM.kill_timeout_ids(KM.ARCH_LOOP);
            playlist_hlight(snap_id);
            snap.src = movies['snaps'][snap_id]['file'];
            time = new Date().getTime();
            display_secs = movies['snaps'][snap_id]['start'];
            update_playback_info(display_secs);
            progress();
            snap_id+=direct;
        }

        function progress() {
            var rate = document.getElementById('playback_rate');
            if (rate !== null) {
                direct = Math.sign(rate.value);
                fps = Math.abs(rate.value);
            }
            delay = 1000/fps;
        }

        function playpause() {
            KM.kill_timeout_ids(KM.ARCH_LOOP);
            if (KM.session_id.current === session_id) {
                KM.session_id.current++;
            } else {
                session_id = KM.session_id.current;
                play();
            }
        }


        return {
            set_player: set_player,
            playpause: playpause,
            play: play,
            progress: progress
        }
    }();

    function reset_display_html() {
        document.getElementById('arch_player').innerHTML = '';
    }

    return {
	init: init,
	change_date: change_date,
	change_camera: change_camera,
	change_view: change_view,
    event_clicked: event_clicked,
	update_playback_info: update_playback_info
    };
}();

KM.display_archive = KM.display_archive_.init;
KM.arch_change_date = KM.display_archive_.change_date;
KM.arch_change_camera = KM.display_archive_.change_camera;
KM.arch_change_view = KM.display_archive_.change_view;
KM.arch_event_clicked = KM.display_archive_.event_clicked;
KM.update_playback_info = KM.display_archive_.update_playback_info;


/* ****************************************************************************
Log display - Log Code.

Displays logs with critical information highlighted
**************************************************************************** */


KM.display_logs_ = function () {

    // A function that caches log information and displays it with critical
    // information highlighted
    //
    // expects:
    //
    // returns:
    //


    var events;
    var session_id;
    var downloading_message = '<p style="text-align: center">Downloading Logs ...</p>';


    function init() {
        set_logs_html();
        window.onresize=null;
        get_kmotion_logs();
    }

    function set_logs_html() {
        KM.session_id.current++;
        session_id = KM.session_id.current;

        document.getElementById('main_display').innerHTML = '\
        <div class="title">kmotion: Logs</div>\
        <div class="divider" >\
           <img src="images/config_divider_color.png" alt="" style="width:100%;">\
        </div>\
            <div class="config_backdrop">\
            <div id="config_bar">\
               <input type="button" value="Kmotion logs" onclick="KM.get_kmotion_logs()" />\
               <input type="button" value="Motion logs" id="feed_button" onclick="KM.get_motion_logs()" />\
            </div>\
            <div id="config_html"></div>\
        </div>';
    }

    function show_logs() {
        // show the logs
        var log_html = '';
        for (var i=events.length-1; i >= 0; i--) {
            if (events[i].search(new RegExp('failed|error|Deleting current|Incorrect', "i")) !== -1) {
                    log_html += '<span style="color:' + KM.RED + ';">' + format_event(events[i]) + '</span>';
                }
                else if (events[i].search(new RegExp('Deleting|Initial', "i")) !== -1) {
                    log_html +=  '<span style="color:' + KM.BLUE + ';">' + format_event(events[i]) + '</span>';
                }
                else {
                    log_html += format_event(events[i]);
                }
            }
            document.getElementById('config_html').innerHTML = log_html;
    }

    function format_event(event) {
        // string format an event
        var event_split = event.split('#');
        if (event_split.length === 3) {
            return 'Date : ' + event_split[0] + '&nbsp;&nbsp;Time : ' +
                event_split[1] + '&nbsp;&nbsp;Event : ' + event_split[2] + '<br>';
        } else {
            return event+'<br>';
        }
    }

    function callback(obj_data) {
        events = obj_data;
        show_logs();
    }

    function get_kmotion_logs() {
        function retry() {
            KM.kill_timeout_ids(KM.LOGS);
            if (session_id === KM.session_id.current) {
                KM.add_timeout_id(KM.LOGS, setTimeout(function () {get_kmotion_logs(); }, 5000));
            }
        }

        if (session_id === KM.session_id.current) {
            document.getElementById('config_html').innerHTML = downloading_message;
            document.getElementsByClassName('title')[0].innerHTML = "kmotion: Logs->Kmotion logs";
            events = null;

            var jreq = {jsonrpc: '2.0', method: 'logs', id: Math.random()};
            KM.json_request("/ajax/logs", jreq, callback, onerror=retry);
        }
    }

    function get_motion_logs() {
        function retry() {
            KM.kill_timeout_ids(KM.LOGS);
            if (session_id === KM.session_id.current) {
                KM.add_timeout_id(KM.LOGS, setTimeout(function () {get_kmotion_outs(); }, 5000));
            }
        }

        if (session_id === KM.session_id.current) {
            document.getElementById('config_html').innerHTML = downloading_message;
            document.getElementsByClassName('title')[0].innerHTML = "kmotion: Logs->Motion logs";
            events = null;

            var jreq = {jsonrpc: '2.0', method: 'outs', id: Math.random()};
            KM.json_request("/ajax/outs", jreq, callback, onerror=retry);
        }
    }

    return {
        init: init,
        get_kmotion_logs: get_kmotion_logs,
        get_motion_logs: get_motion_logs
    };
}();

KM.display_logs = KM.display_logs_.init;
KM.get_kmotion_logs = KM.display_logs_.get_kmotion_logs;
KM.get_motion_logs = KM.display_logs_.get_motion_logs;



/* ****************************************************************************
Main display - Config - Misc code

Miscellaneous code that provides general closures and functions for config
**************************************************************************** */


KM.display_config_ = function () {

    // A function that launches the config
    //
    // expects:
    //
    // returns:
    //
    var cur_camera = 1; // the current camera
    var cur_mask = ''; // the current expanded mask string
    var error_lines = []; // the error string
    var error_search_str = /failed|error/i;

    function init() {
        KM.session_id.current++;
        conf_config_track.init();
        conf_backdrop_html();
    }

    conf_config_track = function() {

        // A closure that tracks changes to the local config and when needed
        // synchronises these changes with 'www_rc' and requests config reloads.

        var config = {};
        var save_display = false;

        function init() {
            config = JSON.parse(JSON.stringify(KM.config));
        }

        function reset() {
            save_display = false;
            for (var f in KM.config.feeds) {
                delete(KM.config.feeds[f]['reboot_camera']);
            }
            init();
        }

        function saveDisplay(state) {
            save_display = state;
        }

        function get_saveDisplay() {
            return save_display;
        }

        function sync(conf) {
            if (save_display) {
                delete(config['display_feeds']);
                delete(config.misc['display_select']);
            };
            diffObjects = function(obj1, obj2) {
                if (obj1 === null || typeof obj1 !== 'object') {
                    if (obj1 !== obj2)
                        return obj1;
                    else
                        return null;
                }
                if (obj2) {
                    var temp = obj1.constructor(); // give temp the original obj's constructor
                    for (var key in obj1) {
                        var tk = diffObjects(obj1[key], obj2[key]);
                        if (tk !== null)
                            temp[key] = tk;
                    }
                } else {
                    var temp = JSON.parse(JSON.stringify(obj1));
                }
                return temp;
            };

            var diff = diffObjects(KM.config, config);
            var jdata = JSON.stringify(diff);
            var jreq = {jsonrpc: '2.0', method: 'config', id: Math.random(), params: {write: 1, jdata: jdata}};
            KM.json_request("/ajax/config", jreq, reset);
        }

        return {
            init: init,
            saveDisplay: saveDisplay,
            get_saveDisplay: get_saveDisplay,
            sync: sync
        }
    }();

    function conf_backdrop_html() {

        // A function that generates the config backdrop HTML including the top
        // buttons and the main display
        //
        // expects:
        //
        // returns:
        //
        KM.session_id.current++;
        for (var feed in KM.config.feeds) {
            cur_camera = feed;
            break;
        };

        document.getElementById('main_display').innerHTML = '\
        <div class="title">kmotion: Config</div>\
        <div class="divider">\
           <img src="images/config_divider_color.png" alt="" style="width:100%;">\
        </div>\
        <div class="config_backdrop">\
            <div id="config_bar">\
               <input type="button" value="Misc" id="misc_button" onclick="KM.conf_misc_html()" />\
               <input type="button" value="Cameras" id="feed_button" onclick="KM.conf_feed_html()" />\
               <input type="button" value="Server Load" onclick="KM.conf_select_load();" />\
            </div>\
            <div id="config_html"></div>\
        </div>';


        conf_misc_html();
    };


    /* ****************************************************************************
    Config display - Misc config screen

    Displays and processes the misc config screen
    **************************************************************************** */


    function conf_misc_html() {

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
                      <input type="checkbox" id="logs_enabled" onclick="KM.conf_misc_highlight();" />Logs button enabled.<br>\
                      <input type="checkbox" id="archive_enabled" onclick="KM.conf_misc_highlight();" />Archive button enabled.<br>\
                    </div>\
                    <div class="config_tick_margin">\
                        <input type="checkbox" id="config_enabled" onclick="KM.conf_misc_highlight();" />Config button enabled.<br>\
                        <input type="checkbox" id="hide_button_bar" onclick="KM.conf_misc_highlight();" />Hide button bar.<br>\
                    </div>\
                </div>\
                <br /><hr/>\
                <div class="config_group_margin">\
                    <div class="theme_dark"><input type="radio" name="color_select" value="0" onchange="KM.background_button_clicked(0);KM.conf_misc_highlight();">Dark theme</div>\
                    <div class="theme_white"><input type="radio" name="color_select" value="1" onchange="KM.background_button_clicked(1);KM.conf_misc_highlight();">Light theme</div>\
                </div>\
                <br /><hr/>\
                <div class="config_group_margin">\
                <input type="checkbox" id="save_display" onclick="KM.conf_misc_highlight();" />Save the current "Display Select" configuration as default.<br>\
                </div>\
                <br /><hr/>\
                <div class="config_text_margin" id="conf_text" >\
                  <input type="button" id="conf_apply" onclick="KM.conf_apply();" value="Apply" />&nbsp;all changes to the local browser configuration and sync with the remote server.\
               </div>';

        for (var s in KM.config.misc) {
            try {
                if (typeof(KM.config.misc[s]) === "boolean") {
                    document.getElementById(s).checked = KM.config.misc[s];
                } else {
                    document.getElementById(s).value = KM.config.misc[s];
                }
            } catch (e) {}
        }
        document.getElementsByName('color_select')[KM.config.misc.color_select].checked = true;
        document.getElementById('save_display').checked = conf_config_track.get_saveDisplay();
        document.getElementsByClassName('title')[0].innerHTML = "kmotion: Config->Misc";
    };

    function conf_save_display() {

        // A function that saves the display select and color select
        //
        // expects:
        //
        // returns:
        //


        conf_misc_highlight();
    };

    function conf_misc_highlight() {

        // A function that highlights the 'need to apply' warning
        //
        // expects:
        //
        // returns:
        //
        document.getElementById('misc_button').style.fontWeight = 'bold';
        document.getElementById('misc_button').style.color = KM.BLUE;

        conf_misc_update();
    };

    function conf_misc_update() {
        for (var s in KM.config.misc) {
            try {
                if (typeof(KM.config.misc[s]) === "boolean") {
                    KM.config.misc[s] = document.getElementById(s).checked;
                } else if (typeof(KM.config.misc[s]) === "number") {
                    var val = parseInt(document.getElementById(s).value, 10);
                    if (isNaN(val)) {
                        val = 0;
                        document.getElementById(s).value = val;
                    }
                    KM.config.misc[s] = val;
                } else {
                    KM.config.misc[s] = document.getElementById(s).value;
                }
            } catch (e) {}
        }
        conf_config_track.saveDisplay(document.getElementById('save_display').checked);
    };

    function conf_apply() {

        // A function that checks and applys the changes
        //
        // expects:
        //
        // returns:
        //

        conf_config_track.sync();
        KM.blink_button(document.getElementById('conf_apply'), conf_backdrop_html);
        //KM.conf_backdrop_html();
    };

    /* ****************************************************************************
    Config display - Feed config screen

    Displays and processes the feed config screens
    **************************************************************************** */

    function conf_feed_html() {

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
            '<div class="config_margin_left_20px" style="font-weight:bold;padding:10px;text-align:center">Click on the image or buttons to edit the motion mask.</div>' +
        '</div>' +

         '<div class="config_tick_margin">' +
         '<div  class="config_text_margin">' +
            '<select style="width:190px;" id="feed_camera" onchange="KM.conf_feed_change();">';
            for (var f in KM.config.feeds) {
                html_str+='<option value="'+f+'">'+KM.config.feeds[f].feed_name+'</option>';
            };
            html_str+='</select>\
                        <input type="checkbox" id="feed_enabled" onclick="KM.conf_feed_enabled();" />Enable camera&nbsp; \
                        <input type="checkbox" id="reboot_camera" onclick="KM.conf_reboot_camera('+cur_camera+');" />Reboot camera \
                        <br> \<br>\
                  </div></div><div class="config_tick_margin"> \
                <br /><hr/> \
                <div class="config_tick_margin">\
                <div class="config_tick_margin">\
                  <div class="config_text">Device:</div>\
                  <div class="config_text">URL:</div>\
                  <div class="config_text">Name:</div>\
                  <div class="config_text">Width:</div>\
                  <div class="config_text">Threshold:</div>\
                </div>\
                <div class="config_tick_margin">\
                <div class="config_text">\
                  <select style="width:190px" id="feed_device" onchange="KM.conf_feed_net_highlight();" disabled>';
                    for (var i=0;i<KM.max_feed();i++) {
                        html_str+='<option value="'+i+'">/dev/video'+i+'</option>';
                    };
                    html_str+='<option value="-1">Network Cam</option></select>\
                  </select>\
                  </div>\
                    <div class="config_text">\
                  <input type="text" id="feed_url" style="width: 190px; margin-left: 1px;" onchange="KM.conf_feed_highlight();" /></div>\
                  <div class="config_text">\
                  <input type="text" id="feed_lgn_name" style="width: 190px;  margin-left: 1px;" onchange="KM.conf_feed_highlight();" /></div>\
                  <div class="config_text">\
                  <input type="text" id="feed_width" size="4" onchange="KM.conf_feed_highlight();" /><span>px</span></div>\
                  <div class="config_text">\
                  <input type="text" id="feed_threshold" size="3" onchange="KM.conf_feed_highlight();" /><span>px</span></div>\
                </div></div>\
                <div class="config_tick_margin">\
                <div class="config_tick_margin">\
                  <div class="config_text">Input:</div>\
                  <div class="config_text">Proxy:</div>\
                  <div class="config_text">Password:</div>\
                  <div class="config_text">Height:</div>\
                  <div class="config_text">FPS:</div>\
                </div>\
                <div class="config_tick_margin">\
                <div class="config_text">\
                <select style="width:190px" id="feed_input" onchange="KM.conf_feed_highlight();" disabled>\
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
                  <div class="config_text"><input type="text" id="feed_proxy" style="width: 190px; height: 15px; margin-left: 1px; margin-top:1px;"\ onchange="KM.conf_feed_highlight();" /></div>\
                  <div class="config_text"><input type="password" id="feed_lgn_pw" style="width: 190px; height: 15px; margin-left: 1px; margin-top:1px;"\ onchange="KM.conf_feed_highlight();" /></div>\
                  <div class="config_text"><input type="text" id="feed_height" size="4" style="margin-top:1px;" onchange="KM.conf_feed_highlight();" /><span style="color:#818181;font-size: 17px;font-weight: bold;margin-left: 0px;">px</span></div>\
                  <div class="config_text"><input type="text" id="feed_fps" style="width: 190px; height: 15px; margin-left: 1px; margin-top:1px;"\ onchange="KM.conf_feed_highlight();" /></div>\
                </div></div>\
                <br /><hr />\
                <div class="config_tick_margin">\
                  <div class="config_text">Camera name: <input style="width:190px" type="text" id="feed_name" size="15" onchange="KM.conf_feed_highlight();" value="'+cur_camera+'"/></div>\
                </div>\
                </div>\
                <br /><hr/>\
                <div class="config_text_margin">\
                  <input type="checkbox" id="feed_show_box" onclick="KM.conf_feed_highlight();" />Enable motion highlighting. (Draw box around detected motion)\
                </div>\
                <br /><hr/>\
                <div class="config_text_margin">\
                  <input type="checkbox" id="feed_snap_enabled" onclick="KM.conf_feed_highlight();" />Enable snapshot mode. Record an image in time lapse mode with a pause between images.\
                </div>\
                <div class="config_text_margin" style="width:412px;">\
                  of : <input type="text" id="feed_snap_interval" size="4" onchange="KM.conf_feed_highlight();" />Seconds, (300 Seconds recommended)\
                </div>\
                <div class="config_text">Quality of snapshots: <input type="text" id="feed_quality" size="3" style="margin-top:1px;" onchange="KM.conf_feed_highlight();" /><span style="color:#818181;font-size: 17px;font-weight: bold;margin-left: 0px;">%</span></div>\
                <br /><hr/>\
                </div><br />';


        if (KM.config.feeds[cur_camera].feed_enabled) {
            html_str = html_str.replace(/disabled/g, '');
            html_str = html_str.replace(/gcam.png/, 'bcam.png');
        }
        document.getElementById('config_html').innerHTML = html_str;

        // has to be this messy way to avoid flicker
        //console.log(KM.config.feed_device[cur_camera]);
        if (KM.config.feeds[cur_camera].feed_enabled) {
            conf_live_feed_daemon(KM.session_id.current, cur_camera);
            if (KM.config.feeds[cur_camera].feed_device == -1) {
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
        document.getElementById('feed_camera').value = cur_camera;
        try {
            document.getElementById('reboot_camera').checked = KM.config.feeds[cur_camera]['reboot_camera'] == true;
        } catch(e) {}
        for (var s in KM.config.feeds[cur_camera]) {
            try {
                if (typeof (KM.config.feeds[cur_camera][s]) === "boolean") {
                    document.getElementById(s).checked = KM.config.feeds[cur_camera][s];
                } else {
                    document.getElementById(s).value = KM.config.feeds[cur_camera][s];
                }

            } catch (e) {}
        }


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

        if (KM.config.feeds[cur_camera].feed_mask) {
            cur_mask = '';
            var mask_lines = KM.config.feeds[cur_camera].feed_mask.split('#');
            for (var i = 0; i < 15; i++) {
                cur_mask += KM.pad_out(parseInt(mask_lines[i], 16).toString(2), 15);
            }
            if (KM.config.feeds[cur_camera].feed_enabled) {
                // if enabled show the mask
                for (var i = 0; i < 225; i++) {
                    if (cur_mask.charAt(i) === '1') {
                        document.getElementById('mask_img_' + (i + 1)).src = 'images/mask.png'
                    }
                }
            }
        }
        document.getElementsByClassName('title')[0].innerHTML = "kmotion: Config->Cameras";
    };

    function conf_toggle_feed_mask(mask_num) {

        // A function that toggles the mask region
        //
        // expects:
        // 'mask_num' ... the mask number to be toggled
        //
        // returns:
        //

        if (cur_mask.charAt(mask_num - 1) === '0' && document.getElementById('feed_enabled').checked) {
            document.getElementById('mask_img_' + mask_num).src = 'images/mask.png';
            cur_mask = cur_mask.substr(0, mask_num - 1) + '1' + cur_mask.substr(mask_num);
        } else {
            document.getElementById('mask_img_' + mask_num).src = 'images/mask_trans.png';
            cur_mask = cur_mask.substr(0, mask_num - 1) + '0' + cur_mask.substr(mask_num);
        }
        conf_feed_highlight();
    };

    function conf_feed_mask_button(button_num) {

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
            cur_mask = cur_mask.substr(0, mask_num - 1) + '1' + cur_mask.substr(mask_num);

        } else if (button_num === 2) {
            if (cur_mask.substr(mask_num - 1, 1) === '0') {

            cur_mask = cur_mask.substr(0, mask_num - 1) + '1' + cur_mask.substr(mask_num);
            document.getElementById('mask_img_' + mask_num).src = 'images/mask.png';

            } else {

            cur_mask = cur_mask.substr(0, mask_num - 1) + '0' + cur_mask.substr(mask_num);
            document.getElementById('mask_img_' + mask_num).src = 'images/mask_trans.png';
            }

        } else if (button_num === 3) {
            document.getElementById('mask_img_' + mask_num).src = 'images/mask_trans.png';
            cur_mask = cur_mask.substr(0, mask_num - 1) + '0' + cur_mask.substr(mask_num);
        }
        }
        conf_feed_highlight();
    };

    function conf_feed_change() {

        // A function changes the current camera, its breaks good programing
        // practice by incrementing the session id and reloading the HTML from
        // within the HTML .... yuk !!
        //
        // expects:
        //
        // returns:
        //

        KM.session_id.current++; // needed to kill the live feed daemon
        cur_camera = document.getElementById('feed_camera').value;
        KM.add_timeout_id(KM.MISC_JUMP, setTimeout(function () {conf_feed_html(); }, 1));
    };

    function conf_feed_enabled() {

        // A function that enables/disables the current feed gui
        //
        // expects:
        //
        // returns:
        //

        conf_feed_highlight();
        if (document.getElementById('feed_enabled').checked) {
            conf_feed_ungrey();
        } else {
            conf_feed_grey();
        }
        // have to generate new mask on feed enabled
    };

    function conf_reboot_camera(camera) {
        conf_feed_highlight();
        KM.config.feeds[camera]['reboot_camera'] = document.getElementById('reboot_camera').checked;
    };

    function conf_feed_net_highlight() {

        // A function that enables/disables user inputs for net cams
        //
        // expects:
        //
        // returns:
        //

        if (document.getElementById('feed_device').value == -1) {
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
        conf_feed_highlight()
    };

    function conf_feed_grey() {

        // A function that greys out the feed screen
        //
        // expects:
        //
        // returns:
        //

        KM.session_id.current++; // needed to kill updates
        for (var s in KM.config.feeds[cur_camera]) {
            try {
                if (s != 'feed_enabled')
                    document.getElementById(s).disabled = true;
            } catch (e) {}
        }

        var ids = ['mask_all' , 'mask_invert', 'mask_none'];
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

    function conf_feed_ungrey() {

        // A function that un-greys out the feed screen
        //
        // expects:
        //
        // returns:
        //

        conf_live_feed_daemon(KM.session_id.current, cur_camera);

        for (var s in KM.config.feeds[cur_camera]) {
            try {
                if (s != 'feed_enabled')
                    document.getElementById(s).disabled = false;
            } catch (e) {}
        }

        var ids = ['mask_all' , 'mask_invert', 'mask_none'];
        for (var i = 0; i < ids.length; i++) {
             try {
                 document.getElementById(ids[i]).disabled = false;
             } catch (e) {}
        }

        conf_feed_net_highlight();
        document.getElementById('image').src = 'images/bcam.png';
        // if enabled show the mask
        for (var i = 0; i < 225; i++) {
            if (cur_mask.charAt(i) === '1') {
                document.getElementById('mask_img_' + (i + 1)).src = 'images/mask.png'
            }
        }
    };

    function conf_feed_highlight() {

        // A function that highlight the 'need to apply' warning
        //
        // expects:
        //
        // returns:
        //

        document.getElementById('feed_button').style.fontWeight = 'bold';
        document.getElementById('feed_button').style.color = KM.BLUE;

        conf_feed_update();
    };

    function conf_feed_update() {
        for (var s in KM.config.feeds[cur_camera]) {
            try {
                if (typeof (KM.config.feeds[cur_camera][s]) === "boolean") {
                    KM.config.feeds[cur_camera][s] = document.getElementById(s).checked;
                } else if (typeof (KM.config.feeds[cur_camera][s]) === "number") {
                    var val = parseInt(document.getElementById(s).value, 10);
                    if (isNaN(val)) {
                        val = 0;
                        document.getElementById(s).value = val;
                    }
                    KM.config.feeds[cur_camera][s] = val;
                } else {
                    KM.config.feeds[cur_camera][s] = document.getElementById(s).value;
                }
            } catch (e) {}
        }

        if (KM.config.feeds[cur_camera].feed_mask) {
            var tmp = '';
            KM.config.feeds[cur_camera].feed_mask = '';
            for (var i = 0; i < 15; i++) {
                tmp = cur_mask.substr(i * 15, 15);
                KM.config.feeds[cur_camera].feed_mask += parseInt(tmp, 2).toString(16) + '#';
            }
        }

        var width = parseInt(document.getElementById('feed_width').value, 10);
        if (isNaN(width)) width = 0;
        width = parseInt(width / 16) * 16;
        if (KM.config.feeds[cur_camera].feed_width !== width) {
            // if the image size changes, change the mask
            KM.config.feeds[cur_camera].feed_width = width;
        }
        // feed value back to gui in case parseInt changes it
        document.getElementById('feed_width').value = width;

        var height = parseInt(document.getElementById('feed_height').value, 10);
        if (isNaN(height)) height = 0;
        height = parseInt(height / 16) * 16;
        if (KM.config.feeds[cur_camera].feed_height !== height) {
            // if the image size changes, change the mask
            KM.config.feeds[cur_camera].feed_height = height;
        }
        // feed value back to gui in case parseInt changes it
        document.getElementById('feed_height').value = height;
    };

    function conf_live_feed_daemon(session_id, feed) {

        // A closure that acts as a daemon constantly refreshing the config display
        // loading feed jpegs and displaying them. Follows the low CPU user
        // setting.
        //
        // expects:
        //
        // returns:
        //

        refresh(session_id, feed);

        function refresh(session_id, feed) {
            KM.kill_timeout_ids(KM.CONFIG_LOOP); // free up memory from 'setTimeout' calls
            if (KM.session_id.current === session_id) {
                try {
                    document.getElementById('image').src = KM.get_jpeg(feed);
                    KM.add_timeout_id(KM.CONFIG_LOOP, setTimeout(function () {refresh(session_id, feed); }, 1000));
                } catch (e) {}
            }
        }
    };


    /* ****************************************************************************
    Config display - Load screen

    Displays the server load error code
    **************************************************************************** */


    function conf_load_html() {

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

        '<br />'+

        '<div id="load_av_title" class="config_text_center">' +
            'Load Averages' +
        '</div>' +

        create_bar('1 min', 1) +
        create_bar('5 min', 2) +
        create_bar('15 min', 3) +

        '<br />' +

        '<div id="cpu_title" class="config_text_center">' +
            'Central Processing Unit' +
        '</div>' +

        create_bar('User', 4) +
        create_bar('System', 5) +
        create_bar('IO Wait', 6) +

        '<br />' +

        '<div id="memory_title" class="config_text_center">' +
            'Memory' +
        '</div>' +

        create_bar('System', 7) +
        create_bar('Buffered', 8) +
        create_bar('Cached', 9) +

        '<br />' +

        '<div id="swap_title" class="config_text_center">' +
            'Swap' +
        '</div>' +

        create_bar('Swap', 10) +
        '<br />';

        function create_bar(text, bar_number) {
            if (KM.browser.browser_IE) { // ugly hack as a workaround for IE
                return '' +
                '<div class="bar_bground" style="margin-top:9px;">' +
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
                '<div class="bar_bground" style="margin-top:9px;">' +
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



        function update_text() {
            document.getElementById('server_info').innerHTML = dbase.uname + ' Uptime ' + dbase.up;
            document.getElementById('memory_title').innerHTML = 'Memory ' + dbase.mt + 'k';
            document.getElementById('swap_title').innerHTML = 'Swap ' + dbase.st + 'k';
        }

        function update_bars() {
            var coef = dbase.cpu + 0.5;
            // load average 1 min
            document.getElementById('bar_value1').innerHTML = dbase.l1;
            var tmp = Math.min(dbase.l1, coef);
            document.getElementById('bar_fground1').style.width = 100*(tmp / coef) + '%';

            // load average 5 min
            document.getElementById('bar_value2').innerHTML = dbase.l2;
            tmp = Math.min(dbase.l2, coef);
            document.getElementById('bar_fground2').style.width = 100*(tmp / coef) + '%';
            if (tmp >= dbase.cpu) {
                document.getElementById('bar_fground2').style.backgroundColor = BAR_ALERT;
            } else {
                document.getElementById('bar_fground2').style.backgroundColor = BAR_OK;
            }

            // load average 15 min
            document.getElementById('bar_value3').innerHTML = dbase.l3;
            tmp = Math.min(dbase.l3, coef);
            document.getElementById('bar_fground3').style.width = 100*(tmp / coef) + '%';
            if (tmp >= dbase.cpu) {
                document.getElementById('bar_fground3').style.backgroundColor = BAR_ALERT;
            } else {
                document.getElementById('bar_fground3').style.backgroundColor = BAR_OK;
            }

            // CPU user
            document.getElementById('bar_value4').innerHTML = dbase.cu + '%';
            tmp = dbase.cu;
            document.getElementById('bar_fground4').style.width = tmp + '%';

            // CPU system
            document.getElementById('bar_value5').innerHTML = dbase.cs + '%';
            tmp = dbase.cs;
            document.getElementById('bar_fground5').style.width = tmp + '%';

            // CPU IO wait
            document.getElementById('bar_value6').innerHTML = dbase.ci + '%';
            tmp = dbase.ci;
            document.getElementById('bar_fground6').style.width = tmp + '%';

            // memory system
            var non_app = parseInt(dbase.mf) + parseInt(dbase.mb) + parseInt(dbase.mc);
            var app = dbase.mt - non_app;
            document.getElementById('bar_value7').innerHTML = app + 'k';
            tmp = (app / dbase.mt) * 100;
            document.getElementById('bar_fground7').style.width = tmp + '%';

            // memory buffers
            document.getElementById('bar_value8').innerHTML = dbase.mb + 'k';
            tmp = (dbase.mb / dbase.mt) * 100;
            document.getElementById('bar_fground8').style.width = tmp + '%';

            // memory cached
            document.getElementById('bar_value9').innerHTML = dbase.mc + 'k';
            tmp = (dbase.mc / dbase.mt) * 100;
            document.getElementById('bar_fground9').style.width = tmp + '%';

            // swap
            document.getElementById('bar_value10').innerHTML = dbase.su + 'k';
            dbase.st = Math.max(dbase.st, 1);  // if no swap, avoids div 0
            tmp = (dbase.su / dbase.st) * 100;
            document.getElementById('bar_fground10').style.width = tmp + '%';
            if (tmp >= 0.1) {
                document.getElementById('bar_fground10').style.backgroundColor = BAR_ALERT;
            } else {
                document.getElementById('bar_fground10').style.backgroundColor = BAR_OK;
            }
        }

        function rolling_update() {
            function callback(obj_data) {
                dbase = obj_data;
                update_text();
                update_bars();
                reload();
            }

            function reload() {
                KM.kill_timeout_ids(KM.CONFIG_LOOP);
                dbase = null;
                KM.add_timeout_id(KM.CONFIG_LOOP, setTimeout(function () {rolling_update(); }, 2000));
            }

            if (KM.session_id.current === session_id) {
                var jreq = {jsonrpc: '2.0', method: 'loads', id: Math.random()};
                KM.json_request("/ajax/loads", jreq, callback);
            }

        }

        rolling_update();
    };

    function conf_select_load() {

        // A function that is executed when the 'load' button is clicked
        //
        // expects:
        //
        // returns:
        //


        KM.session_id.current++;
        conf_load_html();
        document.getElementsByClassName('title')[0].innerHTML = "kmotion: Config->Server load";
    };

    return {
        init: init,
        conf_select_load: conf_select_load,
        conf_misc_html: conf_misc_html,
        conf_misc_highlight: conf_misc_highlight,
        conf_feed_html: conf_feed_html,
        conf_apply: conf_apply,
        conf_feed_change: conf_feed_change,
        conf_feed_enabled: conf_feed_enabled,
        conf_reboot_camera: conf_reboot_camera,
        conf_feed_highlight: conf_feed_highlight,
        conf_feed_net_highlight: conf_feed_net_highlight,
        conf_toggle_feed_mask: conf_toggle_feed_mask,
        conf_feed_mask_button: conf_feed_mask_button,
    }


}();

KM.display_config = KM.display_config_.init;
KM.conf_error_html = KM.display_config_.conf_error_html;
KM.conf_select_errors = KM.display_config_.conf_select_errors;
KM.conf_select_load = KM.display_config_.conf_select_load;
KM.conf_misc_html = KM.display_config_.conf_misc_html;
KM.conf_misc_highlight = KM.display_config_.conf_misc_highlight;
KM.conf_apply = KM.display_config_.conf_apply;
KM.conf_feed_html = KM.display_config_.conf_feed_html;
KM.conf_feed_change = KM.display_config_.conf_feed_change;
KM.conf_feed_enabled = KM.display_config_.conf_feed_enabled;
KM.conf_reboot_camera = KM.display_config_.conf_reboot_camera;
KM.conf_feed_highlight = KM.display_config_.conf_feed_highlight;
KM.conf_feed_net_highlight = KM.display_config_.conf_feed_net_highlight;
KM.conf_toggle_feed_mask = KM.display_config_.conf_toggle_feed_mask;
KM.conf_feed_mask_button = KM.display_config_.conf_feed_mask_button;




KM.blink_button = function(button, callback) {
    var fw = button.style.fontWeight;
    var c = KM.BLUE;
    button.style.fontWeight = 'bold';
    button.style.color = KM.RED;
    restore_button = function() {
        KM.kill_timeout_ids(KM.BUTTON_BLINK);
        button.style.fontWeight = fw;
        button.style.color = c;
        if (callback !== undefined) {
            callback();
        }
    }
    KM.add_timeout_id(KM.BUTTON_BLINK, setTimeout(function() {restore_button();}, 250));

};


KM.videoPlayer = function() {

    var tm=0;
    var paused=false;
    var movie_duration=0;
    var next_movie=0;
    var cur_event_secs=0;
    var current_play_accel=1;

    function set_cur_event_secs(secs) {
        cur_event_secs = secs;
    }

    function set_next_movie(movie_id) {
        next_movie = movie_id;
    }

    function set_movie_duration(dur) {
        movie_duration = dur;
    }

    function get_time() {
        return tm;
    }

    function set_play_accel(accel) {
        current_play_accel = accel;
    }

    function ktVideoProgress(time) {
    // вызывается каждую секунду проигрывания видео
        tm=parseInt(time,10);
        if ((current_play_accel>0)&&(current_play_accel<5)){
            if (document.getElementById('flashplayer')['jsScroll']) {
                document.getElementById('flashplayer').jsScroll(++tm);
            }
        }
        KM.update_playback_info(cur_event_secs);
    }

    function ktVideoFinished() {
        tm=0;
        KM.arch_event_clicked(next_movie);
    }

    function ktVideoScrolled(time) {
    // вызовется при перемотке видео
        tm=parseInt(time,10);
        KM.update_playback_info(cur_event_secs);
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
                KM.update_playback_info(cur_event_secs);
                flashplayer=null;
            }
            return false;
        }
    }

    function html5VideoProgress() {
        if (document.getElementById('html5player')) {
            var html5player=document.getElementById('html5player');

            var rate = document.getElementById('playback_rate').value;
            html5player.playbackRate=rate;
            tm=html5player.currentTime;
            KM.update_playback_info(cur_event_secs);
            html5player=null;
        }
    }

    function html5VideoScrolled() {
        if (document.getElementById('html5player')) {
            var html5player=document.getElementById('html5player');
            tm=html5player.currentTime;
            KM.update_playback_info(cur_event_secs);
            html5player=null;
        }
    }

    function html5VideoFinished() {
        tm=0;
        KM.arch_event_clicked(next_movie);
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
                KM.update_playback_info(cur_event_secs);
                html5player=null;
            }
            return false;
        }
    }

    function set_video_player(params) {
		function getFileExtension(filename) {
			var ext = /^.+\.([^.]+)$/.exec(filename);
			return ext == null ? "" : ext[1];
		}

		function ID() {
			return '_' + Math.random().toString(36).substr(2, 9);
		}

		function checkVideo(format) {
			switch (format) {
			case 'mp4':
				var vidTest = document.createElement("video");
				if (vidTest.canPlayType) {
					h264Test = vidTest
							.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"'); // mp4
																						// format
					if (!h264Test) { // if it doesnot support .mp4 format
						return "flash"; // play flash
					} else {
						if (h264Test == "probably") { // supports .mp4 format
							return "html5"; // play HTML5 video
						} else {
							return "flash"; // play flash video if it doesnot
											// support any of them.
						}
					}
				}
			case 'ogv':
				var vidTest = document.createElement("video");
				if (vidTest.canPlayType) {
					oggTest = vidTest
							.canPlayType('video/ogg; codecs="theora, vorbis"'); // ogg
																				// format
					if (!oggTest) { // if it doesnot support
						return "none"; // play flash
					} else {
						if (oggTest == "probably") { // supports
							return "html5"; // play HTML5 video
						} else {
							return "none"; // play flash video if it doesnot
											// support any of them.
						}
					}
				}
			case 'webm':
				var vidTest = document.createElement("video");
				if (vidTest.canPlayType) {
					webmTest = vidTest
							.canPlayType('video/webm; codecs="vp8.0, vorbis"'); // webm
																				// format
					if (!webmTest) { // if it doesnot support
						return "none"; // play flash
					} else {
						if (webmTest == "probably") { // supports
							return "html5"; // play HTML5 video
						} else {
							return "none"; // play flash video if it doesnot
											// support any of them.
						}
					}
				}
				break;
			case 'flv':
			case 'swf':
				return "flash";
				break;
			default:
				return "none";
			}
		}

		var canplay = checkVideo(getFileExtension(params.src));

		if (canplay == "html5") {
			document.getElementById(params.id).innerHTML = '<video id="html5player" width="'
					+ params.width
					+ '" height="'
					+ params.height
                    + '"</video>';

			var html5player = document.getElementById('html5player');
            for (var key in params.config) {
                if (params.config.hasOwnProperty(key))
                    try {
                        html5player[key] = params.config[key];
                    } catch (e) {};
            }
			html5player.innerHTML = "<p><a href=\"" + document.URL + params.src
					+ "\" target='_blank'>DOWNLOAD: "
					+ params.src.split(/(\\|\/)/g).pop() + "</a></p>";

			html5player.src = params.src;
		} else if (canplay == "flash") {
			var id = ID();
			document.getElementById(params.id).innerHTML = '<div id="' + id
					+ '"> </div>';
			document.getElementById(id).innerHTML = "<p><a href=\"" + document.URL
					+ params.src + "\" target='_blank'>DOWNLOAD: "
					+ params.src.split(/(\\|\/)/g).pop() + "</a></p>";

			var flashvars = {
				video_url : params.src,
				permalink_url : document.URL + params.src,
				bt : 5,
				scaling : 'fill',
				hide_controlbar : 0,
				flv_stream : false,
				autoplay : true,
				js : 1
			};
			var fparams = {
				allowfullscreen : 'true',
				allowscriptaccess : 'always',
				quality : 'best',
				bgcolor : '#000000',
				scale : 'exactfit'
			};
			var fattributes = {
				id : 'flashplayer',
				name : 'flashplayer'
			};
			swfobject.embedSWF('media/kt_player.swf', id, params.width, params.height,
					'9.124.0', 'media/expressInstall.swf', flashvars, fparams,
					fattributes);
		} else {
			document.getElementById(params.id).innerHTML = "<p><a href=\""
					+ document.URL + params.src + "\" target='_blank'>DOWNLOAD: "
					+ params.src.split(/(\\|\/)/g).pop() + "</a></p>";
		}
	}

    ///////////////////EXPORT METHODS//////////////////////////////

    return {
        set_video_player: set_video_player,
        set_cur_event_secs: set_cur_event_secs,
        set_next_movie: set_next_movie,
        set_movie_duration: set_movie_duration,
        get_time: get_time,
        set_play_accel: set_play_accel,

        ///////////////////FLASHPLAYER EVENTS//////////////////////////////

        ktVideoProgress: ktVideoProgress,
        ktVideoFinished: ktVideoFinished,
        ktVideoScrolled: ktVideoScrolled,
        ktVideoStarted: ktVideoStarted,
        ktVideoPaused: ktVideoPaused,
        ktVideoStopped: ktVideoStopped,
        ktPlayerLoaded: ktPlayerLoaded,

        /////////////////HTML5PLAYER EVENTS/////////////////////////

        html5VideoProgress: html5VideoProgress,
        html5VideoScrolled: html5VideoScrolled,
        html5VideoFinished: html5VideoFinished,
        html5playerPlayPause: html5playerPlayPause,
        html5VideoLoaded: html5VideoLoaded
    }
}();

var ktVideoProgress = KM.videoPlayer.ktVideoProgress;
var ktVideoFinished = KM.videoPlayer.ktVideoFinished;
var ktVideoScrolled = KM.videoPlayer.ktVideoScrolled;
var ktVideoStarted = KM.videoPlayer.ktVideoStarted;
var ktVideoPaused = KM.videoPlayer.ktVideoPaused;
var ktVideoStopped = KM.videoPlayer.ktVideoStopped;
var ktPlayerLoaded = KM.videoPlayer.ktPlayerLoaded;
var html5VideoProgress = KM.videoPlayer.html5VideoProgress;
var html5VideoScrolled = KM.videoPlayer.html5VideoScrolled;
var html5VideoFinished = KM.videoPlayer.html5VideoFinished;
var html5playerPlayPause = KM.videoPlayer.html5playerPlayPause;
var html5VideoLoaded = KM.videoPlayer.html5VideoLoaded;


KM.init();











