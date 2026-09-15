@extends('layouts.app')

@section('jsheader')
    <meta name="title" content="{{ Voyager::setting('site.title') }}">
    <title>{{ Voyager::setting('site.title') }}</title>
@stop


@section('content')
    @if (count($sliders))
        <!-- hero area start -->
        <div class="tp-slider-area">
            <div class="tp-slider-wrapper p-relative">
                <div class="tp-slider-meta-box d-none d-md-block">
                    <div class="tp-slider-meta d-flex align-items-center">
                        {{-- <div class="tp-slider-meta-icon">
                    <i class="flaticon-sun"></i>
                </div> --}}
                        <div class="tp-slider-meta-content">
                            <div id="TT_yeewrxYxtQQc47sK7fqDzjDjz6nKTnM2rtEtkZC5akz"></div>
                            <script type="text/javascript" src="https://www.tutiempo.net/s-widget/l_yeewrxYxtQQc47sK7fqDzjDjz6nKTnM2rtEtkZC5akz">
                            </script>
                        </div>
                    </div>
                </div>
                <div class="tp-slider-arrow-box">
                    <button class="slider-prev"><i class="fa-regular fa-arrow-left"></i></button>
                    <button class="slider-next"><i class="fa-regular fa-arrow-right"></i></button>
                </div>
                <div class="swiper-container tp-slider-active">
                    <div class="swiper-wrapper">
                        @foreach ($sliders as $slider)
                            <div class="swiper-slide">
                                <a href="{{ $slider->link }}">
                                    <div
                                        class="tp-slider-bg d-flex justify-content-center align-items-center p-relative fix">
                                        <div class="tp-slider-img d-lg-block d-none"
                                            data-background="/storage/{{ $slider->image }}"></div>
                                        <div class="tp-slider-img d-block d-lg-none"
                                            data-background="/storage/{{ $slider->responsive }}"></div>
                                        <div class="container">
                                            <div class="row">
                                                <div class="col-xl-9">
                                                    <div class="tp-slider-content-wrap p-relative z-index-2">
                                                        <div class="tp-slider-title-box p-relative">
                                                            <span class="tp-slider-subtitle">{{ $slider->title }}</span>
                                                            <h4 class="tp-slider-title">{{ $slider->description }}</h4>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </a>
                            </div>
                        @endforeach
                    </div>
                </div>
            </div>
        </div>
        <!-- hero area end -->
    @endif

    @if ($tramites && $tramites->count() > 0)
        <!-- servicio area -->
        <div id="feature-one-page" class="tp-feature-area pt-60 pb-60 p-relative z-index">
            <div class="container">
                <div class="tp-team-title-box mb-50">
                    <h4 class="tp-section-title mb-25">Trámites y servicios</h4>
                </div>
                <div class="row row-cols-xl-4 row-cols-lg-3 justify-content-center">
                    <?php $n = 1; ?>
                    @foreach ($tramites as $tramite)
                        <div class="col col-sm-6 wow tpfadeUp" data-wow-duration=".9s"
                            data-wow-delay=".{{ $n }}s">
                            <a href="/tramite/{{ str_slug($tramite->title, '-') }}/{{ $tramite->id }}">
                                <div class="tp-feature-item mb-30 text-center">
                                    <div class="tp-feature-icon">
                                        <i class="{{ $tramite->icon }}"></i>
                                    </div>
                                    <div class="tp-feature-content">
                                        <h4 class="tp-feature-title-sm">{{ $tramite->title }}</h4>
                                        <p>{{ $tramite->texto }}</p>
                                    </div>
                                </div>
                            </a>
                        </div>
                    @endforeach

                </div>
            </div>
        </div>
        <!-- servicio area end -->
    @endif

    <div class="tel-page pt-60 pb-50">
        <div class="container">
            <img src="./assets/img/muni/callcenter.png" class="tel-page-call" alt="">
            @if ($bannersHorizontal && $bannersHorizontal->count() > 0)
                @foreach ($bannersHorizontal as $bh)
                    @php
                        $target = $bh->target ? '' : '_blank';
                    @endphp
                    <div class="banner-principal mb-60 d-flex justify-content-center">
                        <a href="{{ $bh->link }}" target="{{ $target }}">
                            <img src="/storage/{{ $bh->image }}" class="d-none d-lg-block" alt="{{ $bh->name }}">
                            <img src="/storage/{{ $bh->responsive }}" class="d-block d-lg-none" alt="{{ $bh->name }}">
                        </a>
                    </div>
                @endforeach
            @endif

            @if ($phones && $phones->count() > 0)
                <div class="row">
                    <div class="col-xl-12">
                        <div class="tp-blog-section-title mb-55">
                            <h4 class="tp-section-title">Teléfonos de Urgencia</h4>
                        </div>
                    </div>
                </div>
                <div class="row d-flex justify-content-between" style="position: relative;">
                    @foreach ($phones as $phone)
                        <div class="col-2 container-tel">
                            <a href="tel:{{ $phone->phone }}" class="tel-num">
                                <span>{{ $phone->phone }}</span>
                                <p>{{ $phone->name }}</p>
                            </a>
                        </div>
                    @endforeach

                </div>
            @endif
        </div>
    </div>

        <!--Noticia  area start -->
        <div id="blog-one-page" class="tp-blog-area pt-60 pb-50">
           {{-- @if ($scrapeWebsite && count($scrapeWebsite) > 0)
                <div class="container">
                    <div class="row">
                        <div class="col-xl-12">
                            <div class="tp-blog-section-title mb-55">
                                <h4 class="tp-section-title">Noticias Principales</h4>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        @foreach ($scrapeWebsite as $content)
                            <div class="col-xl-4 col-lg-4 col-md-6 mb-30">
                                <div class="tp-blog__item">
                                    <div class="tp-blog__thumb p-relative fix">
                                        <a href="https://comunicacionsmt.gob.ar{{ $content['enlace'] }}" target="_blank">
                                            <img class="w-100 img-not" src="https://comunicacionsmt.gob.ar{{ $content['imagen'] }}"
                                                alt="">
                                        </a>
                                    </div>
                                    <div class="tp-blog__content-wrap">
                                        <h5 class="tp-blog__title-sm"><a href="https://comunicacionsmt.gob.ar/"
                                                target="_blank">{{ $content['titulo'] }}</a></h5>
                                    </div>
                                </div>
                            </div>
                        @endforeach
                    </div>
                    <div class="d-flex justify-content-end pb-40">
                        <a href="https://comunicacionsmt.gob.ar/" class="not-vermas"><i class="fas fa-arrow-right px-2"></i>Ver Más Noticias...</a>
                    </div>
                </div>
            @endif --}}

            @if ($multiple && $multiple->count() > 0)
                <div class="container">
                    <div class="row ">
                        @foreach ($multiple as $ban)
                            @php
                                $target = $ban->target ? '' : '_blank';
                            @endphp
                            <div class="col-10 mx-auto col-md-6 mb-30">
                              <a href="{{$ban->link}}" target="{{$target}}">
                                <img src="/storage/{{ $ban->image }}" class="d-none d-lg-block"
                                    alt="{{ $ban->name }}">
                                <img src="/storage/{{ $ban->responsive }}" class="d-block d-lg-none"
                                    alt="{{ $ban->name }}">
                              </a>
                            </div>
                        @endforeach
                    </div>
                </div>
            @endif
        </div>
        <!-- blog area end -->



@endsection
