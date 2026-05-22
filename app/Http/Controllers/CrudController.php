<?php

namespace App\Http\Controllers;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

abstract class CrudController extends Controller
{
    abstract protected function modelClass(): string;

    abstract protected function validationRules(?int $ignoreId = null): array;

    protected function perPage(): int
    {
        return 15;
    }

    protected function query()
    {
        $modelClass = $this->modelClass();

        return $modelClass::query();
    }

    protected function makeModel(): Model
    {
        $modelClass = $this->modelClass();

        return new $modelClass();
    }

    public function index(): JsonResponse
    {
        return response()->json($this->query()->latest()->paginate($this->perPage()));
    }

    public function create(): JsonResponse
    {
        return response()->json([
            'message' => 'Gunakan endpoint store untuk membuat data baru.',
            'fields' => array_keys($this->validationRules()),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->validationRules());

        $record = $this->makeModel()->newQuery()->create($data);

        return response()->json([
            'message' => 'Data berhasil disimpan.',
            'data' => $record,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $record = $this->query()->findOrFail($id);

        return response()->json(['data' => $record]);
    }

    public function edit(int $id): JsonResponse
    {
        $record = $this->query()->findOrFail($id);

        return response()->json([
            'message' => 'Gunakan endpoint update untuk menyimpan perubahan.',
            'data' => $record,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $record = $this->query()->findOrFail($id);
        $data = $request->validate($this->validationRules($id));

        $record->update($data);

        return response()->json([
            'message' => 'Data berhasil diperbarui.',
            'data' => $record->fresh(),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $record = $this->query()->findOrFail($id);
        $record->delete();

        return response()->json(null, 204);
    }

    protected function uniqueRule(string $table, string $column, ?int $ignoreId = null, string $primaryKey = 'id'): array
    {
        $rule = Rule::unique($table, $column);

        if ($ignoreId !== null) {
            $rule->ignore($ignoreId, $primaryKey);
        }

        return [$rule];
    }
}