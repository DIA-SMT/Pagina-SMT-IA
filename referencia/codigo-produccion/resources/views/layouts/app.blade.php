<!DOCTYPE html>
<html lang="es-AR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport"   content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
    <meta  name=robots      content="index, follow" >
    <link rel="icon" href="/storage/{{Voyager::setting('site.admin_icon_image')}}">
    <meta name="language" content="es_AR" />

    <link rel="stylesheet" href="{{asset('assets/css/owl.carousel.css')}}">
    <link rel="stylesheet" href="{{asset('assets/css/bootstrap.css')}}">
    <link rel="stylesheet" href="{{asset('assets/css/animate.css')}}">
    <link rel="stylesheet" href="{{asset('assets/css/swiper-bundle.css')}}">
    <link rel="stylesheet" href="{{asset('assets/css/slick.css')}}">
    <link rel="stylesheet" href="{{asset('assets/css/flaticon_statex.css')}}">
    <link rel="stylesheet" href="{{asset('assets/css/magnific-popup.css')}}">
    <link rel="stylesheet" href="{{asset('assets/css/font-awesome-pro.css')}}">
    <link rel="stylesheet" href="{{asset('assets/css/spacing.css')}}">
    <link rel="stylesheet" href="{{asset('assets/css/custom-animation.css')}}">
    <link rel="stylesheet" href="{{asset('assets/css/nivo-lightbox.min.css')}}">
    <link rel="stylesheet" href="{{asset('assets/css/nivo-lightbox-theme.css')}}">
    <link rel="stylesheet" href="{{asset('assets/css/main.css')}}">
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-LJ5M7XKZ0F"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-LJ5M7XKZ0F');
</script>
    
    @yield('jsheader')
 
</head>
<body>
    <main>
        @include('layouts.header')
        @yield('content')
        @include('layouts.footer')
    </main>

   <script src="{{asset('assets/js/vendor/jquery.js')}}"></script>
   <script src="{{asset('assets/js/jquery.min.js')}}"></script>
   <script src="{{asset('assets/js/nivo-lightbox.min.js')}}"></script>
   <script src="{{asset('assets/js/vendor/waypoints.js')}}"></script>
   <script src="{{asset('assets/js/bootstrap-bundle.js')}}"></script>
   <script src="{{asset('assets/js/meanmenu.js')}}"></script>
   <script src="{{asset('assets/js/gsap.min.js')}}"></script>
   <script src="{{asset('assets/js/ScrollTrigger.min.js')}}"></script>
   <script src="{{asset('assets/js/split-text.min.js')}}"></script>
   <script src="{{asset('assets/js/swiper-bundle.js')}}"></script>
   <script src="{{asset('assets/js/slick.js')}}"></script>
   <script src="{{asset('assets/js/range-slider.js')}}"></script>
   <script src="{{asset('assets/js/magnific-popup.js')}}"></script>
   <script src="{{asset('assets/js/nice-select.js')}}"></script>
   <script src="{{asset('assets/js/purecounter.js')}}"></script>
   <script src="{{asset('assets/js/countdown.js')}}"></script>
   <script src="{{asset('assets/js/jequery-knob.js')}}"></script>
   <script src="{{asset('assets/js/jequery-appear.js')}}"></script>
   <script src="{{asset('assets/js/wow.js')}}"></script>
   <script src="{{asset('assets/js/jarallax.js')}}"></script>
   <script src="{{asset('assets/js/isotope-pkgd.js')}}"></script>
   <script src="{{asset('assets/js/imagesloaded-pkgd.js')}}"></script>
   <script src="{{asset('assets/js/ajax-form.js')}}"></script>
   <script src="{{asset('assets/js/owl.carousel.min.js')}}"></script>
   <script src="{{asset('assets/js/main.js')}}"></script>

   

   
    @yield('jsfooter')
</body>
</html>