<?php

namespace App\Http\Controllers;

use App\Models\Admin;

class AdminController extends CrudController
{
    protected function modelClass(): string
    {
        return Admin::class;
    }

    protected function validationRules(?int $ignoreId = null): array
    {
        return [
            'id_pengguna' => ['required', 'integer', 'exists:pengguna,id_pengguna', ...$this->uniqueRule('admin', 'id_pengguna', $ignoreId, 'id_pengguna')],
            'nama_lengkap' => ['required', 'string', 'max:255'],
        ];
    }
}