@extends('layouts.app')
@section("meta")
    <title>{{$nota->titulo}}</title>
@stop
@section('content')
<section class="container-custom">
    <div class="sub-barra">
        <p class="px-3">Inicio > Notas > {{$nota->titulo}}</p>
    </div>
    <div class="pt-15 pb-60">
        <div class="row w-100 mx-auto">
            <!-- subcategorias -->
            <div class="col-12 col-lg-9 px-4 px-lg-5">
                <div>
                    <div class="d-flex mb-20">
                        <a href="#" onclick="window.history.back()" class="btn btn-primary me-4">
                            <i class="fa-solid fa-arrow-left pe-2"></i>Volver
                        </a>
                        <h3 class="tp-section-title mb-0">{{$nota->titulo}}</h3>
                    </div>
                    <p class="bajada-nota">{{$nota->bajada}}</p>
                    <img src="/storage/{{$nota->imagen}}" alt="">
                    <p class="pt-20">
                        {!! $nota->texto !!}</p>
                        @if ($nota->file)
                        <?php
                        
                        $file = json_decode($nota->file);
                        ?>
                        @if (count($file) > 0)
                            <div class="d-flex pt-4">
                                <div style="width: 60px">
                                    <img src="/assets/img/muni/pdf.png" alt="">
                                </div>
                                <div>
                                    <h5 class="text-muted mb-0">
                                        {{ $file[0]->original_name }}
                                    </h5>
                                    <a class="btn btn-descargar mt-2" target="_blank"
                                        href="/storage/{{ $file[0]->download_link }}">DESCARGAR</a>
                                </div>
                            </div>
                        @endif
                    @endif
                </div>
                <hr>
                <div class="d-flex justify-content-end pe-5 mb-5 pb-5">
                    <div class="container-share">
                        <p>Compartir en redes sociales:</p>
                        <div class="icon-share d-flex justify-content-center">
                            <a href="#" onclick="window.open('https://www.facebook.com/sharer.php?u={{url()->current()}}','Compartir', 'toolbar=0, status=0, width=650, height=450');"><i class="fab fa-facebook"></i></a>
                            <a href="https://api.whatsapp.com/send?text={{$nota->titulo}}, {{url()->current()}}"><i class="fab fa-whatsapp"></i></a>
                            <a href="https://twitter.com/intent/tweet?url={{url()->current()}}" target="_blank">
                                <i class="fab fa-twitter"></i>
                            </a>
                            <a href="https://t.me/share/url?url={{url()->current()}}" target="_blank">
                                <i class="fab fa-telegram"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <!-- banners -->
            @include('shared.banner-sidebar')

        </div>
    </div>
</section>
@endsection