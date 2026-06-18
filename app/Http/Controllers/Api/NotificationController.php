<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Apresiasi;
use App\Models\CatatanPrivat;
use App\Models\SesiAsesmen;
use Carbon\Carbon;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $siswa = $request->user()->siswa;
        if (!$siswa) {
            return response()->json([], 200);
        }

        $idSiswa = $siswa->id_siswa;
        $idKelas = $siswa->kelasAktifAssignment?->id_kelas;

        $notifications = collect();

        // 1. Apresiasi (Badges)
        $apresiasi = Apresiasi::query()
            ->with('guru')
            ->where('id_siswa', $idSiswa)
            ->latest('tanggal')
            ->take(5)
            ->get();

        foreach ($apresiasi as $item) {
            $namaGuru = $item->guru?->nama_lengkap ?? 'Guru';
            $mapel = $item->topik_materi ? " (" . $item->topik_materi . ")" : ""; // Use topik_materi if mapel relation not direct

            $notifications->push([
                'id' => 'badge_' . $item->id_apresiasi,
                'type' => 'badge',
                'title' => 'Lencana Apresiasi',
                'message' => "Selamat! Guru {$namaGuru}{$mapel} memberimu lencana {$item->jenis_badge}",
                'icon_data' => $item->jenis_badge,
                'timestamp' => Carbon::parse($item->tanggal ?? $item->created_at)->toIso8601String(),
                'created_at' => Carbon::parse($item->tanggal ?? $item->created_at),
            ]);
        }

        // 2. Catatan Privat
        $catatan = CatatanPrivat::query()
            ->with('guru')
            ->where('id_siswa', $idSiswa)
            ->latest('tanggal')
            ->take(5)
            ->get();

        foreach ($catatan as $item) {
            $namaGuru = $item->guru?->nama_lengkap ?? 'Guru';

            $notifications->push([
                'id' => 'catatan_' . $item->id_catatan,
                'type' => 'catatan',
                'title' => 'Catatan Privat Baru',
                'message' => "Guru {$namaGuru} meninggalkan catatan evaluasi privat untukmu",
                'icon_data' => null,
                'timestamp' => Carbon::parse($item->tanggal ?? $item->created_at)->toIso8601String(),
                'created_at' => Carbon::parse($item->tanggal ?? $item->created_at),
            ]);
        }

        // 3. Ujian/Sesi Asesmen Terdekat (dalam 24 jam ke depan)
        if ($idKelas) {
            $now = now();
            $tomorrow = now()->addHours(24);

            $sesiAsesmen = SesiAsesmen::query()
                ->with('mataPelajaran')
                ->where('id_kelas', $idKelas)
                ->where('waktu_mulai', '>', $now)
                ->where('waktu_mulai', '<=', $tomorrow)
                ->orderBy('waktu_mulai')
                ->get();

            foreach ($sesiAsesmen as $item) {
                $namaMapel = $item->mataPelajaran?->nama_mapel ?? 'Ujian';
                $sisaWaktu = Carbon::parse($item->waktu_mulai)->diffForHumans(['parts' => 2, 'join' => ' ']);

                $notifications->push([
                    'id' => 'ujian_' . $item->id_sesi,
                    'type' => 'ujian',
                    'title' => 'Pengingat Ujian',
                    'message' => "Pengingat: Ujian CBT {$namaMapel} akan segera dimulai dalam {$sisaWaktu}",
                    'icon_data' => null,
                    'timestamp' => Carbon::parse($item->waktu_mulai)->toIso8601String(),
                    'created_at' => Carbon::parse($item->waktu_mulai), // Urutkan seolah-olah terjadi di waktu ujian
                ]);
            }
        }

        // Urutkan notifikasi (terbaru di atas)
        // Kita menggunakan timestamp untuk mengurutkan (ujian yang akan datang mungkin paling "baru" jika menggunakan created_at yang diformat dengan jadwal ujian)
        $sortedNotifications = $notifications->sortByDesc('created_at')->values()->map(function ($item) {
            unset($item['created_at']); // Remove the Carbon instance before sending
            return $item;
        });

        return response()->json($sortedNotifications);
    }
}
