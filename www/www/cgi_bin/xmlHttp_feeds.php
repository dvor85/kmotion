<?php
ini_set('display_errors', '0');
header('Content-Type: text/plain; charset=utf-8'); 
$www_dir = realpath($_SERVER["DOCUMENT_ROOT"]."/../");
$kmotion_dir = realpath("$www_dir/../");

if (empty($_REQUEST["cams"]) || empty($_REQUEST["rdd"])) exit;
$scams = strip_tags(stripslashes(trim($_REQUEST["cams"])));
$cams = array_unique(explode(",",$scams));
$ramdisk_dir = trim($_REQUEST["rdd"]);

$user=!empty($_SERVER["PHP_AUTH_USER"])?$_SERVER["PHP_AUTH_USER"]:"";

$www_rc="$www_dir/www_rc_$user";
if (!file_exists($www_rc)) {
    $www_rc="$www_dir/www_rc";
}

$dblob = '#';
$events = scandir("$ramdisk_dir/events");

foreach($cams as $feed)  {
	//$tmp = sprintf("%s/%02d/last/last.jpg",$ramdisk_dir, $feed);	
	$tmp = trim(file_get_contents(sprintf("%s/%02d/www/last",$ramdisk_dir, $feed)));
	if ($tmp=='')
	    continue;
	//if ( in_array($feed,$events)) {
		$tmp.= "?".time();		
	//} 
	
	$pattern=array("/^.*(\/images_dbase\/.*$)/i", "/^.*(\/kmotion_ramdisk\/.*$)/i", "/^.*(\/virtual_ramdisk\/.*$)/i");
	$tmp = preg_replace($pattern,"$1",$tmp);     
	$dblob .= "$feed=$tmp#";     
}   
    
$dblob .= trim(file_get_contents("$www_dir/servo_state"))."#";
               
foreach ($events as $event) {
	if (($event==".") || ($event==".."))
		continue;	
	$dblob .= '$'."$event";
}
print $dblob;

?>


















