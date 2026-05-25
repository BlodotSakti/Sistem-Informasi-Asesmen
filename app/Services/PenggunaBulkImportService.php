<?php

namespace App\Services;

use App\Models\Guru;
use App\Models\Pengguna;
use App\Models\Siswa;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\IOFactory;
use RuntimeException;

class PenggunaBulkImportService
{
    public const DEFAULT_PASSWORD = 'SIA@12345';

    public function import(UploadedFile $file, ?string $defaultRole = null): array
    {
        $spreadsheet = IOFactory::load($file->getRealPath());
        $sheet = $spreadsheet->getActiveSheet();
        $rows = $sheet->toArray(null, true, true, true);

        if ($rows === []) {
            throw new RuntimeException('File import tidak memiliki data.');
        }

        $headerRow = array_shift($rows);
        $headers = [];

        foreach ($headerRow as $column => $value) {
            $headers[$column] = Str::snake(Str::lower(trim((string) $value)));
        }

        $summary = [
            'created' => 0,
            'updated' => 0,
            'skipped' => 0,
            'skipped_rows' => [],
        ];

        DB::transaction(function () use ($rows, $headers, $defaultRole, &$summary): void {
            foreach ($rows as $rowNumber => $row) {
                $rowData = $this->normalizeRow($row, $headers);
                $role = Str::lower($rowData['role'] ?? $defaultRole ?? '');
                $namaLengkap = trim((string) ($rowData['nama_lengkap'] ?? $rowData['nama'] ?? $rowData['name'] ?? ''));

                if (! in_array($role, ['guru', 'siswa'], true)) {
                    $summary['skipped']++;
                    $summary['skipped_rows'][] = [
                        'row' => $rowNumber + 2,
                        'reason' => 'Role harus guru atau siswa.',
                    ];

                    continue;
                }

                $identifier = $role === 'guru'
                    ? trim((string) ($rowData['nip'] ?? $rowData['username'] ?? ''))
                    : trim((string) ($rowData['nisn'] ?? $rowData['username'] ?? ''));

                if ($namaLengkap === '' || $identifier === '') {
                    $summary['skipped']++;
                    $summary['skipped_rows'][] = [
                        'row' => $rowNumber + 2,
                        'reason' => 'Nama lengkap dan nomor identitas wajib diisi.',
                    ];

                    continue;
                }

                if ($this->identifierAlreadyExists($role, $identifier)) {
                    $summary['skipped']++;
                    $summary['skipped_rows'][] = [
                        'row' => $rowNumber + 2,
                        'reason' => strtoupper($role) . ' dengan NIP/NISN tersebut sudah ada di sistem.',
                    ];

                    continue;
                }

                $pengguna = Pengguna::query()->create([
                    'username' => $identifier,
                    'password' => self::DEFAULT_PASSWORD,
                    'role' => $role,
                ]);

                if ($role === 'guru') {
                    Guru::query()->create([
                        'id_pengguna' => $pengguna->id_pengguna,
                        'nama_lengkap' => $namaLengkap,
                        'nip' => $identifier,
                    ]);
                } else {
                    Siswa::query()->create([
                        'id_pengguna' => $pengguna->id_pengguna,
                        'nama_lengkap' => $namaLengkap,
                        'nisn' => $identifier,
                    ]);
                }

                $summary['created']++;
            }
        });

        return [
            ...$summary,
            'default_password' => self::DEFAULT_PASSWORD,
        ];
    }

    protected function identifierAlreadyExists(string $role, string $identifier): bool
    {
        if (Pengguna::query()->where('username', $identifier)->exists()) {
            return true;
        }

        return $role === 'guru'
            ? Guru::query()->where('nip', $identifier)->exists()
            : Siswa::query()->where('nisn', $identifier)->exists();
    }

    protected function normalizeRow(array $row, array $headers): array
    {
        $normalized = [];

        foreach ($headers as $column => $header) {
            $normalized[$header] = trim((string) ($row[$column] ?? ''));
        }

        return $normalized;
    }
}