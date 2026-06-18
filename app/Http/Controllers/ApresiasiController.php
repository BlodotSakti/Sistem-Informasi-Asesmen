<?php

namespace App\Http\Controllers;

use App\Models\Apresiasi;

class ApresiasiController extends CrudController
{
    protected function modelClass(): string
    {
        return Apresiasi::class;
    }

    protected function validationRules(?int $ignoreId = null): array
    {
        return [
            'id_guru' => ['required', 'integer', 'exists:guru,id_guru'],
            'id_siswa' => ['required', 'integer', 'exists:siswa,id_siswa'],
            'tanggal' => ['required', 'date'],
            'jenis_badge' => ['required', 'string', 'max:255'],
            'topik_materi' => ['required', 'string', 'max:255'],
        ];
    }
}