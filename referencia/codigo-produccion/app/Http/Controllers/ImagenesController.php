<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ImagenesController extends Controller
{

    public function index()
    {   
        $galerias = DB::table("galerias as g")->select("g.id","g.name")->get();

        return view('imagenes.index', [
            'galerias'=>$galerias,
            'phones'=>$this->phones(),
        ]);
    }    
}
