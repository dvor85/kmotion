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
KM.BUTTON_BLINK = 'BUTTON_BLINK';
KM.ERROR_DAEMON = 'ERROR_DAEMON';
KM.GET_DATA     = 'GET_DATA';
KM.FEED_CACHE   = 'FEED_CACHE';
KM.DISPLAY_LOOP = 'DISPLAY_LOOP';
KM.ARCH_LOOP    = 'ARCH_LOOP';
KM.LOGS         = 'LOGS';
KM.CONFIG_LOOP  = 'CONFIG_LOOP';
KM.MISC_JUMP    = 'MISC_JUMP';

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
		h_button_bar.style.right='165px';
		document.getElementById('main_display').style.right='165px';
	} else {
		button_bar.style.display='none';
		h_button_bar.style.right='0px';
		document.getElementById('main_display').style.right='10px';
	}

	KM.function_button_clicked(KM.menu_bar_buttons.function_selected);
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
	var _got = false;
	function request() {
	    xmlHttp.onreadystatechange = function () {
            if ((xmlHttp.readyState === 4) && (xmlHttp.status === 200)) {
                xmlHttp.onreadystatechange = null; // plug memory leak
                try {
                    KM.config = JSON.parse(xmlHttp.responseText);
                    _got = true;                    
                } catch(e) {console.log('Error while getting config!')}
                set_settings(callback);
            }
	    };
	    xmlHttp.open('GET', '/ajax/config?read='+ Math.random(), true);
	    xmlHttp.send(null);
	}

	function retry() {
        KM.kill_timeout_ids(KM.GET_DATA);
	    if (!_got) {
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
            document.getElementById('cb' + f).style.background = 'url(images/temp1.png) no-repeat bottom left';            
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
                KM.videoPlayer.set_play_accel(1);
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
    var fps = 1;
    var max_streams = 10;
    var update_counter = {};

    function init() {
        // setup for grid display
        KM.session_id.current++;
        KM.set_main_display_size(); // in case user has 'zoomed' browser view
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
            update_feeds();
            KM.add_timeout_id(KM.DISPLAY_LOOP, setTimeout(function () {refresh(session_id); }, 1000/fps));
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
                if (camera_last_pos>0) {
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
        
        try {
            var feed = KM.config.display_feeds[display_num][html_count++];
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
        l.push('style="position:absolute; ');
        l.push('left:' + left + 'px; ');
        l.push('top:' + top + 'px; ');
        l.push('width:' + width + 'px; ');
        l.push('height:' + height + 'px;" ');
        l.push('src="' + jpeg + '"; ');
        l.push('alt="">');
        
        l.push('<span id="text_' + feed + '"; ');
        l.push('style="position:absolute; ');
        l.push('left:' + (left + text_left) + 'px; ');
        l.push('top:' +  (top + text_top) + 'px;');
        l.push('font-weight: bold;');
        l.push('color:' + text_color  + ';');
        l.push('">' + text + '</span>');
        html += l.join(' ');
        
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
    
    function update_feeds() {

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
        if ((xmlHttp.readyState === 4) && (xmlHttp.status === 200)) {
                xmlHttp.onreadystatechange = null; // plug memory leak
                try {
                    latest_events = JSON.parse(xmlHttp.responseText);
                    text_refresh();
                    update_jpegs();
                } catch(e) {console.log('Error while updating feeds!')}
            }
        };

        xmlHttp.open('GET', '/ajax/feeds?'+Math.random() + '&rdd='+encodeURIComponent(KM.config.ramdisk_dir), true);
        xmlHttp.send(null);
    };
    
    function text_refresh() {

        // A function that refresh the display text colors, 'white' for feed
        // disabled, 'blue' for no motion 'red' for motion.
        //
        // expects :
        //
        // returns :
        //

        var text_color,feed;
        for (var i=0;i<KM.config.display_feeds[KM.config.misc.display_select].length;i++) {
            try {
                feed = KM.config.display_feeds[KM.config.misc.display_select][i]
                text_color = KM.WHITE;           
                if (KM.config.feeds[feed].feed_enabled) {
                    text_color = KM.BLUE;
                    if (KM.item_in_array(feed, latest_events)) {
                        text_color = KM.RED;
                    }
                }
                document.getElementById("text_" + feed).style.color = text_color;
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
    
    function update_jpegs() { 
        var feed;
        var image_feed;
        
        var display_feeds_sorted = KM.config.display_feeds[KM.config.misc.display_select].slice(0);
        display_feeds_sorted.sort(display_feeds_compare_by_counter).sort(display_feeds_compare_by_latest);
        /*console.log('display_feeds_b = ' + KM.config.display_feeds[KM.config.misc.display_select]);
        console.log('display_feeds_sorted = ' + display_feeds_sorted);
        console.log('display_feeds_a = ' + KM.config.display_feeds[KM.config.misc.display_select]);*/
        
        var stream_counter = 0; //счетчик одновременных обновлений
        for (var i=0;i<display_feeds_sorted.length;i++) {    
            try {  
                feed = display_feeds_sorted[i];
                image_feed = document.getElementById('image_'+feed);
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
                       (display_feeds_sorted.length == 1) || 
                       (KM.item_in_array(feed, latest_events))) && 
                       
                       (image_loads.is_loaded(feed) && (stream_counter<max_streams)))  {
                       
                            /*console.log('\n');
                            console.log('UPDATE FEED ' + feed);
                            console.log('\n');*/
                            update_counter[feed] = 0;
                            stream_counter++;
                            image_loads.reset(feed);
                            image_feed.src=KM.get_jpeg(feed);
                            
                    } else {
                        if (update_counter[feed] !== undefined) {
                            update_counter[feed]++;
                        } else {
                            update_counter[feed] = 1;
                        }
                        
                    }
                }
            } catch (e) {}
        }       
    };
    
    function set_last_camera(last_camera) {
        last_camera_select = last_camera
    }
    
    return {
        init: init,
        set_last_camera: set_last_camera
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

    var movie_show =    false; // currently showing
    var snap_show =     false;
    
    var dates =         {}; // array of avaliable dates
    var cameras =       {}; // multi-dimensional array of cameras per date
    var movies =        {};

    var event_mode =  true; // in event as opposed to display mode
    var play_mode =   true; // in play as opposed to frame mode
    var display_secs =   0; // the current secs count
    var play_accel =     1; // the FF/REW play_acceleration -4 to 4

    var tline_old_slt = -1; // the old timeline slot
    var tline_old_src = ''; // the old time line src

    var backdrop_height = 0; // archive backdrop height
    var backdrop_width =  0; // archive backdrop width


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
        
        populate_dates_dbase(callback_populate_dates_dbase, session_id);
     
        
    }
    
    function callback_populate_dates_dbase(session_id) {
        if (dates === {}) {
            var html  = '<div class="archive_msg" style="text-align: center"><br><br>';
            html += 'There are currently no recorded events or snapshots to display.<br><br>';
            html += 'To enable event recording select either \'frame mode\' or ';
            html += '\'movie mode\'<br>in the camera configuration ';
            html += 'section and edit the motion mask.<br><br>';
            html += 'To enable snapshot recording select \'snapshot mode\' in the camera<br>';
            html += 'configuration section</div>';
            document.getElementById('display_html').innerHTML = html;

        } else {
            populate_date_dropdown();
        }
    }
    
    function callback_populate_cams_dbase(session_id) {
        if (cameras === {}) {
            var html  = '<div class="archive_msg" style="text-align: center"><br><br>';
            html += 'There are currently no cameras enabled.<br><br>';            
            html += '</div>';
            document.getElementById('display_html').innerHTML = html;

        } else {
            populate_camera_dropdown();            
            init_main_menus(session_id);
        }
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
        update_title_noclock();        
        mode_setto_event();

        document.getElementById('date_select').disabled =   false;
        document.getElementById('camera_select').disabled = false;
        document.getElementById('view_select').disabled =   false;
        document.getElementById('mode_select').disabled =   false;

    }

    function init_to_event_mode() {

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
	var date = document.getElementById('date_select').value;
	var camera = document.getElementById('camera_select').value;
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
	show_downloading_msg();
    }

    function show_downloading_msg() {

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
	drop_opts[0] = 'No filter';

	if (movie_enabled && snap_enabled) {
	    drop_opts[1] = 'Filter event movies';
	    drop_opts[2] = 'Filter snapshots';
	}

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
            if (snap_tblock((i - 1) * tline_block, i * tline_block)) 
                src = './images/tline_b1.png';
	    } 
        if (movie_show) { // show movie data
            level = 0;
            tmp = movie_tblock((i - 1) * tline_block, (i * tline_block) - 1);
            if (tmp > thold * 5)      level = 6;
            else if (tmp > thold * 4) level = 5;
            else if (tmp > thold * 3) level = 4;
            else if (tmp > thold * 2) level = 3;
            else if (tmp > thold)     level = 2;
            else if (tmp > 0)         level = 1;
            if (level !== 0) 
                src = './images/tline_r' + level + '.png';
	    }

	    document.getElementById('tslot_' + i).src = src;
	}
	tline_old_slt = -1; // ensure 'tline_old_slt' is marked invalid


	function snap_tblock(from_secs, to_secs) {
	    // return bool if timeblock contains snapshot
        
        var start;
        for (var i=0; i<movies['snaps'].length; i++) {
            start = movies['snaps'][i]['start'];
            if (start <= to_secs && start >= from_secs) {
                return true
            }
        }	    
	}


	function movie_tblock(from_secs, to_secs) {
	    // return seconds of timeblock filled by movie
	    var secs = 0;
        var start,end;
	    for (var i = 0; i < movies['movies'].length; i++) {
            start = movies['movies'][i]['start'];
            end = movies['movies'][i]['end'];
            if (start <= to_secs && end >= from_secs) {
                secs += Math.min(end, to_secs) - Math.max(start, from_secs);
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
    var start, end;
    
	if (movie_show) { // movie events
	    var hlight = top_10pc();
	    for (var i=0; i<movies['movies'].length; i++) {
            start = movies['movies'][i]['start'];
            end = movies['movies'][i]['end'];
            span_html = 'onclick="KM.arch_event_clicked(' + i + ')"';
            duration = end - start;
            if (KM.item_in_array(duration, hlight)) 
                span_html += ' style="color:#D90000"';
            //var src = 'images_dbase/' + date + '/' + KM.pad_out2(camera) + '/snap/' + KM.secs_hhmmss(movies[movie]['start']) + '.jpg';
            //html += '<span ' + span_html + ' onmouseover="showhint(\'<img width=256px src='+src+'>\')" onmouseout="hidehint()" onclick="hidehint()">';
            html += '<span ' + span_html + '>';
            html += '&nbsp;Movie event&nbsp;&nbsp;';
            html += KM.secs_hh_mm_ss(start);
            html += '&nbsp;&nbsp;-&nbsp;&nbsp;';
            html += KM.secs_hh_mm_ss(end);
            html += '&nbsp;&nbsp;duration&nbsp;&nbsp;';
            html += KM.pad_out4(duration);
            html += '&nbsp;&nbsp;secs&nbsp;&nbsp ... &nbsp;&nbsp;click to view<br>';
            html += '</span>';
	    }
	} else if (snap_show) { //snap events
        for (var i=0; i<movies['snaps'].length; i++) {
            start = movies['snaps'][i]['start'];
            span_html = 'onclick="KM.arch_event_clicked(' + i + ')"';
            //var src = 'images_dbase/' + date + '/' + KM.pad_out2(camera) + '/snap/' + KM.secs_hhmmss(movies[movie]['start']) + '.jpg';
            //html += '<span ' + span_html + ' onmouseover="showhint(\'<img width=256px src='+src+'>\')" onmouseout="hidehint()" onclick="hidehint()">';
            html += '<span ' + span_html + '>';
            html += '&nbsp;Snap event&nbsp;&nbsp;';
            html += KM.secs_hh_mm_ss(start);
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
        // calls 'populate_tline'
        //
        // expects:
        //
        // returns:
        //

        KM.session_id.current++;
        var session_id = KM.session_id.current;
        wipe_tline();
        display_secs = 0;
        show_downloading_msg();
        populate_cams_dbase(callback_populate_cams_dbase, document.getElementById('date_select').value, session_id);
			
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
        display_secs = 0;
        show_downloading_msg();
        mode_setto_event();
        populate_frame_dbase(populate_view_dropdown, document.getElementById('date_select').value,
                                       document.getElementById('camera_select').value, session_id);
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
        show_downloading_msg();

        var movie_enabled = cameras[document.getElementById('camera_select').value]['movie_flag'];
        var snap_enabled = cameras[document.getElementById('camera_select').value]['snap_flag'];

        var view = document.getElementById('view_select').value;

        // no filtering
        movie_show =  movie_enabled;
        snap_show =   snap_enabled;

        if (view == 1) {	    
            snap_show = false;

        } else if (view == 2) {
            movie_show =  false;
        }

        // 'init_to_event_mode' so as not to re-init the dropdown to default
        init_to_event_mode();
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
            remove_tline_marker();  // don't wipe tline
            init_to_event_mode();
            document.onkeydown=null; //stop memory leak

        } else {
            // display mode
            event_mode = false;
            play_mode = true;
            play_accel = 1; // play forward
            update_button_bar_play_mode();
            tline_clicked(display_secs);
            KM.videoPlayer.set_play_accel(play_accel);
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

	var feed = document.getElementById('camera_select').value;
	var title = cameras[feed]['title'];
	var time = KM.secs_hh_mm_ss(secs+KM.videoPlayer.get_time());
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

	var feed = document.getElementById('camera_select').value;
	var title = cameras[feed]['title'];
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
        if (i!==3) {
            document.getElementById('bar_button' + i).disabled = false;
        } else if (snap_show) {
            document.getElementById('bar_button3').disabled = false;
        }
	}

	// delete all highlights
	for (var i = 1; i < 6; i++) {
	    document.getElementById('bar_button' + i).style.color = KM.BLACK;
	};

	var grid = {"-4":['<<<<', '<', '>', '>>'],
                "-3":['<<<', '<', '>', '>>'],
                "-2":['<<', '<', '>', '>>'],
                "-1":['<<', '<', '>', '>>'],
                 "1":['<<', '<', '>', '>>'],
                 "2":['<<', '<', '>', '>>'],
	             "3":['<<', '<', '>', '>>>'],
	             "4":['<<', '<', '>', '>>>>']};

	var text = grid[play_accel];
	grid=null;

	document.getElementById('bar_button1').value = text[0];
	document.getElementById('bar_button2').value = text[1];
	document.getElementById('bar_button3').value = 'Click for frames';
	document.getElementById('bar_button4').value = text[2];
	document.getElementById('bar_button5').value = text[3];

	if (play_accel < -1 ) document.getElementById('bar_button1').style.color = KM.RED;
	if (play_accel === -1) document.getElementById('bar_button2').style.color = KM.RED;
	if (play_accel === 1) document.getElementById('bar_button4').style.color = KM.RED;
	if (play_accel > 1)  document.getElementById('bar_button5').style.color = KM.RED;
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
            document.getElementById('tslot_' + slot).src = '/images/tline_y6.png';
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
	// -4, <<<< highlighted
	// -3, <<<  highlighted
	// -2, <<   highlighted
	// -1, <    highlighted
	// 1, >    highlighted
	// 2, >>   highlighted
	// 3, >>>  highlighted
	// 4, >>>> highlighted

	if (play_mode) { // play mode
	    if (button == 1) { // fast play backward            
		    play_accel--;
            if (play_accel>=0) {
                play_accel = -2;
            }
		    play_accel = Math.max(-4, play_accel);
            
		} else if (button == 2) { // play backward
            play_accel = -1;
            
        } else if (button == 3) { // frame mode
            play_accel = 1;        
            
	    } else if (button == 4) { // play forward
            play_accel = 1;
            
	    } else if (button == 5) { // fast play forward
            play_accel++;
            if (play_accel<=0) {
                play_accel = 2;
            }
            play_accel = Math.min(4, play_accel);
        }  
        
        KM.videoPlayer.set_play_accel(play_accel);
        snap_player.set_accel(play_accel);
        
        if ((button == 3) && (snap_show)) {
            play_mode = false;  
            update_button_bar_frame_mode();
            snap_player.playpause();
        }
        else {
            update_button_bar_play_mode();
        }
		
        
	} else if (snap_show) { // frame mode

	    if (button <=2) { // -event
	        play_accel = -1; // play backward
            
	    } else if (button == 3) { // play mode            
            play_accel = 1; // play forward            
            
	    } else if (button >= 4) { // +frame
            play_accel = 1; // play forward
	    }        
        
        snap_player.set_accel(play_accel);
        if (button == 3) {
            play_mode = true;
            update_button_bar_play_mode();
            snap_player.playpause();
        } else {
            snap_player.play();
        }
	}
    };

    function tline_clicked(secs) {

        // A function called when a the time line is clicked
        //
        // expects:
        // 'movie_id' ... the movie index
        //
        // returns:
        //
        
        var id = 0;
        var old_secs;
        if (movie_show) {
            old_secs = movies['movies'][id]['start'];
            for (var i=0; i<movies['movies'].length; i++) {
                if (secs <= old_secs) {
                    id = i;
                    break;
                } else {
                    old_secs = movies['movies'][i]['start'];
                }        
            }
            play_movie(id);
        } else if (snap_show) {
            old_secs = movies['snaps'][id]['start'];
            for (var i=0; i<movies['snaps'].length; i++) {
                if (secs <= old_secs) {
                    id = i;
                    break;
                } else {
                    old_secs = movies['snaps'][i]['start'];
                }        
            }
            play_snap(id);
        }
    }
    
    function event_clicked(id) {
        if (movie_show) {
            play_movie(id);
        } else if (snap_show) {
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
        mode_setto_display();

        play_mode = true;
        update_button_bar_play_mode();

        if (movies['movies'][movie_id] !== undefined) {
            display_secs = movies['movies'][movie_id]['start'];
            update_tline_marker(display_secs);	  
            if (!document.getElementById('html5player')) {
                reset_display_html(); 
            }
            build_video_player(movie_id);        	    
        }
    }
    
    function play_snap(snap_id) {
        KM.session_id.current++;
        reset_display_html();
        mode_setto_display();
        update_button_bar_play_mode();
        document.getElementById('display_html').innerHTML = '<div id="movie" style="overflow:hidden;background-color:#000000;width:100%;height:100%"> </div>';
        snap_player.set_player({id:'movie', width: backdrop_width-5, height: backdrop_height-5, snap_id: snap_id});
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
            document.getElementById('display_html').innerHTML = '<div id="movie" style="overflow:hidden;background-color:#000000;width:100%;height:100%"> </div>';
        }
		
		KM.videoPlayer.set_movie_duration(end-start);
		KM.videoPlayer.set_cur_event_secs(start);
		KM.videoPlayer.set_next_movie(next_id);
		
		update_title_clock(start);

		
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
            if (!html5player) {
                KM.videoPlayer.set_video_player({id:'movie', name: name, width: backdrop_width-5, height: backdrop_height-5});
                html5player = document.getElementById('html5player');
                if (html5player) {                    
                    html5player.onloadeddata=html5VideoLoaded;				
                    html5player.onseeked=html5VideoScrolled;
                    html5player.ontimeupdate=html5VideoProgress;
                    html5player.onended=html5VideoFinished;
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
            snap.width = params.width;
            snap.height = params.height;
            snap.onload = function() {reload()};
            player.appendChild(snap);
            snap_id = params.snap_id;            
            playpause();
        }              
        
        function reload() {            
            if (KM.session_id.current === session_id) {
                KM.add_timeout_id(KM.ARCH_LOOP, setTimeout(function() {play()}, delay-get_delta()));
            }
        }
        
        function get_delta() {
            return Math.min(100, new Date().getTime()-time);
        }
        
        function play() {
            KM.kill_timeout_ids(KM.ARCH_LOOP);
            if (movies['snaps'][snap_id+direct]) {
                snap_id+=direct;
                snap.src = movies['snaps'][snap_id]['file'];
                time = new Date().getTime();
                display_secs = movies['snaps'][snap_id]['start'];
                update_title_clock(display_secs);
                update_tline_marker(display_secs);                
                //reload(session_id);
            }            
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
        
        function set_accel(val) {
            direct = Math.sign(val);
            fps = Math.abs(val);
            delay = 1000/fps;
        }
        
        return {
            set_player: set_player,            
            set_accel: set_accel,
            playpause: playpause,
            play: play
        }
    }();

    function reset_display_html() {
        document.getElementById('display_html').innerHTML = '';
    }
        
    function populate_cams_dbase(callback, date, session_id) {

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

	var _got = false;
	function request() {
	    // repeat 'xmlHttp' until data blob received from 'xmlHttp_arch.py'
	    // local 'xmlHttp' object to enable multiple instances, one for each
	    // function call.
	    var xmlHttp = KM.get_xmlHttp_obj();
	    xmlHttp.onreadystatechange = function () {
            if ((xmlHttp.readyState === 4) && (xmlHttp.status === 200)) {
                xmlHttp.onreadystatechange = null; // plug memory leak
                
                if (KM.session_id.current === session_id) {   
                    try {
                        cameras = JSON.parse(xmlHttp.responseText);                       
                        _got = true;                         
                    } catch(e) {console.log('Error while getting cameras!')}
                    callback(session_id);
                }
            }
	    };	    
	    xmlHttp.open('GET', '/ajax/archive?'+Math.random()+'&func=feeds&date='+date, true);
	    xmlHttp.send(null);
	}

	function retry() {
        KM.kill_timeout_ids(KM.ARCH_LOOP);
	    if (!_got) {
            request();
            KM.add_timeout_id(KM.ARCH_LOOP, setTimeout(function () {retry(); }, 5000));
	    }
	}
    retry();
    }
    
    function populate_dates_dbase(callback, session_id) {

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

	var _got = false;
	function request() {
	    // repeat 'xmlHttp' until data blob received from 'xmlHttp_arch.py'
	    // local 'xmlHttp' object to enable multiple instances, one for each
	    // function call.
	    var xmlHttp = KM.get_xmlHttp_obj();
	    xmlHttp.onreadystatechange = function () {
            if ((xmlHttp.readyState === 4) && (xmlHttp.status === 200)) {
                xmlHttp.onreadystatechange = null; // plug memory leak
                
                if (KM.session_id.current === session_id) {    
                    try {
                        dates = JSON.parse(xmlHttp.responseText);
                        _got = true;                       
                    } catch(e) {console.log('Error while getting dates!')}
                    callback(session_id);
                }
            }
	    };

	    xmlHttp.open('GET', '/ajax/archive?'+Math.random()+'&func=dates', true);
	    xmlHttp.send(null);
	}

	function retry() {
        KM.kill_timeout_ids(KM.ARCH_LOOP);
	    if (!_got) {
            request();
            KM.add_timeout_id(KM.ARCH_LOOP, setTimeout(function () {retry(); }, 5000));
	    }
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

	var _got = false;
	function request() {
	    // repeat 'xmlHttp' until data blob received from 'xmlHttp_arch.py'
	    // local 'xmlHttp' object to enable multiple instances, one for each
	    // function call.
	    var xmlHttp = KM.get_xmlHttp_obj();
	    xmlHttp.onreadystatechange = function () {
		if ((xmlHttp.readyState === 4) && (xmlHttp.status === 200)) {
		    xmlHttp.onreadystatechange = null; // plug memory leak
		   
		    if (KM.session_id.current === session_id) {
                try {
                    movies = JSON.parse(xmlHttp.responseText);
                    _got = true;
                } catch(e) {console.log('Error while getting movies!')}
                callback(session_id);
		    }
		}
	    };
	    xmlHttp.open('GET', '/ajax/archive?'+Math.random()+'&date=' + date + '&feed=' + camera + '&func=movies', true);
	    xmlHttp.send(null);
	}

	function retry() {
        KM.kill_timeout_ids(KM.ARCH_LOOP);
	    if (!_got) {
            request();
            KM.add_timeout_id(KM.ARCH_LOOP, setTimeout(function () {retry(); }, 5000));
	    }
	}
	retry();
    }
    
    return {
	init: init,
	change_date: change_date,
	change_camera: change_camera,
	change_view: change_view,
	change_mode: change_mode,
	bar_button_clicked: bar_button_clicked,	
	tline_clicked: tline_clicked,
    event_clicked: event_clicked,
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
KM.update_title_clock = KM.display_archive_.update_title_clock;


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
    var events;
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

    function show_logs() {
        // show the logs
        var log_html = '';
        for (var i=events.length-1; i >= 0; i--) {
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
            if ((xmlHttp.readyState === 4) && (xmlHttp.status === 200)) {
                xmlHttp.onreadystatechange = null; // plug memory leak                
                              
                if (KM.session_id.current === session_id) {
                    try {
                        events = JSON.parse(xmlHttp.responseText);
                        got_logs = true;	                        
                    } catch(e) {console.log('Error while getting logs!')}
                    show_logs();
                }
            }
        };
        xmlHttp.open('GET', '/ajax/logs?'+Math.random(), true);
        xmlHttp.send(null);
    }

    function retry() {
        KM.kill_timeout_ids(KM.LOGS);
        events = null;
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
        conf_error_daemon(KM.session_id.current);
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
            var xmlHttp = KM.get_xmlHttp_obj();
            xmlHttp.open('POST', '/ajax/config?write='+Math.random());
            xmlHttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            xmlHttp.send('jdata=' + jdata);    
            reset();
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
        var backdrop_width = KM.browser.main_display_width * 0.8;
        var backdrop_height = KM.browser.main_display_height - 60;
        var config_height = backdrop_height-30; 
        var button_width = backdrop_width / 4;


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
            '<input type="button" value="Motion Errors" id="error_button" onclick="KM.conf_select_errors();" ' +
            'style="width:' + button_width + 'px;"/>' +
            '<input type="button" value="Server Load" onclick="KM.conf_select_load();" ' +
            'style="width:' + button_width + 'px;"/>' +

        '</div>' +

        '<div id="config_html" style="height:'+config_height+'px;"></div>' +

        '</div>';
        
        
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
                      <input type="checkbox" id="logs_button_enabled" onclick="KM.conf_misc_highlight();" />Logs button enabled.<br>\
                      <input type="checkbox" id="archive_button_enabled" onclick="KM.conf_misc_highlight();" />Archive button enabled.<br>\
                    </div>\
                    <div class="config_tick_margin">\
                        <input type="checkbox" id="config_button_enabled" onclick="KM.conf_misc_highlight();" />Config button enabled.<br>\
                        <input type="checkbox" id="hide_button_bar" onclick="KM.conf_misc_highlight();" />Hide button bar.<br>\
                    </div>\
                </div>\
                <br /><hr style="margin:10px;clear:both" />\
                <div class="config_group_margin">\
                    <div style="height:50px;line-height:50px;background-color:#000000;color:#c1c1c1;margin:10px;padding-left:10px"><input type="radio" name="color_select" value="0" onchange="KM.background_button_clicked(0);KM.conf_misc_highlight();">Dark theme</div>\
                    <div style="height:50px;line-height:50px;background-color:#ffffff;color:#505050;margin:10px;padding-left:10px"><input type="radio" name="color_select" value="1" onchange="KM.background_button_clicked(1);KM.conf_misc_highlight();">Light theme</div>\
                </div>\
                <br /><hr style="margin:10px;clear:both" />\
                <div class="config_group_margin">\
                <input type="checkbox" id="save_display" onclick="KM.conf_misc_highlight();" />Save the current "Display Select" configuration as default.<br>\
                </div>\
                <br /><hr style="margin:10px;clear:both" />\
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
                <br /><hr style="margin:10px" class="clear_float"/> \
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
                </div></div>\
                <br /><hr style="margin:10px" class="clear_float"/>\
                <div class="config_tick_margin">\
                  <div class="config_text">Camera name: <input style="width:190px" type="text" id="feed_name" size="15" onchange="KM.conf_feed_highlight();" value="'+cur_camera+'"/></div>\
                </div>\
                </div>\
                <br /><hr style="margin:10px" class="clear_float"/>\
                <div class="config_text_margin">\
                  <input type="checkbox" id="feed_show_box" onclick="KM.conf_feed_highlight();" />Enable motion highlighting. (Draw box around detected motion)\
                </div>\
                <br /><hr style="margin:10px" class="clear_float"/>\
                <div class="config_text_margin">\
                  <input type="checkbox" id="feed_snap_enabled" onclick="KM.conf_feed_highlight();" />Enable snapshot mode. Record an image in time lapse mode with a pause between images.\
                </div>\
                <div class="config_text_margin" style="width:412px;">\
                  of : <input type="text" id="feed_snap_interval" size="4" onchange="KM.conf_feed_highlight();" />Seconds, (300 Seconds recommended)\
                </div>\
                <div class="config_text">Quality of snapshots: <input type="text" id="feed_quality" size="3" style="margin-top:1px;" onchange="KM.conf_feed_highlight();" /><span style="color:#818181;font-size: 17px;font-weight: bold;margin-left: 0px;">%</span></div>\
                <br /><hr style="margin:10px" class="clear_float"/>\
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
        conf_error_daemon(KM.session_id.current);

        var ids = ['mask_all' , 'mask_invert', 'mask_none',
        'feed_device', 'feed_url', 'feed_lgn_name', 'feed_width',
        'feed_input', 'feed_proxy', 'feed_lgn_pw', 'feed_height', 'feed_name',
        'feed_show_box', 'feed_snap_enabled', 'feed_snap_interval']

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

        var ids = ['mask_all' , 'mask_invert', 'mask_none',
        'feed_device', 'feed_url', 'feed_lgn_name', 'feed_width',
        'feed_input', 'feed_proxy', 'feed_lgn_pw', 'feed_height', 'feed_name',
        'feed_show_box', 'feed_snap_enabled', 'feed_snap_interval']

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
    Config display - motion error screen

    Displays the motion error code
    **************************************************************************** */

    function conf_select_errors() {

        // A function that is executed when the 'errors' button is clicked
        //
        // expects:
        //
        // returns:
        //
        //error_lines="";
        //KM.session_id.current++;
        //conf_error_daemon(KM.session_id.current);
        conf_error_html();
    };

    function conf_error_daemon(session_id) {

        // A closure that acts as a daemon updateing 'error_lines' with
        // motions output every 2 seconds. If errors are detected in this string
        // enable the 'Motion Errors' button and colour it red.
        //
        // expects:
        //
        // returns:
        //

        reload();

        function request() {
            // local 'xmlHttp' object to enable multiple instances, one for each
            // function call.
            var xmlHttp = KM.get_xmlHttp_obj();
            xmlHttp.onreadystatechange = function () {
                if ((xmlHttp.readyState === 4) && (xmlHttp.status === 200)) {
                    xmlHttp.onreadystatechange = null; // plug memory leak
                    var data = xmlHttp.responseText.trim();
                    
                    if (KM.session_id.current === session_id) {
                        error_lines = JSON.parse(data);
                        // scan the string looking for errors					
                        var error_flag = false;
                        for (var i = 0; i < error_lines.length; i++) {
                            if (error_lines[i].search(error_search_str) !== -1) {
                                error_flag = true;
                                break;
                            }
                        }
                        if (error_flag) {
                            conf_highlight_error_button(); // control the 'server error' button
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
            KM.kill_timeout_ids(KM.ERROR_DAEMON);
            error_lines = null;
            
            // check for current session id        
            if (KM.session_id.current === session_id) {   
                request();            
                KM.add_timeout_id(KM.ERROR_DAEMON, setTimeout(function () {reload(); }, 2000));
                //if (error_lines!="")
                //	KM.kill_timeout_ids(KM.ERROR_DAEMON);
                //KM.conf_error_html();
            }         
        }
    };

    function conf_error_html() {

        // A function that generates the error backdrop HTML. It sisplay the motion
        // error text on the config backdrop 'slab'. If kernel/driver lockup
        // detected displays advice. This option is only available if the error
        // daemon detects motions output text containing errors.
        //
        // expects:
        //
        // returns:
        //
        var error_str = '';
        for (var i = error_lines.length-1; i>=0; i--) {
            if (error_lines[i].search(error_search_str) !== -1) {
                error_str += '<span style="color:' + KM.RED + ';">' + error_lines[i] + '</span><br>';
            }
            else {
                error_str += error_lines[i]+'<br>';
            }
        }
        document.getElementById('config_html').innerHTML = error_str;        
    };

    function conf_highlight_error_button() {

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

    function conf_disable_error_button() {

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
            update_text();
            update_bars();
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
            document.getElementById('bar_fground1').style.width = (tmp * (MAX_PX / coef)) + 'px';

            // load average 5 min
            document.getElementById('bar_value2').innerHTML = dbase.l2;
            tmp = Math.min(dbase.l2, coef);
            document.getElementById('bar_fground2').style.width = (tmp * (MAX_PX / coef)) + 'px';
            if (tmp >= dbase.cpu) {
                document.getElementById('bar_fground2').style.backgroundColor = BAR_ALERT;
            } else {
                document.getElementById('bar_fground2').style.backgroundColor = BAR_OK;
            }

            // load average 15 min
            document.getElementById('bar_value3').innerHTML = dbase.l3;
            tmp = Math.min(dbase.l3, coef);
            document.getElementById('bar_fground3').style.width = (tmp * (MAX_PX / coef)) + 'px';
            if (tmp >= dbase.cpu) {
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
                    if ((xmlHttp.readyState === 4) && (xmlHttp.status === 200)) {
                        xmlHttp.onreadystatechange = null; // plug memory leak
                        
                        if (KM.session_id.current === session_id) {
                            dbase = JSON.parse(xmlHttp.responseText);
                            update_all();
                        } 
                    }
                };
                xmlHttp.open('GET', '/ajax/loads?'+Math.random(), true);
                xmlHttp.send(null);
            }

            function reload() {
                KM.kill_timeout_ids(KM.CONFIG_LOOP);
                dbase = null;                
                // check for current session id            
                if (KM.session_id.current === session_id) {                
                    request();
                    KM.add_timeout_id(KM.CONFIG_LOOP, setTimeout(function () {reload(); }, 2000));
                } 
            }
            reload(); // starts the enclosure process when 'rolling_update' is started
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
        conf_error_daemon(KM.session_id.current);
        conf_load_html();
    };

    return {
        init: init,
        conf_error_html: conf_error_html,
        conf_select_errors: conf_select_errors,
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
    var c = button.style.color;
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

    KM.add_timeout_id(KM.DISPLAY_LOOP, setTimeout(function () {init_interface(); }, 1));


    function init_interface() {

	// A function that performs final initialization
	//
	// expects :
	//
	// returns :
	//
        KM.kill_timeout_ids(KM.DISPLAY_LOOP);
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
        KM.update_title_clock(cur_event_secs);
    }
    
    function ktVideoFinished() {
        tm=0;
        KM.arch_event_clicked(next_movie);
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
            return false;
        }
    }
    
    function html5VideoProgress() {
        if (document.getElementById('html5player')) {
            var html5player=document.getElementById('html5player');
            var rate=1;
            if (current_play_accel<0)
                rate=0.5;
            else if (current_play_accel>1)
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
                KM.update_title_clock(cur_event_secs);
                html5player=null;
            }
            return false;
        }
    }
    
    ///////////////////EXPORT METHODS//////////////////////////////
    
    return {
        set_video_player: video_player,
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


KM.init1();










