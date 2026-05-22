<?php

namespace App\Http\Controllers;

use App\Models\MataPelajaran;

class MataPelajaranController extends CrudController
{
    protected function modelClass(): string
    {
        return MataPelajaran::class;
    }

    protected function validationRules(?int $ignoreId = null): array
    {
        return [
            'nama_mapel' => ['required', 'string', 'max:255'],
            'tingkat' => ['required', 'string', 'max:50'],
        ];
    }
}