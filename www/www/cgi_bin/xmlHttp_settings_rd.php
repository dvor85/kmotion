<?php

ini_set('display_errors', '0'); 
header('Content-Type: text/plain; charset=utf-8');  


function expand_chars($text) {
    // """
    // Converts troublesome characters to <...>

    // args    : text ... the text to be expand_charsd
    // excepts : 
    // return  : text ... the expand_charsd text
    // """
    
    $text = str_replace('&', '<amp>',$text);
    $text = str_replace('?', '<que>',$text);
    $text = str_replace(":", "<col>",$text);
	
    return $text;
}

function mutex_acquire($kmotion_dir) {
    // """ 
    // Aquire the 'www_rc' mutex lock, very carefully
    
    // args    : kmotion_dir ... the 'root' dir of kmotion
    // excepts : 
    // return  : none
    // """
    
	while (true) {
        // # wait for any other locks to go
        while (true) {
            if (check_lock($kmotion_dir) == 0)
                break;
			usleep(10000);
		}	
                 
        // # add our lock
        $f_obj = fopen("$kmotion_dir/www/mutex/www_rc/".getmypid(), 'w');
		fclose($f_obj);      
            
        // # wait ... see if another lock has appeared, if so remove our lock
        // # and loop
        usleep(100000);
        if (check_lock($kmotion_dir) == 1)
            break;
        unlink("$kmotion_dir/www/mutex/www_rc/".getmypid());
        // # random to avoid mexican stand-offs
        usleep(rand(1, 40) * 1000);
	}
}            
        
function mutex_release($kmotion_dir) {
    // """ 
    // Release the 'www_rc' mutex lock
    
    // args    : kmotion_dir ... the 'root' dir of kmotion
    // excepts : 
    // return  : none
    // """
    
	if (file_exists("$kmotion_dir/www/mutex/www_rc/".getmypid()))
		unlink("$kmotion_dir/www/mutex/www_rc/".getmypid());  
} 
        
function check_lock($kmotion_dir) {
    // """
    // Return the number of active locks on the www_rc mutex, filters out .svn
    
    // args    : kmotion_dir ... kmotions root dir
    // excepts : 
    // return  : num locks ... the number of active locks
    // """
    
    $files = scandir("$kmotion_dir/www/mutex/www_rc");
	unset($files[0],$files[1]);
    
    return count($files);
}  

// """
    // Parses www_rc and returns a coded string in a dictionary like format, this
    // coded string contains settings for the browser interface.
    
    // ine ... interleave enabled
    // fse ... full screen enabled
    // lbe ... low bandwidth enabled
    // lce ... low CPU enabled
    // skf ... skip archive frames
    // are ... archive button enabled
    // lge ... logs button enabled
    // coe ... config button enabled
    // fue ... func button enabled
    // spa ... msg button enabled
    // abe ... about button enabled
    // loe ... logout button enabled
    // fne ... function buttons enabled (for executable scripts)
     
    // sec ... secure config
    // coh ... config hash code
    
    // fma ... feed mask
    
    // fen ... feed enabled
    // fde ... feed device
    // fin ... feed input
    // ful ... feed url
    // fpr ... feed proxy
    // fln ... feed loggin name
    // fwd ... feed width
    // fhe ... feed height
    // fna ... feed name
    // fbo ... feed show box
    // ffp ... feed fps
    // fpe ... feed snap enabled
    // fsn ... feed snap interval
    // ffe ... feed smovie enabled
    // fme ... feed movie enabled
    // fup ... feed updates
    
    // psx ... PTZ step x
    // psy ... PTZ step y
    // ptt ... PTZ track type
    // pte ... PTZ enabled
    // ptc ... PTZ calib first
    // pts ... PTZ servo settle
    // ppe ... PTZ park enabled
    // ppd ... PTZ park delay
    // ppx ... PTZ park x
    // ppy ... PTZ park y
    // p1x ... PTZ preset 1 x
    // p1y ... PTZ preset 1 y
    // p2x ... PTZ preset 2 x
    // p2y ... PTZ preset 2 y
    // p3x ... PTZ preset 3 x
    // p3y ... PTZ preset 3 y
    // p4x ... PTZ preset 4 x
    // p4y ... PTZ preset 4 y
    
    // dif ... display feeds
    // col ... color select
    // dis ... display select
    // ver ... version
    // vel ... version latest
    
    // chk ... length check
    
    // args    : 
    // excepts : 
    // return  : the coded string 
    // """
    
$www_dir = realpath($_SERVER["DOCUMENT_ROOT"]."/../");
$kmotion_dir = realpath("$www_dir/../");

$user=!empty($_SERVER["PHP_AUTH_USER"])?$_SERVER["PHP_AUTH_USER"]:"";
$www_rc="$www_dir/www_rc_$user";
if (!file_exists($www_rc)) {
    $www_rc="$www_dir/www_rc";
}

if (empty($_REQUEST["mfd"])) exit;

$max_feed=(int)($_REQUEST["mfd"]);

try {
	mutex_acquire($kmotion_dir);
	$parser = parse_ini_file($www_rc, true);
} catch (Exception $e) {

} 
mutex_release($kmotion_dir);


        
    
$coded_str = '';

$coded_str .= '$ine:'.(int)($parser['misc']['misc1_interleave']);
$coded_str .= '$fse:'.(int)($parser['misc']['misc1_full_screen']);
$coded_str .= '$lbe:'.(int)($parser['misc']['misc1_low_bandwidth']);    
$coded_str .= '$lce:'.(int)($parser['misc']['misc1_low_cpu']); 
$coded_str .= '$skf:'.(int)($parser['misc']['misc1_skip_frames']);
$coded_str .= '$are:'.(int)($parser['misc']['misc2_archive_button_enabled']);
$coded_str .= '$lge:'.(int)($parser['misc']['misc2_logs_button_enabled']);    
$coded_str .= '$coe:'.(int)($parser['misc']['misc2_config_button_enabled']);
$coded_str .= '$fue:'.(int)($parser['misc']['misc2_func_button_enabled']);
$coded_str .= '$spa:'.(int)($parser['misc']['misc2_msg_button_enabled']);
$coded_str .= '$abe:'.(int)($parser['misc']['misc2_about_button_enabled']);
$coded_str .= '$loe:'.(int)($parser['misc']['misc2_logout_button_enabled']);
$coded_str .= '$hbb:'.(int)($parser['misc']['hide_button_bar']);

$coded_str .= '$sec:'.(int)($parser['misc']['misc3_secure']);
$coded_str .= '$coh:'.($parser['misc']['misc3_config_hash']);    
   
for ($i=1;$i<$max_feed;$i++){
	$motion_feed="motion_feed".sprintf("%02d",$i);
	$func_enabled="func_f".sprintf("%02d_enabled",$i);
	
	$coded_str .= '$fma'.$i.':'.$parser[$motion_feed]['feed_mask']; 
    $coded_str .= '$fen'.$i.':'.(int)($parser[$motion_feed]['feed_enabled']); 
	$coded_str .= '$fpl'.$i.':'.(int)($parser[$motion_feed]['feed_pal']); 
    $coded_str .= '$fde'.$i.':'.($parser[$motion_feed]['feed_device']);
	$coded_str .= '$fin'.$i.':'.($parser[$motion_feed]['feed_input']);
    $coded_str .= '$ful'.$i.':'.expand_chars($parser[$motion_feed]['feed_url']); 
	$coded_str .= '$fpr'.$i.':'.expand_chars($parser[$motion_feed]['feed_proxy']); 	
	$coded_str .= '$fln'.$i.':'.expand_chars($parser[$motion_feed]['feed_lgn_name']);
        
        
    // # don't want to send out real password
	$coded_str .= '$flp'.$i.':'.sprintf("%'*".strlen($parser[$motion_feed]['feed_lgn_pw'])."s","");
	
	$coded_str .= '$fwd'.$i.':'.($parser[$motion_feed]['feed_width']);
    $coded_str .= '$fhe'.$i.':'.($parser[$motion_feed]['feed_height']);
    $coded_str .= '$fna'.$i.':'.expand_chars($parser[$motion_feed]['feed_name']);    
    $coded_str .= '$fbo'.$i.':'.(int)($parser[$motion_feed]['feed_show_box']);    
    $coded_str .= '$ffp'.$i.':'.($parser[$motion_feed]['feed_fps']);    
    $coded_str .= '$fpe'.$i.':'.(int)($parser[$motion_feed]['feed_snap_enabled']);    
    $coded_str .= '$fsn'.$i.':'.($parser[$motion_feed]['feed_snap_interval']);     
	$coded_str .= '$ffe'.$i.':'.(int)($parser[$motion_feed]['feed_smovie_enabled']); 
    $coded_str .= '$fme'.$i.':'.(int)($parser[$motion_feed]['feed_movie_enabled']);    
        
    $coded_str .= '$psx'.$i.':'.($parser[$motion_feed]['ptz_step_x']);        
    $coded_str .= '$psy'.$i.':'.($parser[$motion_feed]['ptz_step_y']);     
    $coded_str .= '$ptt'.$i.':'.($parser[$motion_feed]['ptz_track_type']);    
    $coded_str .= '$pte'.$i.':'.(int)($parser[$motion_feed]['ptz_enabled']);     
    $coded_str .= '$ptc'.$i.':'.(int)($parser[$motion_feed]['ptz_calib_first']);    
    $coded_str .= '$pts'.$i.':'.($parser[$motion_feed]['ptz_servo_settle']);     
    $coded_str .= '$ppe'.$i.':'.(int)($parser[$motion_feed]['ptz_park_enabled']);   
    $coded_str .= '$ppd'.$i.':'.($parser[$motion_feed]['ptz_park_delay']);    
    $coded_str .= '$ppx'.$i.':'.($parser[$motion_feed]['ptz_park_x']);   
    $coded_str .= '$ppy'.$i.':'.($parser[$motion_feed]['ptz_park_y']);    
    $coded_str .= '$p1x'.$i.':'.($parser[$motion_feed]['ptz_preset1_x']);      
    $coded_str .= '$p1y'.$i.':'.($parser[$motion_feed]['ptz_preset1_y']);     
    $coded_str .= '$p2x'.$i.':'.($parser[$motion_feed]['ptz_preset2_x']);    
    $coded_str .= '$p2y'.$i.':'.($parser[$motion_feed]['ptz_preset2_y']);    
    $coded_str .= '$p3x'.$i.':'.($parser[$motion_feed]['ptz_preset3_x']);   
    $coded_str .= '$p3y'.$i.':'.($parser[$motion_feed]['ptz_preset3_y']);    
    $coded_str .= '$p4x'.$i.':'.($parser[$motion_feed]['ptz_preset4_x']);        
    $coded_str .= '$p4y'.$i.':'.($parser[$motion_feed]['ptz_preset4_y']);
    
    $coded_str .= '$fne'.$i.':'.(int)($parser["system"][$func_enabled]);     
        
}
    
for ($i=1;$i<9;$i++) {
	$coded_str .= '$sex'.$i.':'.($parser["schedule$i"]['schedule_except']);
	
	for ($j=1;$j<=7;$j++) {
	    $coded_str .= '$'."st$j".$i.':'.($parser["schedule$i"]["tline$j"]);
    }     
}
        
for ($i=1;$i<5;$i++) {
    for ($j=1;$j<=7;$j++) {
		$coded_str .= '$'."ed$j".$i.':'.($parser["schedule_except$i"]["tline".$j."_dates"]);
		$coded_str .= '$'."et$j".$i.':'.($parser["schedule_except$i"]["tline$j"]);
	}
}  
  
for ($i=1;$i<13;$i++) {
	$misc4_display_feeds = "misc4_display_feeds_".sprintf("%02d",$i);
	$coded_str .= '$dif'.$i.':'.($parser["misc"][$misc4_display_feeds]);
} 

$coded_str .= '$col:'.($parser['misc']['misc4_color_select']);
$coded_str .= '$dis:'.($parser['misc']['misc4_display_select']);	
#$coded_str .= '$ver:'.($parser['system']['version']);
#$coded_str .= '$vel:'.($parser['system']['version_latest']);
$coded_str .= '$msg:'.expand_chars($parser['system']['msg']);

$coded_str .= sprintf('$chk:%08d',mb_strlen($coded_str,"UTF-8"));    
    
print trim($coded_str);

       

?>


