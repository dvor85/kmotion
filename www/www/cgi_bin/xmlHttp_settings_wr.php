<?php

// """ 
// Feed the POST'd value to the named pipe 'fifo_settings_wr'
// """

    // """
    // Feed the POST'd 'dblob' to the named pipe 'fifo_settings_wr'
    
    // args    : req
    // excepts : 
    // return  : none 
    // """
ini_set('display_errors', '0');
header('Content-Type: text/plain; charset=utf-8');      
if (empty($_REQUEST["dblob"])) exit;
$www_dir = realpath($_SERVER["DOCUMENT_ROOT"]."/../");
$kmotion_dir = realpath("$www_dir/../"); 
$user=!empty($_SERVER["PHP_AUTH_USER"])?$_SERVER["PHP_AUTH_USER"]:"";

if (!empty($_REQUEST["dblob"])) {    
	$dblob = trim($_REQUEST["dblob"]);
	$dblob = substr($dblob,0,-13);
	$dblob = sprintf('$usr:%s',$user).$dblob;
	$dblob .= sprintf('$chk:%08d', mb_strlen($dblob,"UTF-8"));
	
	//var_dump($dblob);
	$pipeout = fopen(sprintf('%s/fifo_settings_wr',$www_dir), "w");
	fwrite($pipeout, $dblob);
	fclose($pipeout);
}

?>




