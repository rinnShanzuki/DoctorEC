<?php

namespace App\Traits;

trait ApiResponses
{
    /**
     * Success response
     * @param mixed $data
     * @param string|null $message
     * @param int $code
     * @return \Illuminate\Http\JsonResponse
     */
    protected function success($data, $message = null, $code = 200)
    {
        return response()->json([
            'status' => 'success',
            'message' => $message,
            'data' => $data
        ], $code);
    }

    /**
     * Created response
     * @param mixed $data
     * @param string|null $message
     * @return \Illuminate\Http\JsonResponse
     */
    protected function created($data, $message = null)
    {
        return response()->json([
            'status' => 'success',
            'message' => $message ?? 'Resource created successfully',
            'data' => $data
        ], 201);
    }

    /**
     * Error response
     * @param string $message
     * @param int $code
     * @return \Illuminate\Http\JsonResponse
     */
    protected function error($message, $code = 400)
    {
        return response()->json([
            'status' => 'error',
            'message' => $message
        ], $code);
    }

    /**
     * Unauthorized response
     * @param string $message
     * @return \Illuminate\Http\JsonResponse
     */
    protected function unauthorized($message = 'Unauthorized')
    {
        return response()->json([
            'status' => 'error',
            'message' => $message
        ], 401);
    }

    /**
     * Forbidden response
     * @param string $message
     * @return \Illuminate\Http\JsonResponse
     */
    protected function forbidden($message = 'Forbidden')
    {
        return response()->json([
            'status' => 'error',
            'message' => $message
        ], 403);
    }

    /**
     * Not found response
     * @param string $message
     * @return \Illuminate\Http\JsonResponse
     */
    protected function notFound($message = 'Resource not found')
    {
        return response()->json([
            'status' => 'error',
            'message' => $message
        ], 404);
    }

    /**
     * Validation error response
     * @param array $errors
     * @param string $message
     * @return \Illuminate\Http\JsonResponse
     */
    protected function validationError($errors, $message = 'Validation failed')
    {
        return response()->json([
            'status' => 'error',
            'message' => $message,
            'errors' => $errors
        ], 422);
    }
}
