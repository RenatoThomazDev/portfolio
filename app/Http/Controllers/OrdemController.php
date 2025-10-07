<?php

namespace App\Http\Controllers;

use App\Models\Ordem;
use Illuminate\Http\Request;

class OrdemController extends Controller
{
    public function index()
    {
        $ordens = Ordem::all();
        return view('ordens.index', compact('ordens'));
    }

    public function create()
    {
        return view('ordens.create');
    }

    public function store(Request $request)
    {
        Ordem::create($request->all());
        return redirect()->route('ordens.index');
    }

    public function destroy(Ordem $ordem)
    {
        $ordem->delete();
        return redirect()->route('ordens.index');
    }
}
