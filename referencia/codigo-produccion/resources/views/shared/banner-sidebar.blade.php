<div class="col-lg-3 sub-col-banner">
@include('shared.visitas')

    <div class="row d-flex justify-content-center">
        @if ($sidebarBanner && $sidebarBanner->count() > 0)
            @foreach ($sidebarBanner as $bannerSidebar)
                @php
                    $target = $bannerSidebar->target ? '' : '_blank';
                @endphp
                <div class="col-10 mb-20">
                    <a href="{{$bannerSidebar->link}}" target="{{$target}}">
                        <img src="/storage/{{ $bannerSidebar->image }}" alt="{{ $bannerSidebar->name }}">
                    </a>
                </div>
            @endforeach
        @endif

    </div>
</div>
