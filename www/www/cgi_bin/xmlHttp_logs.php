<?php
// """
// Returns a string data blob containing 'logs'
// """


    // """
    // Returns a string data blob containing the 'logs'
    
    // args    : 
    // excepts : 
    // return  : a coded string containing ...
    
    // $date#time#text$date ... $ck<length - $ck0000 element>
    // """
ini_set('display_errors', '0');  	
header('Content-Type: text/plain; charset=utf-8'); 	
$www_dir = realpath($_SERVER["DOCUMENT_ROOT"]."/../");
$kmotion_dir = realpath("$www_dir/../");    
$coded_str = '';
    
try {
    mutex_acquire($kmotion_dir);   
    $coded_str = trim(file_get_contents(sprintf('%s/www/logs',$kmotion_dir)));
}
catch (Exception $e) {
}

mutex_release($kmotion_dir);
    
$coded_str .= sprintf('$ck:%08d',mb_strlen($coded_str,"UTF-8"));
print $coded_str;

	
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
        $f_obj = fopen("$kmotion_dir/www/mutex/logs/".getmypid(), 'w');
		fclose($f_obj);      
            
        // # wait ... see if another lock has appeared, if so remove our lock
        // # and loop
        usleep(100000);
        if (check_lock($kmotion_dir) == 1)
            break;
        unlink("$kmotion_dir/www/mutex/logs/".getmypid());
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
    
	if (file_exists("$kmotion_dir/www/mutex/logs/".getmypid()))
		unlink("$kmotion_dir/www/mutex/logs/".getmypid());  
} 
        
function check_lock($kmotion_dir) {
    // """
    // Return the number of active locks on the www_rc mutex, filters out .svn
    
    // args    : kmotion_dir ... kmotions root dir
    // excepts : 
    // return  : num locks ... the number of active locks
    // """
    
    $files = scandir("$kmotion_dir/www/mutex/logs");
	unset($files[0],$files[1]);
    
    return count($files);
}  


?>








