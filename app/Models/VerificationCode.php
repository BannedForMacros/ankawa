<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VerificationCode extends Model
{
    protected $fillable = ['email', 'codigo', 'expires_at', 'usado'];

    protected $casts = [
        'expires_at' => 'datetime',
        'usado'      => 'boolean',
    ];

    public function esValido(): bool
    {
        return !$this->usado && $this->expires_at->isFuture();
    }
}