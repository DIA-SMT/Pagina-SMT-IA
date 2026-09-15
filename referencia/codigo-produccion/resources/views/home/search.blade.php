@extends('layouts.app')
@section('jsheader')
    <meta  name=title content="{{$busqueda}}" >
    <title>{{$busqueda}}</title>
@stop

@section('content')
<section class="container-custom">
    <div class="sub-barra">
        <p class="px-3">Inicio > Tramite y Servicios > {{$busqueda}}</p>
    </div>
    <div class="pt-15 pb-60">
        <div class="row w-100 mx-auto">
            <h3 class="tp-section-title mb-40 px-4">Notas Generales</h3>
            <div class="col-12 col-lg-9 px-lg-4">
                <div class="row">
                    <?php $n = 1; ?>
                    @if($notas->count()>0)
                        @foreach($notas as $item)
                            <div class="col-6 col-md-4 wow tpfadeUp" data-wow-duration=".9s" data-wow-delay=".{{$n}}s">
                                <a href="/{{$item->slug}}">
                                    <div class="tp-feature-item mb-30 text-center">
                                        <div class="tp-feature-icon">
                                           <img src="/storage/{{$item->imagen}}" class="img-fluid">
                                        </div>
                                        <div class="tp-feature-content">
                                            <h4 class="tp-feature-title-sm">{{$item->titulo}}</h4>
                                        </div>
                                    </div>
                                </a>
                            </div>
                            <?php $n++; ?>
                        @endforeach
                    @endif
                    @foreach($notasTramites as $notas)
                        <div class="col-6 col-md-4 wow tpfadeUp" data-wow-duration=".9s" data-wow-delay=".3s">
                                <a href="/nota/{{str_slug($notas->title)}}/{{$notas->id}}">
                                    <div class="tp-feature-item mb-30 text-center">
                                       @if($notas->imagen) <div class="tp-feature-icon">
                                           <img src="/storage/{{$notas->imagen}}" class="img-fluid">
                                        </div>@endif
                                        <div class="tp-feature-content">
                                            <h4 class="tp-feature-title-sm">{{$notas->title}}</h4>
                                        </div>
                                    </div>
                                </a>
                            </div>
                    @endforeach

                    @if($notas->count() == 0 && $notasTramites->count() == 0)
                        <div class="alert alert-info">Seccion sin contenido</div>
                    @endif
             
                </div>
            </div>

            <h3 class="tp-section-title mb-40 px-4">Gobierno</h3>
            <div class="col-12 col-lg-9 px-lg-4">
                <div class="row">
                    <?php $n = 1; ?>
                    @if($administracion->count()>0)
                        @foreach($administracion as $administracion)
                            <div class="col-6 col-md-4 wow tpfadeUp" data-wow-duration=".9s" data-wow-delay=".{{$n}}s">
                                <a href="/area/{{str_slug($administracion->nombre)}}/{{$administracion->area_id}}">
                                    <div class="tp-feature-item mb-30 text-center">
                                        <div class="tp-feature-icon">
                                           <img src="/storage/{{$administracion->foto}}" class="img-fluid">
                                        </div>
                                        <div class="tp-feature-content">
                                            <h4 class="tp-feature-title-sm">{{$administracion->nombre}}</h4>
                                        </div>
                                    </div>
                                </a>
                            </div>
                            <?php $n++; ?>
                        @endforeach
                    @else
                        <div class="alert alert-info">Seccion sin contenido</div>
                    @endif
             
                </div>
            </div>

            <h3 class="tp-section-title mb-40 px-4">Tramites & Servicios</h3>
            <div class="col-12 col-lg-9 px-lg-4">
                <div class="row">
                    <?php $n = 1; ?>

                    @if($tramites->count()>0)
                        @foreach($tramites as $tramite)
                            <div class="col-6 col-md-4 wow tpfadeUp" data-wow-duration=".9s" data-wow-delay=".{{$n}}s">
                                <a href="/tramite/{{str_slug($tramite->title)}}/{{$tramite->id}}">
                                    <div class="tp-feature-item mb-30 text-center">
                                        <div class="tp-feature-icon">
                                            <i class="{{$tramite->icon}}"></i>
                                        </div>
                                        <div class="tp-feature-content">
                                            <h4 class="tp-feature-title-sm">{{$tramite->title}}</h4>
                                        </div>
                                    </div>
                                </a>
                            </div>
                            <?php $n++; ?>
                        @endforeach
                    @endif

                    @if($tramitesItems->count()>0)
                        @foreach($tramitesItems as $item) {{-- Los items son las notas en si --}}
                            <?php 
                                $localLink = "/nota/".str_slug($item->nota_title)."/{$item->nota_id}";
                            ?>
                            <div class="col-6 col-md-4 wow tpfadeUp" data-wow-duration=".9s" data-wow-delay=".{{$n}}s">
                                <a href="{{($item->link)?$item->link:$localLink}}" {{($item->link)?'target="_blank"':null}}>
                                    <div class="tp-feature-item mb-30 text-center">
                                        <div class="tp-feature-icon">
                                            <i class="{{$item->icon}}"></i>
                                        </div>
                                        <div class="tp-feature-content">
                                            <h4 class="tp-feature-title-sm">{{$item->title}}</h4>
                                            <p>{{$item->texto}}</p>
                                        </div>
                                    </div>
                                </a>
                            </div>
                            <?php $n++; ?>
                        @endforeach
                    @endif

                    @if($tramites->count()==0 &&  $tramitesItems->count()==0)
                        <div class="alert alert-info">Seccion sin contenido</div>
                    @endif
                    
                </div>
            </div>

            @include('shared.banner-sidebar')
        </div>
    </div>
</section>


@endsection

@section('jsfooter')

@append