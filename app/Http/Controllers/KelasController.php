<?php

namespace App\Http\Controllers;

use App\Models\Kelas;

class KelasController extends CrudController
{
    protected function modelClass(): string
    {
        return Kelas::class;
    }

    protected function validationRules(?int $ignoreId = null): array
    {
        return [
            'id_guru_wali' => ['required', 'integer', 'exists:guru,id_guru'],
            'nama_kelas' => ['required', 'string', 'max:100'],
            'tahun_ajaran' => ['required', 'string', 'max:20'],
        ];
    }
}