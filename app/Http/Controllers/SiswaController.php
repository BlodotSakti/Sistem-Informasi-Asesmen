<?php

namespace App\Http\Controllers;

use App\Models\Siswa;

class SiswaController extends CrudController
{
    protected function modelClass(): string
    {
        return Siswa::class;
    }

    protected function validationRules(?int $ignoreId = null): array
    {
        return [
            'id_pengguna' => ['required', 'integer', 'exists:pengguna,id_pengguna'],
            'nama_lengkap' => ['required', 'string', 'max:255'],
            'nisn' => ['required', 'string', 'max:30', ...$this->uniqueRule('siswa', 'nisn', $ignoreId, 'id_siswa')],
        ];
    }
}