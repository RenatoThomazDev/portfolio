<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PortfolioController;

Route::get('/', [PortfolioController::class, 'index'])->name('home');
Route::get('/sobre', [PortfolioController::class, 'sobre'])->name('sobre');
Route::get('/projetos', [PortfolioController::class, 'projetos'])->name('projetos');
