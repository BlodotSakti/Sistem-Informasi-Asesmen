<?php

namespace App\Http\Controllers;

use App\Models\Pengguna;

class PenggunaController extends CrudController
{
    protected function modelClass(): string
    {
        return Pengguna::class;
    }

    protected function validationRules(?int $ignoreId = null): array
    {
        return [
            'username' => ['required', 'string', 'max:255', ...$this->uniqueRule('pengguna', 'username', $ignoreId, 'id_pengguna')],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', 'in:admin,guru,siswa'],
        ];
    }
}