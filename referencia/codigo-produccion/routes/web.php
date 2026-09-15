<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;


Route::get('/', 'HomeController@index');

#Rutas observadas
// Route::get('/ces','NotaController@show')->name('ces');
// Route::get('/colectivos','NotaController@show')->name('colectivos');
Route::get('/{slug}','NotaController@show');
Route::post('/buscador/barrios','MapController@barrios');
Route::get('/barrio-nota/{id}','MapController@barrioNotas');

#Nuevas rutas de SMT
Route::get('/tramite/{title}/{id}', 'TramitesController@index');
Route::get('/nota/{title}/{id}', 'TramitesController@showNota');
Route::get('/area/{title}/{id}', 'AreasController@index');
// Route::get('/contenido/{slug}/{id}', 'NotaController@show');

Route::get('/search/result', 'HomeController@search');
Route::get('/depenendencia/{administrador_id}/{name}/{area_id}', 'AreasController@depenendencias');
Route::get('/galeria/imagenes', 'ImagenesController@index');

Route::get('/catalogo/catalogo-de-emprendedores','FeriaController@index')->name('catalogo.emprendedores');
Route::get('/feria/productos/{idRubro}','FeriaController@getProductosByRubro');
Route::get('/emprendimiento/{id}/{producto?}','FeriaController@show');

Route::group(['prefix' => 'muni/rootadmin'], function () {
	Voyager::routes();

    $namespacePrefix = '\\'.config('voyager.controllers.namespace').'\\';
    Route::get('area-gobiernos/{id}/orden-dependiente', ['uses' => $namespacePrefix.'VoyagerAdministracionesController@order', 'as' => 'administraciones.order']);
    Route::post('area-gobiernos/{id}/orden-dependiente', ['uses' => $namespacePrefix.'VoyagerAdministracionesController@updateOrder', 'as' => 'administraciones.update.order']);
	Route::get('imagen/{id}/trash', ['uses' => $namespacePrefix.'VoyagerGaleriasController@trash', 'as' => 'trash']);
	Route::put('galeria/add-description', ['uses' => $namespacePrefix.'VoyagerGaleriasController@addDescription', 'as' => 'addDescription']);


});

