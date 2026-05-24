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
}