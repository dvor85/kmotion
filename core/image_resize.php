#!/usr/bin/php5
<?php
/***********************************************************************************
Функция img_resize(): генерация thumbnails
Параметры:
  $src             - имя исходного файла
  $dest            - имя генерируемого файла
  $width, $height  - ширина и высота генерируемого изображения, в пикселях
Необязательные параметры:
  $rgb             - цвет фона, по умолчанию - белый
  $quality         - качество генерируемого JPEG, по умолчанию - максимальное (100)
***********************************************************************************/
function img_resize($src, $dest, $width=0, $height=0, $quality=100, $rgb=0xFFFFFF)
{
  //return false;
  if (($height==0)&&($width==0)) return false;
  if (!file_exists($src)) return false;

  $size = getimagesize($src);

  if ($size === false) return false;

  // Определяем исходный формат по MIME-информации, предоставленной
  // функцией getimagesize, и выбираем соответствующую формату
  // imagecreatefrom-функцию.
  $format = strtolower(substr($size['mime'], strpos($size['mime'], '/')+1));
  $icfunc = "imagecreatefrom" . $format;
  if (!function_exists($icfunc)) return false;

  $y_ratio = $height / $size[1];
  $x_ratio = $width / $size[0];

  $new_width   = ($width==0)?floor($size[0] * $y_ratio):$width;
  $new_height  = ($height==0)?floor($size[1] * $x_ratio):$height;
  $new_left    = 0;
  $new_top     = 0;

  $isrc = $icfunc($src);
  $idest = imagecreatetruecolor($new_width, $new_height);

  imagefill($idest, 0, 0, $rgb);
  imagecopyresampled($idest, $isrc, $new_left, $new_top, 0, 0, 
    $new_width, $new_height, $size[0], $size[1]);

  imagejpeg($idest, $dest, $quality);

  imagedestroy($isrc);
  imagedestroy($idest);

  return true;

}

$src = $argv[1];
$dst = $argv[2];
$WxH = explode("x",$argv[3]);
$quality = empty($argv[4])?100:$argv[4];
if (is_file($src))
{
	img_resize($src, $dst, $WxH[0], $WxH[1], $quality);
}	

?>