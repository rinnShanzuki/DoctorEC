<?php

namespace App\Http\Controllers;

use App\Models\ProductReservation;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ProductReservationController extends Controller
{
    /**
     * Get reservations for the authenticated client
     */
    public function getClientReservations(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Unauthenticated'
                ], 401);
            }

            // Fetch reservations with product details
            $reservations = ProductReservation::with(['product'])
                ->where('client_id', $user->client_id)
                ->orderBy('created_at', 'desc')
                ->get();

            // Transform data for frontend
            $reservations = $reservations->map(function ($reservation) {
                return [
                    'id' => $reservation->prodres_id,
                    'product' => $reservation->product->name ?? 'Unknown Product',
                    'image' => $reservation->product->image 
                        ? url('storage/' . $reservation->product->image) 
                        : 'https://via.placeholder.com/100',
                    'quantity' => 1, // Default quantity, can be enhanced later
                    'price' => $reservation->product->price ?? 0,
                    'pickup_date' => $reservation->pickup_date,
                    'payment_mode' => $reservation->payment_mode,
                    'date' => $reservation->created_at->format('Y-m-d'),
                    'status' => $reservation->status,
                    'message' => $reservation->message,
                    'product_details' => [
                        'category' => $reservation->product->category ?? '',
                        'description' => $reservation->product->description ?? '',
                        'stock' => $reservation->product->stock ?? 0,
                    ]
                ];
            });

            return response()->json([
                'status' => 'success',
                'data' => $reservations
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve reservations: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display a listing of the resource (Admin).
     */
    public function index()
    {
        try {
            // Fetch all reservations with relationships
            $reservations = ProductReservation::with(['client', 'product'])
                ->orderBy('created_at', 'desc')
                ->get();

            // Transform data for frontend
            $reservations = $reservations->map(function ($reservation) {
                // Get client information
                $clientAccount = \App\Models\ClientAccount::find($reservation->client_id);
                
                return [
                    'id' => $reservation->prodres_id,
                    'user' => [
                        'name' => $clientAccount ? trim(($clientAccount->first_name ?? '') . ' ' . ($clientAccount->last_name ?? '')) : 'Unknown',
                        'email' => $clientAccount->email ?? 'N/A'
                    ],
                    'product' => [
                        'name' => $reservation->product->name ?? 'Unknown Product',
                        'price' => $reservation->product->price ?? 0
                    ],
                    'quantity' => $reservation->quantity ?? 1,
                    'pickup_date' => $reservation->pickup_date,
                    'payment_mode' => $reservation->payment_mode,
                    'status' => $reservation->status,
                    'message' => $reservation->message,
                    'created_at' => $reservation->created_at->toISOString(),
                ];
            });

            return response()->json($reservations, 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve reservations: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json(['status' => 'error', 'message' => 'Unauthenticated'], 401);
            }

            $validated = $request->validate([
                'product_id' => 'required|exists:products,product_id',
                'pickup_date' => 'required|date|after_or_equal:today',
                'payment_mode' => 'required|in:Cash,GCash,Credit Card,Debit Card',
                'message' => 'nullable|string|max:500'
            ]);

            // Check if product has stock
            $product = \App\Models\Product::findOrFail($validated['product_id']);
            if ($product->stock <= 0) {
                return response()->json(['status' => 'error', 'message' => 'Product is out of stock'], 400);
            }

            // Create reservation
            $reservation = ProductReservation::create([
                'client_id' => $user->client_id,
                'product_id' => $validated['product_id'],
                'pickup_date' => $validated['pickup_date'],
                'payment_mode' => $validated['payment_mode'],
                'message' => $validated['message'] ?? null,
                'status' => 'Pending'
            ]);

            // Optional: Decrease stock or mark as reserved? 
            // For now, we'll just create the reservation. 
            // In a real e-commerce, you might hold the stock or decrease it.
            // Let's decrease stock by 1 for now to prevent overselling
            $product->decrement('stock');

            return response()->json([
                'status' => 'success',
                'message' => 'Product reserved successfully',
                'data' => $reservation
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['status' => 'error', 'message' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => 'Failed to reserve product: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(ProductReservation $productReservation)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(ProductReservation $productReservation)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, ProductReservation $productReservation)
    {
        //
    }


    /**
     * Update reservation status (Admin)
     */
    public function updateStatus(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'status' => 'required|in:Pending,Accepted,In Process,Fulfilled,Cancelled'
            ]);

            $reservation = ProductReservation::findOrFail($id);
            $oldStatus = $reservation->status;
            $reservation->status = $validated['status'];
            $reservation->save();

            // Restore stock when admin cancels a reservation
            // Stock was decremented on reservation creation, so we need to add it back
            if ($validated['status'] === 'Cancelled' && $oldStatus !== 'Cancelled' && $oldStatus !== 'Fulfilled') {
                $product = \App\Models\Product::find($reservation->product_id);
                if ($product) {
                    $quantity = $reservation->quantity ?? 1;
                    $product->increment('stock', $quantity);
                }
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Reservation status updated successfully',
                'data' => $reservation
            ], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['status' => 'error', 'message' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update status: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reschedule pickup date (Client)
     */
    public function reschedulePickup(Request $request, $id)
    {
        try {
            $user = $request->user();
            
            $validated = $request->validate([
                'pickup_date' => 'required|date|after_or_equal:today'
            ]);
            
            $reservation = ProductReservation::where('prodres_id', $id)
                                           ->where('client_id', $user->client_id)
                                           ->firstOrFail();

            if ($reservation->status === 'Fulfilled') {
                 return response()->json(['status' => 'error', 'message' => 'Cannot reschedule a fulfilled reservation'], 400);
            }
            if ($reservation->status === 'Cancelled') {
                 return response()->json(['status' => 'error', 'message' => 'Cannot reschedule a cancelled reservation'], 400);
            }

            $reservation->pickup_date = $validated['pickup_date'];
            $reservation->save();

            return response()->json([
                'status' => 'success',
                'message' => 'Pickup date rescheduled successfully',
                'data' => $reservation
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['status' => 'error', 'message' => 'Reservation not found'], 404);
        } catch (\Exception $e) {
             return response()->json(['status' => 'error', 'message' => 'Failed to reschedule pickup: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Cancel a reservation (Client)
     */
    public function cancel(Request $request, $id)
    {
        try {
            $user = $request->user();
            $reservation = ProductReservation::with('product')
                                           ->where('prodres_id', $id)
                                           ->where('client_id', $user->client_id)
                                           ->firstOrFail();

            if ($reservation->status === 'cancelled') {
                 return response()->json(['status' => 'error', 'message' => 'Reservation is already cancelled'], 400);
            }
            if ($reservation->status === 'fulfilled') {
                 return response()->json(['status' => 'error', 'message' => 'Cannot cancel a fulfilled reservation'], 400);
            }

            // Restore stock — it was decremented on reservation creation
            if ($reservation->product) {
                $quantity = $reservation->quantity ?? 1;
                $reservation->product->increment('stock', $quantity);
            }

            $reservation->status = 'cancelled';
            $reservation->save();

            return response()->json([
                'status' => 'success',
                'message' => 'Reservation cancelled successfully',
                'data' => $reservation
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['status' => 'error', 'message' => 'Reservation not found'], 404);
        } catch (\Exception $e) {
             return response()->json(['status' => 'error', 'message' => 'Failed to cancel reservation: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, $id)
    {
        try {
            $user = $request->user();
            $reservation = ProductReservation::with('product')
                                           ->where('prodres_id', $id)
                                           ->where('client_id', $user->client_id)
                                           ->firstOrFail();

            if ($reservation->status === 'fulfilled') {
                 return response()->json(['status' => 'error', 'message' => 'Cannot delete a fulfilled reservation'], 400);
            }

            // Restore stock — it was decremented on reservation creation
            if ($reservation->status !== 'Cancelled' && $reservation->status !== 'Fulfilled' && $reservation->product) {
                $quantity = $reservation->quantity ?? 1;
                $reservation->product->increment('stock', $quantity);
            }

            $reservation->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Reservation deleted successfully'
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['status' => 'error', 'message' => 'Reservation not found'], 404);
        } catch (\Exception $e) {
             return response()->json(['status' => 'error', 'message' => 'Failed to delete reservation: ' . $e->getMessage()], 500);
        }
    }
}
