@extends('layouts.app')

@section('content')
    <div class="mg-page-title">
        <div class="sub-barra">
            <p class="px-3">Inicio > Imágenes</p>
        </div>
        <div class="container">
            <div class="row">
                <div class="col-md-12 text-center">
                    <h2 class="tp-section-title">Imágenes</h2>
                </div>
            </div>
        </div>
    </div>
    <div class="mg-page">
        <div class="container">
            <div class="row">
                <div class="col-md-12">
                    <div class="mg-filter">
                        <form id="mg-filter">
                            <fieldset>
                                <label class="btn btn-dark btn-main ">
                                    <input type="radio" name="filter" value="all" checked="checked">Todas
                                </label>
                                <?php
                                $imagenes = [];
                                ?>
                                @foreach ($galerias as $galeria)
                                    <label class="btn btn-dark">
                                        <input type="radio" name="filter" value="{{ $galeria->id }}">
                                            {{ $galeria->name }}
                                    </label>
                                    <?php
                                    $imagenes[] = [
                                        'fotos' => DB::table('galerias_fotos')
                                            ->select('foto', 'galeria_id','descripcion')
                                            ->where('galeria_id', $galeria->id)
                                            ->get(),
                                    ];
                                    ?>
                                @endforeach
                            </fieldset>
                        </form>
                    </div>
                    <div class="row" id="mg-grid">
                        @if (count($imagenes) > 0)
                            @foreach ($imagenes as $imagen)
                                @foreach ($imagen['fotos'] as $foto)
                                <figure class="col-12 col-md-6 col-lg-3 mg-gallery-item" data-groups="[&quot;{{ $foto->galeria_id }}&quot;]">
                                    <a href="{{ voyager::get_image($foto->foto, '') }}" data-lightbox-gallery="rooms" title="{{$foto->descripcion}}">
                                        <img class="img-fluid" src="{{ voyager::get_image($foto->foto, 'cropped') }}" alt="" />
                                        <span class="mg-gallery-overlayer"><i class="fa fa-search-plus"></i></span>
                                    </a>
                                </figure>
                                @endforeach
                            @endforeach
                        @endif
                    </div>
                </div>
            </div>
        </div>
    </div>
@append

<script>
    $(document).ready(function() {
        // Inicializar Nivo Lightbox
        $('a[data-lightbox-gallery]').nivoLightbox({
            title: function() {
                return $(this).attr('title');
            }
        });
    });
    
    $(document).ready(function() {
        // Filtrar imágenes
        $('input[name="filter"]').on('change', function() {
            var filterValue = $(this).val();
            $('.mg-gallery-item').hide();
            if (filterValue === 'all') {
                $('.mg-gallery-item').show();
            } else {
                $('figure[data-groups*="' + filterValue + '"]').show();
            }
        });
    });
    </script>

