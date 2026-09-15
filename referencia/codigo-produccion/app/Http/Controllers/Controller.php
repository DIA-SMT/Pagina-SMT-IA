<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Bus\DispatchesJobs;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController;
use Illuminate\Support\Facades\Storage;

use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Traits\Visitas;

class Controller extends BaseController
{
    use Visitas;
    use AuthorizesRequests, DispatchesJobs, ValidatesRequests;


  
    public function deleteFileIfExists($path)
    {
        if (Storage::disk(config('voyager.storage.disk'))->exists($path)) {
            Storage::disk(config('voyager.storage.disk'))->delete($path);
        }elseif (Storage::disk(config('voyager.storage.disk'))->exists($path.".webp")) {
            Storage::disk(config('voyager.storage.disk'))->delete($path.".webp");
        }
    }


    public function phones()
    {   

        return DB::table('emergency_phones')->select('name','phone')->get();
    }

    public function allVisitContent()
    {   
        $data = [];
        $data = array_merge($data, $this->getSectionVisitas('tramitesServicios'));
        $data = array_merge($data, $this->getSectionVisitas('notasGenerales'));
        $data = array_merge($data, $this->getSectionVisitas('gobierno'));
        return $data;
    }

    protected static function CallAPI($method, $url, $TOKEN=null, $data = false)
    {
        $curl = curl_init();

        switch ($method)
        {
            case "POST":
                curl_setopt($curl, CURLOPT_POST, 1);

                if ($data)
                    curl_setopt($curl, CURLOPT_POSTFIELDS, $data);
                break;
            case "PUT":
                curl_setopt($curl, CURLOPT_PUT, 1);
                break;
            default:
                if ($data)
                    $url = sprintf("%s?%s", $url, http_build_query($data));
        }

        if ($TOKEN<>null){
            curl_setopt($curl, CURLOPT_HTTPHEADER, array(
            'Accept: application/json',
            'Content-Type: application/json',
            'Authorization: Bearer ' . $TOKEN
            ));
        }

        //return $curl;
        curl_setopt($curl, CURLOPT_URL, $url);
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);

        $result = curl_exec($curl);

        curl_close($curl);

        return $result;
    }


}
