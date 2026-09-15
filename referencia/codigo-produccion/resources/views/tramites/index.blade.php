@extends('layouts.app')

@section('jsheader')
    <meta  name="title" content="{{$tramite->title}}" >
    <title>{{$tramite->title}}</title>
@stop


@section('content')

<section class="container-custom">
    <div class="sub-barra">
        <p class="px-3">Inicio > Tramite y Servicios > {{$tramite->title}}</p>
    </div>
    <div class="pt-15 pb-60">
        <div class="row w-100 mx-auto">
            <!-- subcategorias -->
            <h3 class="tp-section-title mb-40 px-4">{{$tramite->title}}</h3>
            <div class="col-12 col-lg-9 px-lg-4">
                <div class="row">
                    <?php $n = 1; ?>
                    @if($items->count()>0)
                        @foreach($items as $item) {{-- Los items son las notas en si --}}
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
                    @else
                        <div class="alert alert-info">Seccion sin contenido</div>
                    @endif
                  
                </div>
            </div>
            <!-- banners -->
            @include('shared.banner-sidebar')
        </div>
    </div>
</section>

@endsection

