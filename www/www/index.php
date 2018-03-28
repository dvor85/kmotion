<!doctype html>

<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<link href="css/base.css?ver=7.0.10" rel="stylesheet" type="text/css" media="screen"/> 
<meta name="keywords" content="" />
<meta name="description" content="" />
<meta http-equiv="content-type" content="text/html; charset=utf-8" />
<meta http-equiv="cache-control" content="no-cache">
<meta name="robots" content="none">
<title></title>
<script type="text/javascript" src="js/swfobject.js"></script>
<script type="text/javascript" >

/* *****************************************************************************
Preload section. The images are held in an array so the browser will download 
them in the background ready for use and also not drop them from its cache.
***************************************************************************** */

function kmotion_preload_images() {

	// preload the images and store in global array
	preload_array = [];
	for (var i = 1; i < 55; i++) {
		preload_array[i] = new Image();
	}
	
	for (var i = 1; i < 13; i++) {
		preload_array[i].src = 'images/r' + i + '.png';
		preload_array[i + 12].src = 'images/b' + i + '.png';
		preload_array[i + 24].src = 'images/g' + i + '.png';
	}
	
	preload_array[37].src = 'images/bcam.png';	
	preload_array[38].src = 'images/gcam.png';
	preload_array[39].src = 'images/bcam_alt.png';	
	preload_array[40].src = 'images/gcam_alt.png';
	preload_array[41].src = 'images/temp3.png';
	preload_array[42].src = 'images/temp4.png';
	preload_array[43].src = 'images/config_divider.png';
	preload_array[45].src = 'images/divider.png';
	preload_array[46].src = 'images/divider_xl.png';
	preload_array[48].src = 'images/ncam.png';
	preload_array[49].src = 'images/blue.png';
	preload_array[50].src = 'images/green.png';
	preload_array[51].src = 'images/yellow.png';
	preload_array[52].src = 'images/red.png';
	preload_array[53].src = 'images/mask.png';
	preload_array[54].src = 'images/mask_trans.png';
};

function showhint(InputText) {
	//return function (e) {
		var e = event;
		if(document.getElementById("hint"))
		{
			var hint=document.getElementById("hint");
			hint.innerHTML =  InputText;
			var l=e.x+document.body.scrollLeft+5;
			var t=e.y+document.body.scrollTop+5;
			if (l+256>window.innerWidth) {
				l=window.innerWidth-256;
			}
			if (t+192>window.innerHeight) {
				t=window.innerHeight-192;
			}
			hint.style.display = "block";
			hint.style.left = l+"px";
			hint.style.top = t+"px";
			hint=null;
		}
	//}
}
		
function hidehint() {
	//return function(e) {
		if(document.getElementById("hint"))
		{
			document.getElementById("hint").style.display = "none";
		}
	//}
}



</script>

</head>
<body onload="kmotion_preload_images();">
<div id="hint"></div>

<!-- ***************************************************************************
'main_display' section.
*****************************************************************************-->

	<div id="main_display">
		<div id="info_mid_line">
			<div id="info_text" >
				<script type="text/javascript" >
					document.write('kmotion loading ...');
				</script>
			      <noscript>Please Enable JavaScript ...</noscript> 
			</div>
		</div>		
	</div>
	

<!-- ***************************************************************************
'button_bar' section.
*****************************************************************************-->
	<div id="toggle_button_bar" onClick="KM.toggle_button_bar();"></div>
	<div id="button_bar">
		<!-- div instead of span because of IE glitch -->
		<div id="title">kmotion</div>
		<span id="version_num"></span>
		<span class="divider"><img src="images/divider.png" alt="" /> </span>
	
		<span class="header">Display select</span>

		<div class="button_line">
			<img class="display_button" id="d1" src="images/g1.png" alt="" onClick="KM.display_button_clicked(1);" />
			<img class="display_button" id="d2" src="images/g2.png" alt="" onClick="KM.display_button_clicked(2);" />
			<img class="display_button" id="d3" src="images/g3.png" alt="" onClick="KM.display_button_clicked(3);" />
			<img class="display_button" id="d4" src="images/g4.png" alt="" onClick="KM.display_button_clicked(4);" />
		</div>

		<div class="button_line">
			<img class="display_button" id="d5" src="images/g5.png" alt="" onClick="KM.display_button_clicked(5);" />
			<img class="display_button" id="d6" src="images/g6.png" alt="" onClick="KM.display_button_clicked(6);" />
			<img class="display_button" id="d7" src="images/g7.png" alt="" onClick="KM.display_button_clicked(7);" />
			<img class="display_button" id="d8" src="images/g8.png" alt="" onClick="KM.display_button_clicked(8);" />
		</div>
	
		<div class="button_line">
			<img class="display_button" id="d9" src="images/g9.png" alt="" onClick="KM.display_button_clicked(9);" />
			<img class="display_button" id="d10" src="images/g10.png" alt="" onClick="KM.display_button_clicked(10);" />
			<img class="display_button" id="d11" src="images/g11.png" alt="" onClick="KM.display_button_clicked(11);" />
			<img class="display_button" id="d12" src="images/g12.png" alt="" onClick="KM.display_button_clicked(12);" />
		</div>

		<span class="divider"><img src="images/divider.png" alt="" /> </span>
		<span id="camera_func_header" class="header">Camera Select</span>
		<div id="camera_sec"></div>
		<span class="divider"><img src="images/divider.png" alt="" /> </span>
		
		
		<span class="header">Key Functions</span>
		
		<div class="button_line">
			<div class="function_button" onClick="KM.function_button_clicked(1);"><span id="ft1">Онлайн</span></div>
			<div class="function_button" onClick="KM.function_button_clicked(2);"><span id="ft2">Архив</span></div>
		</div>
		
		<span class="divider"><img src="images/divider.png" alt="" /> </span>
		<span class="header" id="misc_function_display">Misc Functions</span>
		
		<div class="button_line">
			<div class="function_button" onClick="KM.function_button_clicked(3);"><span id="ft3">Logs</span></div>
			<div class="function_button" onClick="KM.function_button_clicked(4);"><span id="ft4">Config</span></div>
		</div>
		


	</div>
	<!--<script type="text/javascript" src="js/index.js"></script>-->
<?php
$debug = false;
$user=!empty($_SERVER["PHP_AUTH_USER"])?$_SERVER["PHP_AUTH_USER"]:"";
$version='7.0.9';
$script=($debug and $user=='admin')?'js/index.js?ver="'.$version.'"':'js/index-min.js?ver="'.$version.'"';
echo '<script type="text/javascript" src="'.$script.'"></script>';

?>

	
</body>
</html>
