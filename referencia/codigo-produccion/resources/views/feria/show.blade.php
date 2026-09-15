@extends('layouts.app')

@section('jsheader')
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper/swiper-bundle.min.css">
@stop

@section('content')
    <div class="container-custom">
        <div class="sub-barra">
            <p class="px-3">Inicio > Catalogo > Emprendimiento</p>
        </div>
        <div class="px-4 px-lg-5">
            <div class="mb-2">
                <a href="{{ url()->previous()}}"><i class="fa-solid fa-arrow-left"></i> Volver</a>
            </div>
            @if (!$producto)
                <h3 class="tp-section-title mb-20">Ficha de Emprendedor</h3>
            @endif
            <div class="row w-100 mb-20">
                @if ($galeria && $galeria->isNotEmpty())
                    <div class="col-md-4">
                        <div class="swiper-container swiper-productos-container">
                            <div class="swiper-wrapper">
                                @foreach ($galeria as $imagen)
                                    <div class="swiper-slide">
                                        <img class="img-galery-feria" src="/storage/{{ $imagen->imagen }}" alt="Imagen de {{ $producto }}">
                                    </div>
                                @endforeach
                            </div>
                            <div class="swiper-button-next swiper-button-next-prod"></div>
                            <div class="swiper-button-prev swiper-button-prev-prod"></div>
                        </div>
                    </div>
                @endif
                <div class="col-md-6 icon-up">
                    @if ($producto)
                        <p>Nombre del Producto: <span class="titulo-producto">{{$producto}}</span></p>
                        <div>
                            <p class="bajada-feria">Datos de Contacto:</p>
                        </div>
                    @endif
                    <p><i class="fas fa-store"></i>Nombre del Emprendimiento: <span style="text-transform: uppercase">{{ $emprendimiento->nombre_empre }}</span></p>
                    <p><i class="fas fa-user"></i>Emprendedor: {{ $emprendimiento->emprendedor->apellido }} {{ $emprendimiento->emprendedor->nombre }}
                    </p>
                    <p><i class="fas fa-phone "></i>Teléfono: {{ $emprendimiento->emprendedor->telefono ?: '-' }}</p>
                    <p><i class="fas fa-envelope"></i>E-mail: {{ $emprendimiento->emprendedor->email ?: '-' }}</p>
                    <p><i class="fab fa-instagram"></i>Instagram: @if ($emprendimiento->emprendedor->instagram)
                        <a href="https://www.instagram.com/{{$emprendimiento->emprendedor->instagram}}" target="_blank" rel="noopener noreferrer">{{$emprendimiento->emprendedor->instagram}}</a>
                    @else
                        -
                    @endif</p>
                    <p><i class="fab fa-facebook"></i>Facebook: @if ($emprendimiento->emprendedor->facebook)
                        <a href="https://www.facebook.com/{{$emprendimiento->emprendedor->facebook}}" target="_blank" rel="noopener noreferrer">{{$emprendimiento->nombre_empre}}</a>
                    @else
                        -
                    @endif</p>
                </div>
                @if ($emprendimiento->logo)
                <div class="col-md-2 col-img">
                    <img class="imglogo-show" src="/storage/{{ $emprendimiento->logo->logo }}" alt="">
                </div>
                @endif
            </div>
            <div class="mb-20">
                <div class="mb-4">
                    <h5>Productos de {{ $emprendimiento->nombre_empre }}</h5>
                </div>
                <div class="container swiper-container swiper-showferia">
                    <div class="swiper-wrapper">
                        @foreach ($emprendimiento->productos as $producto)
                            <div class="swiper-slide swiper-slide-feria">
                                <a
                                    href="/emprendimiento/{{ $emprendimiento->id_emprendimiento }}/{{ $producto->producto }}">
                                    <div class="card product-show">
                                        <div class="w-100">
                                            @php
                                                $galeria = $producto->galeria->firstWhere(
                                                    'emprendimiento_id',
                                                    $emprendimiento->id_emprendimiento,
                                                );
                                            @endphp
                                            @if ($galeria)
                                                <div class="position-relative">
                                                    <img class="img-card-feria" src="/storage/{{ $galeria->imagen }}"
                                                        alt="{{ $producto->producto }}">
                                                    <div class="title-text">
                                                        <p>{{ $emprendimiento->nombre_empre }}</p>
                                                    </div>
                                                </div>
                                            @else
                                                <div class="card-feria-title">
                                                    <div class="title-text">
                                                        <p>{{ $emprendimiento->nombre_empre }}</p>
                                                    </div>
                                                </div>
                                            @endif
                                        </div>
                                        <div class="card-body body-feria">
                                            @if ($producto->producto)
                                                <p>{{ $producto->producto }}</p>
                                            @endif
                                            <p><i class="fa-solid fa-location-dot"></i>
                                                @if ($emprendimiento->feria->feria)
                                                        {{($emprendimiento->adicional)?$emprendimiento->adicional->adicional:'n/n'}} {{$emprendimiento->feria->feria}}
                                                    @else
                                                        -
                                                    @endif
                                            </p>
                                        </div>
                                    </div>
                                </a>
                            </div>
                        @endforeach
                    </div>
                    <!-- Botones de navegación -->
                    <div class="swiper-button-next swiper-button-next2"></div>
                    <div class="swiper-button-prev swiper-button-prev2"></div>
                </div>
            </div>
        </div>
    </div>
@endsection

@section('jsfooter')
    <script src="https://cdn.jsdelivr.net/npm/swiper/swiper-bundle.min.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            new Swiper('.swiper-productos-container', {
                slidesPerView: 1,
                spaceBetween: 5,
                navigation: {
                    nextEl: '.swiper-button-next-prod',
                    prevEl: '.swiper-button-prev-prod',
                },
                loop: true,
                autoplay: {
                    delay: 4000,
                    disableOnInteraction: false,
                },
            });

            new Swiper('.swiper-showferia', {
                slidesPerView: 1,
                spaceBetween: 5,
                navigation: {
                    nextEl: '.swiper-button-next2',
                    prevEl: '.swiper-button-prev2',
                },
                loop: true,
                autoplay: {
                    delay: 4000,
                    disableOnInteraction: false,
                },
                breakpoints: {
                    600: {
                        slidesPerView: 4,
                        spaceBetween: 10,
                    },
                },
            });
        });
    </script>
@append
