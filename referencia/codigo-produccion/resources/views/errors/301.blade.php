@extends('layouts.app')

@section('content')
<?php 
	$phones = DB::table('emergency_phones')->select('name','phone')->get();
?>

<div class="container b-white contop">
	<div class="error text-center">
		<h1>ERROR 301</h1>
		<div class="text-center"><i class="fa fa-meh-o"></i></div>
		<p>Ha ocurrió un error interno a la brevedad lo resolveremos.</p>
	</div>
</div>

@endsection