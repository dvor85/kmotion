<?php

//"""
//Returns a coded string data blob containing load statistics
//"""




    // """
    // Gets server statistics from 'uname' and 'top' 
    
    // args    : 
    // excepts : 
    // return  : a coded string containing ...
    
    // The box name
    // $bx:<name>
    
    // Server info
    // $sr:<server info>
    
    // Server uptime
    // $up:<uptime>
    
    // The load averages for 1min, 5min, 15min
    // $l1:<number>
    // $l2:<number>
    // $l3:<number>
    
    // The CPU user, system and IO wait percent
    // $cu:<percent>
    // $cs:<percent>
    // $ci:<percent>
    
    // The memory total, free, buffers, cached
    // $mt:<total>
    // $mf:<free>
    // $mb:<buffers>
    // $mc:<cached>
    
    // The swap total, used
    // $st:<total>
    // $su:<used>
    
    // A length checksum
    // $ck<length - $ck0000 element>
    // """
ini_set('display_errors', '0');
header('Content-Type: text/plain; charset=utf-8'); 

$fp=popen('uname -srvo',"r");
$uname=fgets($fp); 
fclose($fp);
$u_split = explode(" ",$uname);
$coded_str = sprintf('$bx:%s',implode(" ",array_slice($u_split,0,2)));
$coded_str .= sprintf('$sr:%s',implode(" ",array_slice($u_split,2,-1)));


$fp=popen('top -b -n 1',"r");
$top =array();
while ((!feof($fp)) && (count($top)<5)) {
	$top[]=fgets($fp);
}
fclose($fp);

$top_0 = preg_split("/[\s,]+/",$top[0]);

$coded_str .= '$up:'; //  # uptime
for( $i=4;$i<count($top_0)-1;$i++) { 
    if (substr($top_0[$i+1],0,4) != 'user')
        $coded_str .= sprintf('%s ',$top_0[$i]);
    else
        break;
}
$coded_str .= sprintf('$l1:%s',$top_0[count($top_0)-4]); // # load average 1
$coded_str .= sprintf('$l2:%s',$top_0[count($top_0)-3]); //   # load average 
$coded_str .= sprintf('$l3:%s',$top_0[count($top_0)-2]); //   # load average 1

$top_2 = preg_split("/[\s,]+/",$top[2]);  

$coded_str .= sprintf('$cu:%s',substr($top_2[1],0,-3)); //  # CPU user
$coded_str .= sprintf('$cs:%s',substr($top_2[2],0,-3)); //  # CPU systemuser
$coded_str .= sprintf('$ci:%s',substr($top_2[5],0,-3)); //  # CPU IO wait

$top_3 = preg_split("/[\s,]+/",$top[3]); 

$coded_str .= sprintf('$mt:%s',substr($top_3[1],0,-1)); //  # memory total
$coded_str .= sprintf('$mf:%s',substr($top_3[5],0,-1));    // # memory free
$coded_str .= sprintf('$mb:%s',substr($top_3[7],0,-1));    // # memory buffers

$top_4 = preg_split("/[\s,]+/",$top[4]); 

$coded_str .= sprintf('$mc:%s',substr($top_4[7],0,-1)); // # memory cached
$coded_str .= sprintf('$st:%s',substr($top_4[1],0,-1));    // # swap total
$coded_str .= sprintf('$su:%s',substr($top_4[3],0,-1));    // # swap used

$coded_str .= sprintf('$ck:%04d',mb_strlen($coded_str,"UTF-8"));
print $coded_str;



?>




