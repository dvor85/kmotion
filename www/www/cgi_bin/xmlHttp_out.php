<?php
// """
// Returns a coded string data blob containing the error file
// """



    // """
    // Gets the motions daemons error output
    
    // args    : 
    // excepts : 
    // return  : a coded string containing ...
    
    
    // The motion daemons error output
    // <string>
    
    // A length checksum
    // $ck<length - $ck0000 element>
    // """
ini_set('display_errors', '0');	
header('Content-Type: text/plain; charset=utf-8'); 
$www_dir = realpath($_SERVER["DOCUMENT_ROOT"]."/../");
$kmotion_dir = realpath("$www_dir/../");
  
$coded_str = '';
$motion_out=sprintf('%s/motion_out', $www_dir);
if (is_file($motion_out)) {
	$f_obj = fopen($motion_out,"r");
	if (filesize($motion_out)>100000)
		fseek($f_obj,filesize($motion_out)-100000);
	
	while (!feof($f_obj)) {
		$line=fgets($f_obj);
		$coded_str .= $line;
	}
	fclose($f_obj);
}        
// # possibly large string so 8 digit checksum
$coded_str .= sprintf('$ck:%08d', mb_strlen($coded_str,"UTF-8"));
print $coded_str;



?>


