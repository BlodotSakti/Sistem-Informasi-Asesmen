<?php

namespace App\Http\Controllers;

use App\Models\SesiAsesmen;

class SesiAsesmenController extends CrudController
{
    protected function modelClass(): string
    {
        return SesiAsesmen::class;
    }

    protected function validationRules(?int $ignoreId = null): array
    {
        return [
            'id_kelas' => ['required', 'integer', 'exists:kelas,id_kelas'],
            'id_mapel' => ['required', 'integer', 'exists:mata_pelajaran,id_mapel'],
            'tipe_soal' => ['required', 'string', 'max:255'],
            'jenis_asesmen' => ['required', 'in:pretest,posttest,ujian'],
            'waktu_mulai' => ['required', 'date'],
            'durasi_menit' => ['required', 'integer', 'min:1'],
        ];
    }
}