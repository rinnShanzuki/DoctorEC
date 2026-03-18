<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|string|max:255',
            'category' => 'sometimes|string|max:255',
            'price' => 'sometimes|numeric|min:0',
            'description' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'stock' => 'sometimes|integer|min:0',
            'shape' => 'nullable|string|max:255',
            'features' => 'nullable|string|max:255',
            'frame_color' => 'nullable|string|max:255',
            'grade_info' => 'nullable|string|max:255',
            'target_audience' => 'nullable|string|max:255',
        ];
    }
}
