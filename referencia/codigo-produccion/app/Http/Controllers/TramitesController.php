<?php

namespace App\Http\Controllers;

use App\Models\TramitesServicios;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Traits\Banners;
use App\Models\TramitesNotas;
use App\Http\Controllers\Traits\Visitas;
use App\Models\TramitesServiciosItem;

class TramitesController extends Controller
{
    use Banners;
    use Visitas;

    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request)
    {
        $id = $request->id;
        if (!$id || !is_numeric($id)) {
            abort(500);
        }

        $tramite = TramitesServicios::where('id', $id)->with([
            'items'=>function($query){
                $query->select('tramites_servicios_items.id','tramites_servicios_items.title',
                'tramites_servicios_items.texto', 'tramites_servicios_items.tramite_id',
                'tin.id as nota_id', 'tin.title as nota_title','tramites_servicios_items.icon','tramites_servicios_items.link')
                ->leftJoin('tramites_items_notas as tin', 'tramites_servicios_items.id', '=', 'tin.item_id')
                ->groupBy('tramites_servicios_items.id')
                ->orderBy('order','ASC');
            }
        ])->first();

        if (!$tramite) {
            abort(404);
        }
        
        $items = $tramite->items;
        $sidebarBanner = $this->getBanners('colder');
        $this->gestionVisitas($id, 'tramitesServicios');
        $visitas = $this->allVisitContent();

        return view('tramites.index', [
            'tramite'=>$tramite,
            'visitas'=>$visitas,
            'items'=>$items,
            'sidebarBanner'=>$sidebarBanner,
            'phones'=>$this->phones(),
        ]);
    }



    public function showNota(Request $request)
    {
        $id = $request->id;
        if (!$id || !is_numeric($id)) {
            abort(500);
        }

        $nota = DB::table('tramites_items_notas')->select('id','title','image','excerpt','body','tramite_id','file')
            ->where('id',$id)->first();


        $subT = TramitesNotas::find($id);

        
        if($subT){
            $subTitle = $subT->tramite->title;
        }else{
            $subTitle = 'titulo no encontrado';
        }

        if (!$nota) {
            abort(404);
        }
        $sidebarBanner = $this->getBanners('colder');
        $visitas = $this->allVisitContent();

        return view('tramites.nota', [
            'nota'=>$nota,
            'sidebarBanner'=>$sidebarBanner,
            'visitas'=>$visitas,
            'phones'=>$this->phones(),
            'subT'=>$subTitle,
        ]);

    }

}
