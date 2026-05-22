<?php

namespace App\Http\Controllers;

use App\Models\JawabanSiswa;

class JawabanSiswaController extends CrudController
{
    protected function modelClass(): string
    {
        return JawabanSiswa::class;
    }

    protected function validationRules(?int $ignoreId = null): array
    {
        return [
            'id_siswa' => ['required', 'integer', 'exists:siswa,id_siswa'],
            'id_detail' => ['required', 'integer', 'exists:detail_sesi_soal,id_detail'],
            'teks_jawaban' => ['required', 'string'],
            'is_correct' => ['required', 'boolean'],
            'skor_diperoleh' => ['required', 'numeric', 'min:0'],
        ];
    }
}