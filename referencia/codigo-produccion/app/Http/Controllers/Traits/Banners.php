<?php
namespace App\Http\Controllers\Traits;

use Illuminate\Support\Facades\DB;

trait Banners
{   
    private function getBanners($position)
    {
        $banners = DB::table('banners')
            ->where("posicion", $position)->where("estado",1)->orderBy('orden', "ASC")->get();

        if ($banners->count() == 0) {
            return null;
        }

        return $banners;
        
    }
    
}

