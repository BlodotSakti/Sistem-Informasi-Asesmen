<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pengguna;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $pengguna = Pengguna::query()
            ->with(['admin', 'guru', 'siswa'])
            ->where('username', $credentials['username'])
            ->first();

        if (! $pengguna || ! Hash::check($credentials['password'], $pengguna->password)) {
            return response()->json([
                'message' => 'Username atau password tidak valid.',
            ], 422);
        }

        if (! $pengguna->is_aktif) {
            return response()->json([
                'message' => 'Akun Anda sudah diarsipkan dan tidak dapat login.',
            ], 403);
        }

        $this->loadRoleRelations($pengguna);

        return response()->json([
            'message' => 'Login berhasil.',
            'token_type' => 'Bearer',
            'token' => $pengguna->createToken('react-app')->plainTextToken,
            'user' => $this->payload($pengguna),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $pengguna = $request->user()->load(['admin', 'guru', 'siswa']);

        $this->loadRoleRelations($pengguna);

        return response()->json([
            'data' => $this->payload($pengguna),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Logout berhasil.',
        ]);
    }

    protected function payload(Pengguna $pengguna): array
    {
        $profile = match ($pengguna->role) {
            'admin' => $pengguna->admin,
            'guru' => $pengguna->guru,
            'siswa' => $pengguna->siswa,
            default => null,
        };

        return [
            'id_pengguna' => $pengguna->id_pengguna,
            'username' => $pengguna->username,
            'role' => $pengguna->role,
            'nama_lengkap' => $profile?->nama_lengkap,
            'profile' => $profile,
        ];
    }

    protected function loadRoleRelations(Pengguna $pengguna): void
    {
        if ($pengguna->role === 'siswa') {
            $pengguna->loadMissing([
                'siswa.kelasAktifAssignment.kelas.guruWali',
                'siswa.kelasRiwayat.kelas.guruWali',
            ]);

            return;
        }

        if ($pengguna->role === 'guru') {
            $pengguna->loadMissing([
                'guru.kelasWali',
                'guru.penugasanPembelajaran.kelas',
                'guru.penugasanPembelajaran.mataPelajaran',
            ]);
        }
    }
}