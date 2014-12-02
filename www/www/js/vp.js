var video_player = function(params) {

	function getFileExtension(filename)
	{
		var ext = /^.+\.([^.]+)$/.exec(filename);
		return ext == null ? "" : ext[1];
	}
	
	function ID () {
		return '_' + Math.random().toString(36).substr(2, 9);
	};
	
	function checkVideo(format) {
		switch (format) {
			case 'mp4':
				var vidTest = document.createElement("video");
				if (vidTest.canPlayType) {
					h264Test = vidTest.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"'); //mp4 format
					if (!h264Test) { //if it doesnot support .mp4 format
						return "flash"; //play flash
					} else {
						if (h264Test == "probably") {  //supports .mp4 format
							return "html5"; //play HTML5 video
						} else {
							return "flash"; //play flash video if it doesnot support any of them.
						}
					}
				}
			case 'ogv':
				var vidTest = document.createElement("video");
				if (vidTest.canPlayType) {
					oggTest = vidTest.canPlayType('video/ogg; codecs="theora, vorbis"'); //ogg format
					if (!oggTest) { //if it doesnot support
						return "none"; //play flash
					} else {
						if (oggTest == "probably") {  //supports 
							return "html5"; //play HTML5 video
						} else {
							return "none"; //play flash video if it doesnot support any of them.
						}
					}	
				}
			case 'webm':
				var vidTest = document.createElement("video");
				if (vidTest.canPlayType) {
					webmTest = vidTest.canPlayType('video/webm; codecs="vp8.0, vorbis"'); //webm format
					if (!webmTest) { //if it doesnot support
						return "none"; //play flash
					} else {
						if (webmTest == "probably") {  //supports 
							return "html5"; //play HTML5 video
						} else {
							return "none"; //play flash video if it doesnot support any of them.
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
		
	var canplay=checkVideo(getFileExtension(params.name));
	
	if (canplay=="html5") {
		document.getElementById(params.id).innerHTML = '<video id="html5player" width="'+params.width+'px" height="'+params.height+'px" autoplay controls ></video>';			
		
		var html5player = document.getElementById('html5player');
		html5player.innerHTML = "<p><a href=\""+document.URL+params.name+"\" target='_blank'>DOWNLOAD: "+params.name.split(/(\\|\/)/g).pop()+"</a></p>";		
		
		html5player.src=params.name;			
	}
	else if (canplay=="flash") {		
		var id=ID();		
		document.getElementById(params.id).innerHTML = '<div id="'+id+'"> </div>';		
		document.getElementById(id).innerHTML = "<p><a href=\""+document.URL+params.name+"\" target='_blank'>DOWNLOAD: "+params.name.split(/(\\|\/)/g).pop()+"</a></p>";
		
		var flashvars = { video_url: params.name, permalink_url: document.URL+params.name, bt: 5,	scaling: 'fill', hide_controlbar: 0, flv_stream: false, autoplay: true, js: 1};
		var fparams = {allowfullscreen: 'true', allowscriptaccess: 'always', quality:'best', bgcolor:'#000000', scale:'exactfit'};				
		var fattributes = {id: 'flashplayer', name: 'flashplayer'};
		swfobject.embedSWF('kt_player.swf', id, params.width, params.height, '9.124.0', 'expressInstall.swf', flashvars, fparams, fattributes);			
	}
	else {		
		document.getElementById(params.id).innerHTML = "<p><a href=\""+document.URL+params.name+"\" target='_blank'>DOWNLOAD: "+params.name.split(/(\\|\/)/g).pop()+"</a></p>";
	}
}		
