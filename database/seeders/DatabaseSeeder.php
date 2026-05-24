<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $accounts = [
            [
                'username' => 'admin',
                'role' => 'admin',
                'profile' => [
                    'relation' => 'admin',
                    'attributes' => [
                        'nama_lengkap' => 'Administrator Sekolah',
                    ],
                ],
            ],
            [
                'username' => 'guru01',
                'role' => 'guru',
                'profile' => [
                    'relation' => 'guru',
                    'attributes' => [
                        'nama_lengkap' => 'Guru Uji Coba',
                        'nip' => '198812312026010001',
                    ],
                ],
            ],
            [
                'username' => 'siswa01',
                'role' => 'siswa',
                'profile' => [
                    'relation' => 'siswa',
                    'attributes' => [
                        'nama_lengkap' => 'Siswa Uji Coba',
                        'nisn' => '0012345678',
                    ],
                ],
            ],
        ];

        foreach ($accounts as $account) {
            $user = User::updateOrCreate(
                ['username' => $account['username']],
                [
                    'password' => 'password',
                    'role' => $account['role'],
                ],
            );

            $relation = $account['profile']['relation'];
            $user->{$relation}()->updateOrCreate(
                ['id_pengguna' => $user->id_pengguna],
                $account['profile']['attributes'],
            );
        }
    }
}
