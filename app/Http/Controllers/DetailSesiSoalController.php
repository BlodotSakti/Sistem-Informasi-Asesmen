<?php

namespace App\Http\Controllers;

use App\Models\DetailSesiSoal;

class DetailSesiSoalController extends CrudController
{
    protected function modelClass(): string
    {
        return DetailSesiSoal::class;
    }

    protected function validationRules(?int $ignoreId = null): array
    {
        return [
            'id_sesi' => ['required', 'integer', 'exists:sesi_asesmen,id_sesi'],
            'id_soal' => ['required', 'integer', 'exists:bank_soal,id_soal'],
            'bobot_nilai' => ['required', 'numeric', 'min:0'],
        ];
    }
}