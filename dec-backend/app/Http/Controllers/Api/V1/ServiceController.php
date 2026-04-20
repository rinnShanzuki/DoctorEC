<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Service;
use App\Traits\ApiResponses;
use App\Events\ServiceUpdated;
use App\Services\EmailService;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    use ApiResponses;

    /**
     * Get all services (simple version for POS)
     * Optimized query
     */
    public function index()
    {
        try {
            $services = Service::select('service_id', 'name', 'description', 'price', 'created_at', 'updated_at')
                ->orderBy('created_at', 'desc')
                ->get();

            // Transform for frontend compatibility
            $services = $services->map(function ($service) {
                return [
                    'id' => $service->service_id,
                    'service_id' => $service->service_id,
                    'name' => $service->name,
                    'description' => $service->description,
                    'price' => $service->price,
                    'created_at' => $service->created_at,
                    'updated_at' => $service->updated_at,
                ];
            });

            return $this->success($services, 'Services retrieved successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to retrieve services: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get all services with monthly appointment stats
     * Optimized to avoid N+1 query problem
     */
    public function indexWithStats()
    {
        try {
            $currentMonth = now()->month;
            $currentYear = now()->year;

            // Use subqueries for aggregations instead of N+1 queries
            $services = Service::select('services.*')
                ->selectRaw('(
                    SELECT COUNT(*) 
                    FROM appointments a 
                    WHERE a.service_id = services.service_id 
                    AND MONTH(a.appointment_date) = ? 
                    AND YEAR(a.appointment_date) = ?
                    AND a.status IN ("approved", "ongoing", "completed")
                ) as monthly_availed', [$currentMonth, $currentYear])
                ->selectRaw('(
                    SELECT COUNT(*) 
                    FROM appointments a 
                    WHERE a.service_id = services.service_id 
                    AND a.status IN ("approved", "ongoing", "completed")
                ) as total_availed')
                ->orderBy('created_at', 'desc')
                ->get();

            // Transform for frontend
            $services = $services->map(function ($service) {
                return [
                    'id' => $service->service_id,
                    'service_id' => $service->service_id,
                    'name' => $service->name,
                    'description' => $service->description,
                    'price' => $service->price,
                    'monthly_availed' => (int) $service->monthly_availed,
                    'total_availed' => (int) $service->total_availed,
                    'created_at' => $service->created_at,
                    'updated_at' => $service->updated_at,
                ];
            });

            return $this->success($services, 'Services with stats retrieved successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to retrieve services: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Store a new service
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'price' => 'required|numeric|min:0',
            ]);

            $service = Service::create($validated);

            $result = [
                'id' => $service->service_id,
                'service_id' => $service->service_id,
                'name' => $service->name,
                'description' => $service->description,
                'price' => $service->price,
            ];

            event(new ServiceUpdated('created', $result));
            
            // Broadcast notification to all verified clients
            EmailService::sendClinicNotification(
                'New Service Available: ' . $service->name,
                "We have added a new service which you can now book online! <br><br> <strong>Details:</strong> " . ($service->description ?? 'Contact us for more info.') . "<br><strong>Price:</strong> ₱" . number_format($service->price, 2),
                'Book an Appointment',
                rtrim(config('app.url', 'http://localhost:8000'), '/') . (str_contains(config('app.url'), '8000') ? ':5173' : '') . '/appointments'
            );

            return $this->created($result, 'Service created successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to create service: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Update a service
     */
    public function update(Request $request, $id)
    {
        try {
            $service = Service::findOrFail($id);

            $validated = $request->validate([
                'name' => 'sometimes|string|max:255',
                'description' => 'nullable|string',
                'price' => 'sometimes|numeric|min:0',
            ]);

            $service->update($validated);

            $result = [
                'id' => $service->service_id,
                'service_id' => $service->service_id,
                'name' => $service->name,
                'description' => $service->description,
                'price' => $service->price,
            ];

            event(new ServiceUpdated('updated', $result));

            return $this->success($result, 'Service updated successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to update service: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Delete a service
     */
    public function destroy($id)
    {
        try {
            $service = Service::findOrFail($id);
            $serviceId = $service->service_id;
            $service->delete();

            event(new ServiceUpdated('deleted', ['service_id' => $serviceId]));

            return $this->success(null, 'Service deleted successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to delete service: ' . $e->getMessage(), 500);
        }
    }
}
