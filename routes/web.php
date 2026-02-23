<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\MesaPartesController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
    ]);
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    
    // Expedientes (solo autenticados)
    Route::get('/expedientes', function () {
        return Inertia::render('Expedientes/Index');
    })->name('expedientes.index');
});

// Mesa de Partes - SIN AUTENTICACIÓN
Route::get('/mesa-partes', [MesaPartesController::class, 'index'])->name('mesa-partes.index');
Route::post('/mesa-partes/solicitud-arbitraje', [MesaPartesController::class, 'storeSolicitudArbitraje'])->name('mesa-partes.solicitud-arbitraje');
Route::post('/mesa-partes/apersonamiento', [MesaPartesController::class, 'storeApersonamiento'])->name('mesa-partes.apersonamiento');
Route::post('/mesa-partes/compress-files', [MesaPartesController::class, 'compressFiles'])->name('mesa-partes.compress-files');

require __DIR__.'/auth.php';