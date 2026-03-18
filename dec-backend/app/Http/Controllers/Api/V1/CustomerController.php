<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    use ApiResponses;

    /**
     * Get all customers
     */
    public function index()
    {
        try {
            $customers = Customer::orderBy('created_at', 'desc')->get();

            $customers = $customers->map(function ($customer) {
                return [
                    'id' => $customer->customer_id,
                    'customer_id' => $customer->customer_id,
                    'customer_code' => $customer->customer_code,
                    'name' => $customer->name,
                    'first_name' => $customer->first_name,
                    'last_name' => $customer->last_name,
                    'email' => $customer->email,
                    'phone' => $customer->phone,
                    'birthdate' => $customer->birthdate,
                    'created_at' => $customer->created_at,
                ];
            });

            return response()->json($customers);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to retrieve customers: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a single customer with full details + purchase history
     */
    public function show($id)
    {
        try {
            $customer = Customer::with(['salesTransactions.items.product'])
                ->findOrFail($id);

            // Calculate age
            $age = null;
            if ($customer->birthdate) {
                $age = \Carbon\Carbon::parse($customer->birthdate)->age;
            }

            // Map purchases
            $purchases = $customer->salesTransactions->map(function ($transaction) {
                return [
                    'id' => $transaction->st_id,
                    'receipt_number' => $transaction->receipt_number,
                    'total_amount' => $transaction->total_amount,
                    'payment_method' => $transaction->payment_method,
                    'transaction_date' => $transaction->transaction_date,
                    'items' => $transaction->items->map(function ($item) {
                        return [
                            'product_name' => $item->product->name ?? 'Unknown Product',
                            'quantity' => $item->quantity,
                            'unit_price' => $item->unit_price,
                            'subtotal' => $item->subtotal,
                        ];
                    }),
                ];
            });

            // Find linked patient record by name match to retrieve prescriptions
            $customerName = trim($customer->first_name . ' ' . $customer->last_name);
            $patient = \App\Models\Patient::where('first_name', $customer->first_name)
                ->where('last_name', $customer->last_name)
                ->first();

            $prescriptions = [];
            if ($patient) {
                // Get prescriptions directly linked to this patient
                $prescriptions = \App\Models\Prescription::with(['appointment.service'])
                    ->where('patient_id', $patient->patient_id)
                    ->orderBy('created_at', 'desc')
                    ->get()
                    ->map(function ($pres) {
                        return [
                            'id' => $pres->pres_id,
                            'recommendation' => $pres->recommendation,
                            'medical_concern' => $pres->medical_concern,
                            'product_required' => $pres->product_required,

                            // Rx
                            'rx_od_sph' => $pres->rx_od_sph, 'rx_od_add' => $pres->rx_od_add, 'rx_od_va' => $pres->rx_od_va,
                            'rx_os_sph' => $pres->rx_os_sph, 'rx_os_add' => $pres->rx_os_add, 'rx_os_va' => $pres->rx_os_va,

                            // Prescription
                            'px_od_sph' => $pres->px_od_sph, 'px_od_add' => $pres->px_od_add, 'px_od_va' => $pres->px_od_va,
                            'px_os_sph' => $pres->px_os_sph, 'px_os_add' => $pres->px_os_add, 'px_os_va' => $pres->px_os_va,

                            // Lens details
                            'pd' => $pres->pd,
                            'is_spectacle' => $pres->is_spectacle,
                            'is_contact_lens' => $pres->is_contact_lens,
                            'frame' => $pres->frame,
                            'brand' => $pres->brand,
                            'lens' => $pres->lens,
                            'tint' => $pres->tint,

                            // Other
                            'remarks' => $pres->remarks,

                            'service_name' => $pres->appointment && $pres->appointment->service
                                ? $pres->appointment->service->name : null,
                            'appointment_date' => $pres->appointment
                                ? $pres->appointment->appointment_date : null,
                            'created_at' => $pres->created_at,
                        ];
                    })->toArray();
            }

            return $this->success([
                'customer_id' => $customer->customer_id,
                'customer_code' => $customer->customer_code,
                'name' => $customer->name,
                'first_name' => $customer->first_name,
                'last_name' => $customer->last_name,
                'email' => $customer->email,
                'phone' => $customer->phone,
                'birthdate' => $customer->birthdate,
                'age' => $age,
                'gender' => $customer->gender,
                'address' => $customer->address,
                'prescriptions' => $prescriptions,
                'purchases' => $purchases,
            ], 'Customer details retrieved successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to retrieve customer: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Create a new customer
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'first_name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'email' => 'nullable|email|max:255',
                'phone' => 'nullable|string|max:20',
                'birthdate' => 'nullable|date',
                'gender' => 'nullable|in:male,female,other',
                'address' => 'nullable|string',
            ]);

            // Generate unique customer code
            $maxId = Customer::max('customer_id') ?? 0;
            $validated['customer_code'] = 'C' . str_pad($maxId + 1, 6, '0', STR_PAD_LEFT);

            $customer = Customer::create($validated);

            return $this->created([
                'id' => $customer->customer_id,
                'customer_id' => $customer->customer_id,
                'customer_code' => $customer->customer_code,
                'name' => $customer->name,
            ], 'Customer created successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to create customer: ' . $e->getMessage(), 500);
        }
    }
}
