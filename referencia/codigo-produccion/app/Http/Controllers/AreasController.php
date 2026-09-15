<?php
namespace App\Http\Controllers;

use App\Models\AreasGobiernos;
use Illuminate\Http\Request;
use App\Http\Controllers\Traits\Banners;
use App\Models\Administracion;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Traits\Visitas;

class AreasController extends Controller
{   
    use Banners;
    use Visitas;
    
    public function index(Request $request)
    {
        $id = $request->id;
        if (!$id || !is_numeric($id)) {
            abort(500);
        }

        $area = AreasGobiernos::with('administracion')->find($id);


        $areasRelacionadas = $area->administracionPivote()->orderBy('orden', 'asc')->get();

        $areasRelacionadasConInfo = $areasRelacionadas->load('administracion');


        $sidebarBanner = $this->getBanners('colder');
        $this->gestionVisitas($id, 'gobierno');
        $visitas = $this->allVisitContent();

        return view('areas.index', [
            'area'=>$area,
            'areasRelacionadas' => $areasRelacionadasConInfo,
            'sidebarBanner'=>$sidebarBanner,
            'visitas'=>$visitas,
            'phones'=>$this->phones(),
        ]);

    }
	 
}