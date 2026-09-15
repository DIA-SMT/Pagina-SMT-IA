<?php

namespace App\Http\Controllers;

use App\Models\EmprendimientoCabe;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Voyager;

class FeriaController extends Controller
{

    public function index(Request $request)
    {
        $sliders = DB::table('sliders_feria')->where('active', 1)->orderBy('orden', 'ASC')->get()->toArray();
        $ferias = DB::table('tbl_ferias')
        ->join('feria_completar', 'tbl_ferias.id_feria', '=', 'feria_completar.id_feria')
        ->select('tbl_ferias.*', 'feria_completar.*')
        ->get();

        $rubros = DB::table('tbl_rubro')->get();

        // Variables de filtro
        $feriaId = $request->input('feria');
        $rubroId = $request->input('rubro');
        $productoId = $request->input('producto');
        $keyProducto = $request->input('keyproducto');
        $keyEmprendimiento = $request->input('keyemprendimiento');

        // Consulta base
        $emprendimientos = EmprendimientoCabe::query()
            ->with(['emprendedor:id_emprendedor,nombre,apellido', 'feria', 'productos.galeria', 'logo:id,id_emprendimiento,logo','adicional']);


        // Verificar si hay filtros aplicados
        $hayFiltros = $feriaId || $rubroId || $productoId || $keyProducto || $keyEmprendimiento;

        if ($hayFiltros) {

            if ($feriaId) {
                $emprendimientos->where('id_feria', $feriaId);
            }
            if ($rubroId) {
                $emprendimientos->whereHas('detalle', function ($query) use ($rubroId) {
                    $query->where('id_rubro', $rubroId);
                });
            }

            if ($productoId) {
                $emprendimientos->whereHas('productos', function ($query) use ($productoId) {
                    $query->where('tbl_producto.id_producto', $productoId);
                })->with(['productos' => function ($query) use ($productoId) {
                    $query->with(['galeria' => function ($galeriaQuery) use ($productoId) {
                        $galeriaQuery->where('producto_id', $productoId);
                    }]);
                }]);
            }

            if ($keyProducto) {
                $emprendimientos->whereHas('productos', function ($query) use ($keyProducto) {
                    $query->where('producto', 'like', '%' . $keyProducto . '%');
                })->with(['productos' => function ($query) use ($keyProducto) {
                    $query->with(['galeria']);
                }]);
            }
    
            if ($keyEmprendimiento) {
                $emprendimientos->where('nombre_empre', 'like', '%' . $keyEmprendimiento . '%');
            }


            $emprendimientos = $emprendimientos->paginate(9);
        } else {
            $emprendimientos = $emprendimientos->whereHas('logo',function($query){
                $query->whereNotNull('logo');
            })->inRandomOrder()->take(9)->get();
        }

        return view('feria.index', [
            'phones' => $this->phones(),
            'sliders' => $sliders,
            'ferias' => $ferias,
            'rubros' => $rubros,
            'emprendimiento' => $emprendimientos,
            'hayFiltros' => $hayFiltros,
        ]);
    }


    public function getProductosByRubro($idRubro)
    {
        $productos = DB::table('tbl_producto')
            ->where('id_rubro', $idRubro)
            ->get();

        return response()->json($productos);
    }


    public function show($id, $producto = null)
    {
        $emprendimiento = EmprendimientoCabe::with(['emprendedor', 'feria', 'logo:id,id_emprendimiento,logo','adicional'])
            ->findOrFail($id);

        $galeria = null;

        if ($producto) {
            
            $productoModel = $emprendimiento->productos()
                ->where('producto', $producto)
                ->first();

            if ($productoModel) {
                $galeria = $productoModel->galeria()
                    ->where('emprendimiento_id', $emprendimiento->id_emprendimiento)
                    ->get();
            }
        }

        return view('feria.show', [
            'phones' => $this->phones(),
            'emprendimiento' => $emprendimiento,
            'galeria' => $galeria,
            'producto' => $producto
        ]); 
    }
}
