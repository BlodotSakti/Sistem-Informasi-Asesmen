<?php

namespace App\Http\Controllers;

use App\Models\Guru;

class GuruController extends CrudController
{
    protected function modelClass(): string
    {
        return Guru::class;
    }

    protected function validationRules(?int $ignoreId = null): array
    {
        return [
            'id_pengguna' => ['required', 'integer', 'exists:pengguna,id_pengguna'],
            'nama_lengkap' => ['required', 'string', 'max:255'],
            'nip' => ['required', 'string', 'regex:/^[0-9]+$/', 'max:50', ...$this->uniqueRule('guru', 'nip', $ignoreId, 'id_guru')],
        ];
    }
}