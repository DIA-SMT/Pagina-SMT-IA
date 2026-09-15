@extends('layouts.app')

@section('jsheader')

@stop


@section('content')
    @if (count($sliders))
        <div class="tp-slider-area">
            <div class="tp-slider-wrapper p-relative">
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
    @endif
    <div class="container">
        <div class="py-5 pt-3">
            {{-- <h5 class="text-feria">Red de Emprendedores, Artesanos y Gastronómicos: Ferias de la Municipalidad de San Miguel
                de Tucumán</h5> --}}
            <p class="bajada-feria">La Municipalidad de San Miguel de Tucumán, a través de su compromiso con el desarrollo local, ha impulsado la creación de <strong>Mi Feria Digital</strong>, una iniciativa que busca ofrecer un espacio de visibilidad y apoyo para los emprendedores de la ciudad.</p>

            <p class="bajada-feria">Las <strong>ferias</strong> organizadas por la municipalidad se han convertido en un punto de encuentro para cientos de emprendedores, artesanos y cocineros locales, quienes exponen sus productos y servicios en un ambiente que favorece el intercambio comercial y cultural. Desde creaciones artesanales, hasta innovadoras propuestas gastronómicas, las ferias se presentan como una plataforma para que los emprendedores den a conocer sus proyectos, mientras que los vecinos de San Miguel de Tucumán disfrutan de una amplia variedad de productos de calidad, hechos a mano y con identidad local.</p>

            <p class="bajada-feria">Gracias a esta iniciativa, el municipio de San Miguel de Tucumán no solo apoya a los emprendedores y productores locales, sino que también contribuye al dinamismo económico de la ciudad, consolidándose como un referente de la creatividad, la innovación y el trabajo conjunto, con el objetivo de hacer de San Miguel de Tucumán una ciudad más prospera.</p>

            <p class="bajada-feria">La Municipalidad de San Miguel de Tucumán presenta <strong>Mi Feria Digital</strong>, una plataforma virtual pensada para impulsar a los emprendedores y artesanos locales. Esta herramienta les permitirá exhibir y vender sus productos, llegando a más personas de manera accesible y eficiente.</p>

        </div>
        <div id="filtros">
            <div class="row">
                <div class="col-md-3">
                    <form method="GET" action="{{ route('catalogo.emprendedores') }}">
                        <div>
                            <p class="titulo-filtro">Filtros y Buscador</p>
                            <hr>
                        </div>
                        <div class="mb-2">
                            <label for="">Buscar por Emprendimiento</label>
                            <input class="form-control input-feria" type="text" id="keyemprendimiento"
                                name="keyemprendimiento" value="{{ request('keyemprendimiento') }}">
                        </div>
                        <div class="mb-2">
                            <label for="">Buscar por Producto</label>
                            <input class="form-control input-feria" type="text" id="keyproducto" name="keyproducto"
                                value="{{ request('keyproducto') }}">
                        </div>
                         
                        <div class="w-100 mb-2">
                            <label>Filtrar por Ferias</label>
                            <select name="feria" id="feria" class="w-100 mb-2">
                                <option value="" hidden>Seleccione una Feria</option>
                                <option value="">Todas</option>
                                @foreach ($ferias as $feria)
                                    @if($feria)
                                    <option
                                        value="{{ $feria->id_feria }}"{{ request('feria') == $feria->id_feria ? 'selected' : '' }}>{{$feria->adicional}} 
                                        {{ $feria->feria }}</option>
                                    @endif
                                @endforeach
                            </select>
                        </div>
                        <div class="w-100 mb-2">
                            <label>Filtrar por Rubros</label>
                            <select class="select-big w-100 mb-2" name="rubro" id="rubroSelect">
                                <option value="" hidden>Seleccione un Rubro</option>
                                <option value="">Todas</option>
                                @foreach ($rubros as $rubro)
                                    <option value="{{ $rubro->id_rubro }}"
                                        {{ request('rubro') == $rubro->id_rubro ? 'selected' : '' }}>
                                        {{ $rubro->rubro }}
                                    </option>
                                @endforeach
                            </select>
                        </div>
                        <div class="w-100 mb-2" id="productoContainer">

                        </div>
                        <div class="py-3">
                            <button type="submit" class="btn btn-primary mb-2 w-100 btn-filtros">Aplicar</button>
                            <a href="{{ route('catalogo.emprendedores') }}"
                                class="btn btn-secondary w-100 btn-filtros">Eliminar Filtros</a>
                        </div>
                    </form>
                </div>
                <div class="col-md-9">
                    <div class="row w-100 mx-auto">
                        @forelse ($emprendimiento as $item)
                            <div class="col-md-4 mb-4">
                                @if (request('producto') || request('keyproducto'))
                                    @php
                                        $producto = $item->productos->first();
                                        $galeria = $producto->galeria->firstWhere(
                                            'emprendimiento_id',
                                            $item->id_emprendimiento,
                                        );
                                    @endphp
                                    <a href="/emprendimiento/{{ $item->id_emprendimiento }}/{{ $producto->producto }}">
                                        <div class="card">
                                            <div class="w-100">
                                                @if ($galeria)
                                                    <div class="position-relative">
                                                        <img class="img-card-feria" src="/storage/{{ $galeria->imagen }}"
                                                            alt="{{ $producto->producto }}">
                                                        <div class="title-text">
                                                            <p>{{ $item->nombre_empre }}</p>
                                                        </div>
                                                    </div>
                                                @else
                                                    <div class="card-feria-title">
                                                        <div class="title-text">
                                                            <p>{{ $item->nombre_empre }}</p>
                                                        </div>
                                                    </div>
                                                @endif
                                            </div>
                                            <div class="card-body body-feria">
                                                @if ($item->productos->isNotEmpty() && $item->productos->first()->producto)
                                                    <p>
                                                        {{ $item->productos->first()->producto }}
                                                    </p>
                                                @endif
                                                <p><i class="fa-solid fa-location-dot"></i>
                                                    @if ($item->feria->feria)
                                                        {{$item->adicional->adicional}} {{$item->feria->feria}}
                                                    @else
                                                        -
                                                    @endif
                                                </p>
                                            </div>
                                        </div>
                                    </a>
                                @elseif($item)
                                    <a href="/emprendimiento/{{ $item->id_emprendimiento }}">
                                        <div class="card">
                                            <div class="w-100">
                                                @if ($item->logo && $item->logo->logo)
                                                    <div class="position-relative">
                                                        <img class="img-card-feria" src="/storage/{{ $item->logo->logo }}"
                                                            alt="">
                                                        <div class="title-text">
                                                            <p>{{ $item->nombre_empre }}</p>
                                                        </div>
                                                    </div>
                                                @else
                                                    <div class="card-feria-title">
                                                        <div class="title-text">
                                                            <p>{{ $item->nombre_empre }}</p>
                                                        </div>
                                                    </div>
                                                @endif
                                            </div>
                                            <div class="card-body body-feria">
                                                @if ($item->emprendedor)
                                                    <p><i class="fa-solid fa-user"></i> {{ $item->emprendedor->apellido }}
                                                        {{ $item->emprendedor->nombre }}</p>
                                                @else
                                                    <p><i class="fa-solid fa-user"></i> - </p>
                                                @endif
                                                <p><i class="fa-solid fa-location-dot"></i>
                                                    @if ($item && $item->feria->feria)
                                                        <?php 
                                                        ?>
                                                        {{($item->adicional)?$item->adicional->adicional:'n/n'}} {{$item->feria->feria}}
                                                    @else
                                                        -
                                                    @endif
                                                </p>
                                            </div>
                                        </div>
                                    </a>
                                @endif
                            </div>
                        @empty
                            <p>No se encontraron emprendimientos con los filtros aplicados.</p>
                        @endforelse
                    </div>
                    @if ($hayFiltros && $emprendimiento instanceof \Illuminate\Pagination\LengthAwarePaginator)
                        <div class="pagination-wrapper">
                            {{ $emprendimiento->appends(request()->except('page'))->links() }}
                        </div>
                    @endif
                </div>
            </div>
        </div>
    </div>
@endsection

@section('jsfooter')
    <script>
        $(document).ready(function() {
            const selectedRubroId = "{{ request('rubro') }}";
            const selectedProductoId =
                "{{ request('producto') }}";

            $('#rubroSelect').niceSelect(); // Inicializar Nice Select

            // Si hay un rubro seleccionado al cargar la página
            if (selectedRubroId) {
                loadProductos(selectedRubroId, selectedProductoId);
            }

            $('#rubroSelect').on('change', function() {
                const rubroId = $(this).val();
                $('#productoContainer').html('');
                if (rubroId) {
                    loadProductos(rubroId, null); // Cargar productos con rubro seleccionado
                }
            });

            function loadProductos(rubroId, selectedProductoId) {
                fetch(`/feria/productos/${rubroId}`)
                    .then(response => response.json())
                    .then(data => {
                        const productoContainer = $('#productoContainer');
                        productoContainer.html('');

                        if (data.length > 0) {
                            const selectHTML = `
                            <label>Filtrar por Productos</label>
                            <select class="select-big mb-2" name="producto" id="productoSelect">
                                <option value="" hidden>Seleccione un Producto</option>
                                ${data.map(producto => `
                                                                                    <option value="${producto.id_producto}" 
                                                                                            ${producto.id_producto == selectedProductoId ? 'selected' : ''}>
                                                                                        ${producto.producto}
                                                                                    </option>
                                                                                `).join('')}
                            </select>
                        `;
                            productoContainer.html(selectHTML);
                            $('#productoSelect').niceSelect();
                        } else {
                            productoContainer.html('<p>No hay productos disponibles para este rubro.</p>');
                        }
                    })
                    .catch(error => console.error('Error al cargar productos:', error));
            }
        });
    </script>


@append
