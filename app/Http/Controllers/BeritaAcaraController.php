<?php

namespace App\Http\Controllers;

use App\Models\BeritaAcara;

class BeritaAcaraController extends CrudController
{
    protected function modelClass(): string
    {
        return BeritaAcara::class;
    }

    protected function validationRules(?int $ignoreId = null): array
    {
        return [
            'id_kelas' => ['required', 'integer', 'exists:kelas,id_kelas'],
            'id_guru' => ['required', 'integer', 'exists:guru,id_guru'],
            'pertemuan_ke' => ['required', 'integer', 'min:1'],
            'tanggal' => ['required', 'date'],
            'materi_bahasan' => ['required', 'string', 'max:255'],
            'catatan_kelas' => ['required', 'string'],
        ];
    }
}