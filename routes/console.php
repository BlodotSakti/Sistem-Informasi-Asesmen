<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('backup:clean')->daily()->at('01:30');

Schedule::call(function () {
    $activeTahunAjaran = \App\Models\TahunAjaran::where('is_aktif', true)->first();
    if ($activeTahunAjaran) {
        $namaTA = str_replace('/', '-', $activeTahunAjaran->nama_tahun_ajaran);
        $semester = ucfirst($activeTahunAjaran->semester);
        $prefix = "TA-{$namaTA}-Semester-{$semester}_";
        config(['backup.backup.destination.filename_prefix' => $prefix]);
    }
    \Illuminate\Support\Facades\Artisan::call('backup:run');
})->daily()->at('02:00')->name('backup_daily_with_prefix');
