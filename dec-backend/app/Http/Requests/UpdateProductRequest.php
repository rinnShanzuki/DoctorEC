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
            'category' => 'sometimes|string|in:Eyeglasses,Contact Lenses,Sunglasses',
            'brand' => 'nullable|string|max:255',
            'sex' => 'nullable|string|in:Female,Male,Unisex',
            'age' => 'nullable|string|in:Adult,Teens,Kids',
            'price' => 'sometimes|numeric|min:0',
            'description' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'stock' => 'sometimes|integer|min:0',
            'shape' => 'nullable|string|in:Rectangular,Square,Round,Oval,Aviator,Cat-eye,Wayfarer,Geometric,Browline,Rimless,Semi-Rimless',
            'features' => 'nullable|string|max:255',
            'frame_color' => 'nullable|string|max:255',
            'tint' => 'nullable|string|max:255',
            'grade_info' => 'nullable|string|max:255',
        ];
    }
}
