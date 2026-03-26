<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'category' => 'required|string|in:Eyeglasses,Contact Lenses,Sunglasses',
            'brand' => 'nullable|string|max:255',
            'sex' => 'nullable|string|in:Female,Male,Unisex',
            'age' => 'nullable|string|in:Adult,Teens,Kids',
            'price' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'stock' => 'required|integer|min:0',
            'shape' => 'nullable|string|in:Rectangular,Square,Round,Oval,Aviator,Cat-eye,Wayfarer,Geometric,Browline,Rimless,Semi-Rimless',
            'features' => 'nullable|string|max:255',
            'frame_color' => 'nullable|string|max:255',
            'tint' => 'nullable|string|max:255',
            'grade_info' => 'nullable|string|max:255',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Product name is required',
            'category.required' => 'Category is required',
            'price.required' => 'Price is required',
            'price.numeric' => 'Price must be a number',
            'stock.required' => 'Stock quantity is required',
            'stock.integer' => 'Stock must be a whole number',
            'image.image' => 'File must be an image',
            'image.max' => 'Image size cannot exceed 2MB',
        ];
    }
}
