<footer>
    <div class="tp-footer-area pt-50 pb-20 p-relative z-index">
        <div class="tp-footer-shape">
            <img src="/assets/img/muni/Casa-Historica-03.png" alt="">
        </div>
        <div class="container">
            <div class="row">
                <div class="col-xl-3 col-lg-3 col-md-6 mb-50 wow tpfadeUp d-flex justify-content-center" data-wow-duration=".9s" data-wow-delay=".3s">
                    <div class="tp-footer-widget">
                        <div class="tp-footer-widget-logo">
                            <a href="/"><img src="/assets/img/muni/logo/Logo_SMT_neg_1.png" alt=""></a>
                        </div>
                        <div class="tp-footer-widget-content">
                            <div class="tp-footer-widget-menu">
                                <ul class="icon">
                                    <li><a href="#"><i class="fas fa-map-marker-alt"></i>Dirección: {{setting('site.address')}}</a></li>
                                    <li><a href="#"><i class="fas fa-phone"></i>Municipalidad: {{setting('site.municipalidad')}}</a></li>
                                    @if (setting('site.ap1'))
                                        <li><a href="#"><i class="fas fa-phone"></i>Asistencia Pública: {{setting('site.ap1')}}</a></li> 
                                    @endif
                                    @if (setting('site.ap2'))
                                        <li><a href="#"><i class="fas fa-phone"></i>Asistencia Pública: {{setting('site.ap2')}}</a></li>
                                    @endif
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-xl-3 col-lg-3 col-md-6 mb-50 wow tpfadeUp d-flex justify-content-start justify-content-md-center" data-wow-duration=".9s" data-wow-delay=".5s">
                    <div class="tp-footer-widget">
                        <h4 class="tp-footer-widget-title">Herramientas</h4>
                        <div class="tp-footer-widget-menu">
                           {{menu('footer')}}
                        </div>
                    </div>
                </div>
                <div class="col-xl-3 col-lg-3 col-md-6 mb-50 wow tpfadeUp d-flex justify-content-start justify-content-md-center" data-wow-duration=".9s" data-wow-delay=".7s">
                    <div class="tp-footer-widget">
                        <h4 class="tp-footer-widget-title">Teléfono de Urgencia</h4>
                        <div class="tp-footer-widget-menu">
                            @if($phones->count() > 0)
                                <ul>
                                    @foreach($phones as $phone)
                                    <li><a href="tel:{{$phone->phone}}">{{$phone->phone}} - {{$phone->name}}</a></li>
                                    @endforeach
                                </ul>
                            @endif
                        </div>
                    </div>
                </div>
                <div class="col-xl-3 col-lg-3 col-md-6 mb-50 wow tpfadeUp d-flex justify-content-start justify-content-md-center" data-wow-duration=".9s" data-wow-delay=".9s">
                    <div class="tp-footer-widget">
                        <h4 class="tp-footer-widget-title">Redes Sociales</h4>
                        <div class="tp-footer-widget-menu">
                            <ul class="icon">
                                @if (setting('site.facebook'))
                                    <li><a href="{{setting('site.facebook')}}" target="_blank"><i class="fab fa-facebook"></i>Facebook</a></li>
                                @endif
                                @if (setting('site.youtube'))
                                    <li><a href="{{setting('site.youtube')}}" target="_blank"><i class="fab fa-youtube"></i>YouTube</a></li>
                                @endif
                                @if (setting('site.instagram'))
                                    <li><a href="{{setting('site.instagram')}}" target="_blank"><i class="fab fa-instagram"></i>Instagram</a></li>
                                @endif
                                @if (setting('site.twitter'))
                                    <li><a href="{{setting('site.twitter')}}" target="_blank"><i class="fab fa-twitter"></i>Twitter</a></li>
                                @endif
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

</footer>