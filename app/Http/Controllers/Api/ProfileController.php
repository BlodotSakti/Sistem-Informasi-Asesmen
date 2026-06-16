<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pengguna;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    public function update(Request $request): JsonResponse
    {
        /** @var Pengguna $user */
        $user = $request->user();

        $data = $request->validate([
            'username' => [
                'required',
                'string',
                Rule::unique('pengguna', 'username')->ignore($user->id_pengguna, 'id_pengguna'),
            ],
            'current_password' => ['required_with:password', 'nullable', 'current_password'],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
        ]);

        $user->username = $data['username'];

        if (!empty($data['password'])) {
            $user->password = Hash::make($data['password']);
        }

        $user->save();

        return response()->json([
            'message' => 'Kredensial akun berhasil diperbarui.',
        ]);
    }
}
