<?php

// """
// Feed the GET'd value to the named pipe 'fifo_func'
// """



    // """
    // Feed the POST'd 'val' to the named pipe 'fifo_func'
    
    // args    : req
    // excepts : 
    // return  : none 
    // """
ini_set('display_errors', '0');
header('Content-Type: text/plain; charset=utf-8'); 
if (empty($_REQUEST["val"])) exit;
$www_dir = realpath($_SERVER["DOCUMENT_ROOT"]."/../");
$kmotion_dir = realpath("$www_dir/../");  
$func = trim($_REQUEST["val"]);   
    
$pipeout = fopen(sprintf('%s/fifo_func',$www_dir), "w");
fwrite($pipeout, $func);
fclose($pipeout);

?>






















