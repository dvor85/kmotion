<?php

// """
// Returns a coded string containing 'images_dbase' indexes for the archive 
// function. The returned data is dependent on the xmlhttp request.

// 'date' = date YYYYMMDD
// 'cam'  = camera 1 .. 16
// 'func' = 'avail', 'index'

// if 'func' == 'avail' ie avaliable dates, coded string consists of:
// $<YYYYMMDD date >#<?? feed num>#A#B#C#<title># ...

// if 'func' = 'index' ie the indexes, coded string consists of consists of:

// $<HHMMSS movie start time>#<?? fps>#<HHMMSS movie end time> ... @
// $<HHMMSS smovie start>#<?? start items>#<?? fps>#<HHMMSS smovie end>#<?? end items>... @
// $<HHMMSS snap init time>#<?? interval secs> ... 

// args    : req ... from python-mod
// excepts : 
// returns : coded string
// """

ini_set('display_errors', '0');  
header('Content-Type: text/plain; charset=utf-8'); 

$www_dir = realpath($_SERVER["DOCUMENT_ROOT"]."/../");
$kmotion_dir = realpath("$www_dir/../");

$user=!empty($_SERVER["PHP_AUTH_USER"])?$_SERVER["PHP_AUTH_USER"]:"";
$www_rc="$www_dir/www_rc_$user";
if (!file_exists($www_rc)) {
    $www_rc="$www_dir/www_rc";
}

try {
    mutex_acquire($kmotion_dir);
    $kmotion_rc=sprintf('%s/kmotion_rc', $kmotion_dir);
    $parser = parse_ini_file($kmotion_rc, true);
} catch (Exception $e) {
}
mutex_release($kmotion_dir);
$images_dbase_dir = $parser['dirs']['images_dbase_dir'];

$scams = strip_tags(stripslashes(trim($_REQUEST["cams"])));
$date_ = strip_tags(stripslashes(trim($_REQUEST["date"])));
$feed = strip_tags(stripslashes(trim($_REQUEST["cam"])));
$func = strip_tags(stripslashes(trim($_REQUEST["func"])));   

$coded_str = ''; // in case of corrupted value, return zip


if ($func == 'avail')    // date_s avaliable
    $coded_str = date_feed_avail_data($images_dbase_dir, $scams);
elseif($func == 'index')  { //movies and snapshots
	list ($fps_time, $fps) = fps_journal_data($images_dbase_dir, $date_, $feed);
    $coded_str = movie_journal_data($images_dbase_dir, $date_, $feed, $fps_time, $fps) . '@';
    $coded_str .= smovie_journal_data($images_dbase_dir, $date_, $feed, $fps_time, $fps) . '@'; 
    $coded_str .= snap_journal_data($images_dbase_dir, $date_, $feed);
} 
    
$coded_str .= sprintf('$chk:%08d', mb_strlen($coded_str,"UTF-8"));
print $coded_str;
    

function date_feed_avail_data($images_dbase_dir, $scams) {
    // """
    // Returns a coded string containing the avaliable archive dates and feeds
    
    // coded string consists of:
    
    // $<YYYYMMDD date >#<?? feed num>#A#B#C#<title>#<?? feed num>#A#B#C#<title> ...
    
    // A = movie dir exists,  1 yes; 0 no
    // B = smovie dir exists, 1 yes; 0 no
    // C = snap dir exists,   1 yes; 0 no
    
    // args    : images_dbase_dir ... the images dbase dir ;)
    // excepts : 
    // returns : coded string
    // """
	
    $coded_str = '';
    $cams=array_unique(explode(",",$scams));
	$dates=scandir($images_dbase_dir);
	unset($dates[0],$dates[1]);
       
    foreach($dates as $date){
        $tmp_str = '';        
        $feeds = scandir(sprintf('%s/%s' ,$images_dbase_dir, $date));
        
        try {
            foreach($feeds as $feed){
				if (in_array((int)$feed,$cams)) {
            	    $movie_flag =  is_dir(sprintf('%s/%s/%s/movie',$images_dbase_dir, $date, $feed)); 
					$smovie_flag =  is_dir(sprintf('%s/%s/%s/smovie',$images_dbase_dir, $date, $feed)); 
					$snap_flag =  is_dir(sprintf('%s/%s/%s/snap',$images_dbase_dir, $date, $feed)); 
            	    if ($movie_flag || $smovie_flag || $snap_flag) {
						$tmp_str .= sprintf('%s#',$feed);                    
						$tmp_str.=($movie_flag)?'1#':'0#';
						$tmp_str.=($smovie_flag)?'1#':'0#';
						$tmp_str.=($snap_flag)?'1#':'0#';
						$tmp_str.=sprintf('%s#',trim(file_get_contents(sprintf('%s/%s/%s/title', $images_dbase_dir, $date, $feed))));
					}
				}
			}
        } catch (Exceptinon $e) {       
        // # if 'title' corrupted, skip the date
			continue; 
        }    
        if ($tmp_str != '') $coded_str .= sprintf('$%s#%s',$date, $tmp_str);
    }    
    return $coded_str;
}                
    
function movie_journal_data($images_dbase_dir, $date_, $feed, $fps_time, $fps) {
    // """
    // Returns a coded string containing the start and end times for all movies
    // for the defined 'date_' and 'feed'. The movies are named by start time ie
    // 185937 for 185937.swf, with an associated end time
    
    // coded string consists of:
    
    // $<HHMMSS start time>#<?? fps>#<HHMMSS end time> ... 
    
    // args    : images_dbase_dir ... the images dbase dir 
              // date_ ...            the required date_
              // feed ...             the required feed
              // fps_time ...         list of fps start times
              // fps ...              list of fps
    // excepts : 
    // returns : coded string 
    // """
    
    $coded_str = '';
    $journal_file = sprintf('%s/%s/%02d/movie_journal', $images_dbase_dir, $date_, $feed); 
	        
    if (is_file($journal_file)) {
        $journal = explode("$",file_get_contents($journal_file));  
		
        $movies=scandir(sprintf('%s/%s/%02d/movie',$images_dbase_dir, $date_, $feed));
	unset($movies[0],$movies[1]);
	//var_dump($journal);
	//var_dump($movies);exit;				
        foreach ($movies as $filemovie) {
			$movie_ext=strrchr($filemovie,'.');
            $movie=substr($filemovie,0,strrpos($filemovie,'.'));
            //if (strlen($movie)>8) continue;
            if (!preg_match("/^\d{6}$/i",$movie)) continue;
			
			
			$jor=trim(array_shift($journal));
			//var_dump($movie." - ".$jor." : ".(int)strcmp($movie,$jor)); 
			//echo "$jor";
                while (($movie >= $jor)&&(count($journal)>0)) {
            	    
		    $jor=trim(array_shift($journal));
		    //var_dump($movie." - ".$jor );
		}
	    if ($jor=="") continue;
            // # -2 seconds off movie end time to account for motion delay in executing 'on_movie_end'
            //var_dump($movie, " - ", $jor);continue;
            //var_dump(substr($jor,0,2)." ".substr($jor,2,4)." ".substr($jor,4,2));
            //$movie_end_tm = mktime(substr($jor,0,2), substr($jor,2,2), substr($jor,4,2),0,0,0);
            //$movie_end_tm -= 2;
            //$movie_end = date('His',$movie_end_tm);
            $movie_end=$jor;
            //$movie_tm = mktime(substr($movie,0,2), substr($movie,2,2), substr($movie,4,2),0,0,0);
            
            // # check for - or 0 movie length
            if ($movie_end <= $movie) continue;
            
            $fps_latest = 0; //# scan for correct fps time slot
            for ($i=0;$i<count($fps_time);$i++) {
                if  ($movie < $fps_time[$i]) break;
                $fps_latest = $fps[$i];
            }        
            $coded_str .= sprintf('$%s#%s#%s#%s', $movie, $fps_latest, $movie_end, $movie_ext);
		}
    }   
//var_dump( $coded_str);
    return $coded_str;
}        

function smovie_journal_data($images_dbase_dir, $date, $feed, $fps_time, $fps) {
    // """   
    // Returns a coded string containing data on the 'smovie' directory. This is an
    // expensive operation so checks for a cached 'smovie_cache' first.
    
    // coded string consists of:
    
    // $<HHMMSS start>#<?? start items>#<?? fps>#<HHMMSS end>#<?? end items>...
    
    // args    : images_dbase_dir ... the images dbase dir ;)
              // date ...             the required date
              // feed ...             the required feed
              // fps_time ...         list of fps start times
              // fps ...              list of fps
    // excepts : 
    // returns : string data blob 
    // """
    
    // # check for cached data
    $smovie_cache = sprintf('%s/%s/%02d/smovie_cache',$images_dbase_dir, $date, $feed);
    
    if (is_file($smovie_cache)) {
		$cache=file_get_contents($smovie_cache);
        $coded_str = str_replace("\n",'',$cache);
    } else {
        // # generate the data the expensive way
        list($start, $end) = scan_image_dbase($images_dbase_dir, $date, $feed);
        
        // # merge the 'movie' and 'fps' data
        $coded_str = '';
        for ($i=0;$i<count($start);$i++) {
            $coded_str .= sprintf('$%s',$start[$i]);			
			$coded_str .= sprintf('#%s', count(scandir(sprintf('%s/%s/%02d/smovie/%s',$images_dbase_dir, $date, $feed, $start[$i])))-2);
            $fps_latest = 0;// # scan for correct fps time slot
            for ($j=0;$j<count($fps_time);$j++) {
                if ($start[$i] < $fps_time[$j]) break;
                $fps_latest = $fps[$j];
            }
            $coded_str .= sprintf('#%s', $fps_latest);
            
            $coded_str .= sprintf('#%s',$end[$i]);
			$coded_str .= sprintf('#%s', count(scandir(sprintf('%s/%s/%02d/smovie/%s',$images_dbase_dir, $date, $feed, $end[$i])))-2);            
		}
	}

    return $coded_str;
}	

function scan_image_dbase($images_dbase_dir, $date_, $feed) {  
    // """
    // Scan the 'images_dbase' directory looking for breaks that signify 
    // different 'smovie's, store in 'start' and 'end' and return as a pair
    // of identically sized lists
    
    // args    : images_dbase_dir ... the images dbase dir 
              // date ...             the required date
              // feed ...             the required feed
    // excepts : 
    // returns : start ...            lists the movie start times
              // end ...              lists the movie end times
    // """
    
	$start = array();
	$end = array();
    $smovie_dir = sprintf('%s/%s/%02d/smovie',$images_dbase_dir, $date_, $feed);
    
    if (is_dir($smovie_dir)) {
        $movie_secs = scandir($smovie_dir);
		unset($movie_secs[0], $movie_secs[1]);
        
        
        if (count($movie_secs) > 0) {
            $old_sec = 0;
            $old_movie_sec = 0;
            
            foreach ($movie_secs as $movie_sec) {
				$sec = (int)substr($movie_sec,0,2) * 3600 + (int)substr($movie_sec,2,2) * 60 + (int)substr($movie_sec,4,2);                
                if ($sec != $old_sec + 1) {
                    $start[]=sprintf('%06s',$movie_sec);
                    if ($old_sec != 0) 
						$end[]=sprintf('%06s',$old_movie_sec);
				}
                $old_sec = $sec;
                $old_movie_sec = $movie_sec;
			}
            $end[]=$movie_sec;  
		}
    }
    return array($start, $end);
}   

function snap_journal_data($images_dbase_dir, $date, $feed) {
    // """
    // Returns a coded string containing the start time and interval secs for all 
    // snapshot setting changes for the defined 'date' and 'feed'. 
    
    // coded string consists of:
    
    // $<HHMMSS init time>#<?? interval secs> ...
    
    // args    : images_dbase_dir ... the images dbase dir 
              // date ...             the required date
              // feed ...             the required feed
    // excepts : 
    // returns : coded string
    // """
    
    $coded_str = '';
    $journal_file = sprintf('%s/%s/%02d/snap_journal',$images_dbase_dir, $date, $feed);
	//$snaps=scandir(sprintf('%s/%s/%02d/snap',$images_dbase_dir, $date, $feed));
        
    if (is_file($journal_file)) {
        $journal = explode("$",file_get_contents($journal_file));
        foreach ($journal as $line) {
    	    if ($line=="") continue;
            $data = explode("#",trim($line));
            $coded_str .= sprintf('$%s#%s',$data[0], $data[1]);
        }    
        // # if today append 'end' time of now 
        if ($date == date('Ymd')) {
            // # -60 secs due to 60 sec delay buffer in 'kmotion_hkd2'
            $time_obj = date('U',time()-60);
            $coded_str .= sprintf('$%s#0',date('His', $time_obj));
		}
	}
    return $coded_str;
}    

function fps_journal_data($images_dbase_dir, $date, $feed) {
    // """   
    // Parses 'fps_journal' and returns two lists of equal length, one of start 
    // times, the other of fps values.
    
    // args    : images_dbase_dir ... the images dbase dir ;)
              // date ...             the required date
              // feed ...             the required feed
    // excepts : 
    // returns : time ...             list of fps start times
              // fps ...              list of fps
    // """
         
    $time_ = array();
    $fps = array();
    $journal_file = sprintf('%s/%s/%02d/fps_journal',$images_dbase_dir, $date, $feed);
    $journal = explode("$",file_get_contents($journal_file));    
    
    
    foreach ($journal as $line) {
	if ($line=="") continue;
        $data = explode("#",trim($line));
        $time_[]=$data[0];
        $fps[]=(int)$data[1];
    }    
    return array($time_, $fps);
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
        $f_obj = fopen("$kmotion_dir/www/mutex/kmotion_rc/".getmypid(), 'w');
		fclose($f_obj);      
            
        // # wait ... see if another lock has appeared, if so remove our lock
        // # and loop
        usleep(100000);
        if (check_lock($kmotion_dir) == 1)
            break;
        unlink("$kmotion_dir/www/mutex/kmotion_rc/".getmypid());
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
    
	if (file_exists("$kmotion_dir/www/mutex/kmotion_rc/".getmypid()))
		unlink("$kmotion_dir/www/mutex/kmotion_rc/".getmypid());  
} 
        
function check_lock($kmotion_dir) {
    // """
    // Return the number of active locks on the www_rc mutex, filters out .svn
    
    // args    : kmotion_dir ... kmotions root dir
    // excepts : 
    // return  : num locks ... the number of active locks
    // """
    
    $files = scandir("$kmotion_dir/www/mutex/kmotion_rc");
	unset($files[0],$files[1]);
    
    return count($files);
}  
        
        

?>












