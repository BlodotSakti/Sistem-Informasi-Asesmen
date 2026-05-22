<?php

namespace App\Http\Controllers;

use App\Models\CatatanPrivat;

class CatatanPrivatController extends CrudController
{
    protected function modelClass(): string
    {
        return CatatanPrivat::class;
    }

    protected function validationRules(?int $ignoreId = null): array
    {
        return [
            'id_guru' => ['required', 'integer', 'exists:guru,id_guru'],
            'id_siswa' => ['required', 'integer', 'exists:siswa,id_siswa'],
            'tanggal' => ['required', 'date'],
            'isi_pesan' => ['required', 'string'],
        ];
    }
}