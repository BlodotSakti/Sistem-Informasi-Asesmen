<?php

namespace App\Http\Controllers;

use App\Models\BankSoal;

class BankSoalController extends CrudController
{
    protected function modelClass(): string
    {
        return BankSoal::class;
    }

    protected function validationRules(?int $ignoreId = null): array
    {
        return [
            'id_guru' => ['required', 'integer', 'exists:guru,id_guru'],
            'id_mapel' => ['required', 'integer', 'exists:mata_pelajaran,id_mapel'],
            'isi_soal' => ['required', 'string'],
            'jenis_soal' => ['required', 'in:pilihan_ganda,esai'],
            'kunci_jawaban' => ['required', 'string'],
            'topik_materi' => ['required', 'string', 'max:255'],
            'level_kognitif' => ['required', 'in:C1,C2,C3,C4,C5,C6'],
        ];
    }
}