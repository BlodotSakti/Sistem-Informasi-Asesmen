<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAccountActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && ! $user->is_aktif) {
            return response()->json([
                'message' => 'Akun Anda sudah diarsipkan. Hubungi admin untuk akses kembali.',
            ], 403);
        }

        return $next($request);
    }
}