<?php

namespace App\Http\Controllers;

use App\Models\AnalisisDiagnostik;

class AnalisisDiagnostikController extends CrudController
{
    protected function modelClass(): string
    {
        return AnalisisDiagnostik::class;
    }

    protected function validationRules(?int $ignoreId = null): array
    {
        return [
            'id_siswa' => ['required', 'integer', 'exists:siswa,id_siswa'],
            'id_sesi' => ['required', 'integer', 'exists:sesi_asesmen,id_sesi'],
            'skor_total' => ['required', 'numeric', 'min:0'],
            'narasi_kekuatan' => ['required', 'string'],
            'narasi_kelemahan' => ['required', 'string'],
            'tanggal_generate' => ['required', 'date'],
        ];
    }
}