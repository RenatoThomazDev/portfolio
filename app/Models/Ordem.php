<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;


class Ordem extends Model
{
    protected $fillable = ['cliente', 'descricao', 'valor', 'status'];
}
