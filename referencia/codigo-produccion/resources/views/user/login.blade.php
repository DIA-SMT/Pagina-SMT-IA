@extends('layouts.app')
@section('meta')
      <meta  name="title" content=">Tucuman - marketplace de compra venta" >
      <meta  name="description" content="Tucuman - el portal de compra venta de todos los tucumanos">
      <meta  property=og:locale content="es_ar" >
      <meta  property=og:description content="La experiencia de tener una tienda digital" >
      <meta  property=og:site_name content="ventastucuman.com" >
      <meta property="og:title" content=">Tucuman - marketplace de compra venta"/>
      <title>Tucuman - marketplace de compra venta - Ingreso al sistema</title>
  @stop
@section('content')

<section class="py-6" style="min-height: 100vh;">
    <div class="container">
        <div class="row">
            <div class="col-12 col-lg-12">
                <h2 class="text-center mb-5">Ingresar</h2>
            </div>
            <div class="col-12 m-auto col-lg-9">
                <div class="row g-3">
                    <div class="col-12 col-lg-6  p-5">
                        <div class="row">
                            <div class="col-12 mb-3">
                                <h3 class="lead">Ingresar con tu cuenta de:</h3>
                            </div>
                            <div class="col-6">
                                <a href="{{url('/auth/facebook')}}" class="d-block btn btn-blue"><i class="fab fa-facebook-square"></i> Facebook</a>
                            </div>
                            <div class="col-6">
                                <a href="{{url('/auth/google')}}" class="d-block btn btn-red text-white"><i class="fab fa-google-plus-g"></i> Google+</a>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-12 col-lg-6 p-5">
                        <div class="col-12 mb-3">
                            <h3 class="lead">Ingresar con tu email y contraseña</h3>
                        </div>
                        <form action="/auth/login" method="post">
                          <input type="hidden" name="_token" value="{{ csrf_token() }}"></input>
                          <div class="col-12 mb-3">
                              <div class="form-floating">
                                  <input type="email" name="email" class="form-control" id="input_email" placeholder="Ejemplo" value="{{old("email")}}">
                                  <label for="input_email">E-mail</label>
                              </div>
                              @error('email')
                                  <span class="invalid-feedback" role="alert">
                                      <strong>{{ $message }}</strong>
                                  </span>
                              @enderror
                          </div>
                          <div class="col-12 mb-3">
                              <div class="form-floating">
                                  <input type="password" name="password" class="form-control" id="input_pass" placeholder="Ejemplo">
                                  <label for="input_pass">Contraseña</label>
                              </div>
                              @error('password')
                                  <span class="invalid-feedback " role="alert">
                                      <strong>{{ $message }}</strong>
                                  </span>
                              @enderror
                          </div>
                          <div class="col-12">
                              <div class="d-flex g-2 justify-content-center">
                                  <button class="btn btn-primary w-50">Ingresar</button>
                              </div>
                          </div>
                        </form>
                        <div class="col-12">
                            <div class="d-flex flex-column align-items-center">
                                <a href="{{ route('password.request') }}" class="section__link section__link--secondary">Olvidé mi Contraseña</a>
                                <a href="/auth/user/register" class="section__link section__link--secondary">Registrarme</a>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    </div>
</section>
 

@endsection