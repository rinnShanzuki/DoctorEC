<?php

use App\Http\Controllers\Api\V1\AdminAuthController;
use App\Http\Controllers\Api\V1\ReportsController;
use App\Http\Controllers\Api\V1\UnifiedAuthController;
use App\Http\Controllers\Api\V1\ProductController;
use App\Http\Controllers\Api\V1\AppointmentController;
use App\Http\Controllers\Api\V1\ServiceController;
use App\Http\Controllers\Api\V1\DoctorController;
use App\Http\Controllers\Api\V1\DoctorScheduleController;
use App\Http\Controllers\Api\V1\DoctorAuthController;
use App\Http\Controllers\Api\V1\DoctorModuleController;
use App\Http\Controllers\Api\V1\LowStockController;
use App\Http\Controllers\Api\V1\PatientController;
use App\Http\Controllers\ClientAccountController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - Version 1
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for version 1 of your application.
| These routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group and prefixed with "v1".
|
*/

// Unified authentication route (checks client, admin, and doctor tables)
Route::post('/auth/login', [UnifiedAuthController::class, 'login']);

// Google OAuth routes (public)
Route::get('/auth/google/redirect', [\App\Http\Controllers\Api\V1\GoogleAuthController::class, 'redirectToGoogle']);
Route::get('/auth/google/callback', [\App\Http\Controllers\Api\V1\GoogleAuthController::class, 'handleGoogleCallback']);

Route::post('/auth/google', [\App\Http\Controllers\Api\V1\GoogleAuthController::class, 'handleGoogleLogin']);
Route::post('/auth/google/verify-otp', [\App\Http\Controllers\Api\V1\GoogleAuthController::class, 'verifyOtp']);

// Google OAuth authentication routes (public)
Route::post('/auth/google', [\App\Http\Controllers\Api\V1\GoogleAuthController::class, 'handleGoogleLogin']);
Route::post('/auth/google/verify-otp', [\App\Http\Controllers\Api\V1\GoogleAuthController::class, 'verifyOtp']);

// Client authentication routes (public)
Route::prefix('client')->group(function () {
    Route::post('/register', [ClientAccountController::class, 'register']);
    Route::post('/login', [ClientAccountController::class, 'login']);
    
    // Protected client routes (require authentication)
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [ClientAccountController::class, 'me']);
        Route::get('/appointments', [AppointmentController::class, 'getClientAppointments']);
        Route::post('/appointments', [AppointmentController::class, 'store']);
        Route::put('/appointments/{id}/reschedule', [AppointmentController::class, 'rescheduleAppointment']);
        Route::put('/appointments/{id}/cancel', [AppointmentController::class, 'cancelAppointment']);
    });
});

// Password Reset Routes (public)
Route::prefix('password')->group(function () {
    Route::post('/send-reset-email', [\App\Http\Controllers\Api\V1\PasswordResetController::class, 'sendResetEmail']);
    Route::post('/verify-otp', [\App\Http\Controllers\Api\V1\PasswordResetController::class, 'verifyOtp']);
    Route::post('/reset', [\App\Http\Controllers\Api\V1\PasswordResetController::class, 'resetPassword']);
});

// Email Verification Routes (public)
Route::prefix('email')->group(function () {
    Route::post('/send-otp', [\App\Http\Controllers\Api\V1\EmailVerificationController::class, 'sendOtp']);
    Route::post('/verify-otp', [\App\Http\Controllers\Api\V1\EmailVerificationController::class, 'verifyOtp']);
});

// Public routes (no authentication required)
Route::prefix('admin/auth')->group(function () {
    Route::post('/register', [AdminAuthController::class, 'register']);
    Route::post('/login', [AdminAuthController::class, 'login']);
});

// Doctor authentication routes (public)
Route::post('/doctor/auth/login', [DoctorAuthController::class, 'login']);

// Public product routes (for client-side display)
Route::get('/products', [ProductController::class, 'index']);

// Public site settings
Route::get('/site-settings', [\App\Http\Controllers\SiteSettingController::class, 'index']);

// Public GCash QR code route
Route::get('/qr-codes/gcash', [\App\Http\Controllers\Api\V1\QrCodeController::class, 'getGcashQr']);

// Public AI Chatbot route
Route::post('/chatbot/message', [\App\Http\Controllers\Api\V1\ChatbotController::class, 'sendMessage']);

// Public AI Recommendations route
Route::post('/recommendations', [\App\Http\Controllers\Api\V1\RecommendationController::class, 'getRecommendations']);

// Public services route (for client-side service selection)

// Public services route (for client-side service selection)
Route::get('/services', [ServiceController::class, 'index']);

// Public doctors route (for client-side doctor selection)
Route::get('/doctors', [DoctorController::class, 'index']);

// Public doctor schedule routes (for client-side appointment booking)
Route::get('/doctors/{id}/schedules', [DoctorScheduleController::class, 'doctorSchedules']);
Route::get('/doctors/{id}/available-slots', [DoctorScheduleController::class, 'getAvailableSlots']);

// Protected routes (require authentication)
Route::middleware('auth:sanctum')->group(function () {
    Route::prefix('admin/auth')->group(function () {
        Route::post('/logout', [AdminAuthController::class, 'logout']);
        Route::get('/me', [AdminAuthController::class, 'me']);
        Route::put('/profile', [AdminAuthController::class, 'updateProfile']);
    });

    // Staff management routes (admin only)
    Route::prefix('admin/staff')->group(function () {
        Route::get('/', [AdminAuthController::class, 'getStaffAccounts']);
        Route::post('/', [AdminAuthController::class, 'createStaffAccount']);
        Route::delete('/{id}', [AdminAuthController::class, 'deleteStaffAccount']);
    });

    // Roles route (for dropdowns)
    Route::get('/roles', [AdminAuthController::class, 'getRoles']);

    // Dashboard routes
    Route::prefix('dashboard')->group(function () {
        Route::get('/all', [\App\Http\Controllers\Api\V1\DashboardController::class, 'getDashboardAll']);
        Route::get('/stats', [\App\Http\Controllers\Api\V1\DashboardController::class, 'getStats']);
        Route::get('/products-distribution', [\App\Http\Controllers\Api\V1\DashboardController::class, 'getProductDistribution']);
        Route::get('/reservation-trends', [\App\Http\Controllers\Api\V1\DashboardController::class, 'getReservationTrends']);
        Route::get('/appointment-trends', [\App\Http\Controllers\Api\V1\DashboardController::class, 'getAppointmentTrends']);
    });

    // Sales transaction routes (cashier)
    Route::prefix('sales')->group(function () {
        Route::post('/transactions', [\App\Http\Controllers\Api\V1\SalesController::class, 'createTransaction']);
        Route::get('/transactions', [\App\Http\Controllers\Api\V1\SalesController::class, 'getTransactions']);
        Route::get('/transactions/{id}', [\App\Http\Controllers\Api\V1\SalesController::class, 'getTransaction']);
    });

    // QR Code routes (cashier/admin)
    Route::prefix('qr-codes')->group(function () {
        Route::post('/gcash', [\App\Http\Controllers\Api\V1\QrCodeController::class, 'storeGcashQr']);
        Route::delete('/{id}', [\App\Http\Controllers\Api\V1\QrCodeController::class, 'destroy']);
    });

    // Product management routes (admin only)
    Route::prefix('products')->group(function () {
        Route::post('/', [ProductController::class, 'store']);
        Route::put('/{id}', [ProductController::class, 'update']);
        Route::post('/{id}', [ProductController::class, 'update']); // For FormData
        Route::delete('/{id}', [ProductController::class, 'destroy']);
    });

    // Doctor schedule management routes (admin only)
    Route::prefix('doctor-schedules')->group(function () {
        Route::get('/', [DoctorScheduleController::class, 'index']);
        Route::post('/', [DoctorScheduleController::class, 'store']);
        Route::put('/{id}', [DoctorScheduleController::class, 'update']);
        Route::delete('/{id}', [DoctorScheduleController::class, 'destroy']);
    });

    // Site Settings routes (admin only for updates)
    Route::prefix('site-settings')->group(function () {
        Route::post('/', [\App\Http\Controllers\SiteSettingController::class, 'store']);
        Route::post('/upload', [\App\Http\Controllers\SiteSettingController::class, 'upload']);
    });

    // Appointment management routes (admin only)
    Route::prefix('appointments')->group(function () {
        Route::get('/', [AppointmentController::class, 'index']);
        Route::post('/', [AppointmentController::class, 'store']);
        Route::put('/{id}', [AppointmentController::class, 'update']);
        Route::delete('/{id}', [AppointmentController::class, 'destroy']);
        Route::get('/completed', [DoctorModuleController::class, 'getCompletedAppointments']);
    });

    // Service management routes (admin only)
    Route::prefix('services')->group(function () {
        Route::get('/with-stats', [ServiceController::class, 'indexWithStats']);
        Route::post('/', [ServiceController::class, 'store']);
        Route::put('/{id}', [ServiceController::class, 'update']);
        Route::delete('/{id}', [ServiceController::class, 'destroy']);
    });

    // Doctor management routes (admin only)
    Route::prefix('doctors')->group(function () {
        Route::post('/', [DoctorController::class, 'store']);
        Route::get('/{id}/appointments', [DoctorController::class, 'getAppointments']); // Fetch doctor appointments
        Route::put('/{id}', [DoctorController::class, 'update']);
        Route::post('/{id}', [DoctorController::class, 'update']); // For FormData
        Route::delete('/{id}', [DoctorController::class, 'destroy']);
    });

    // Patient management routes (admin only)
    Route::prefix('patients')->group(function () {
        Route::get('/', [PatientController::class, 'index']);
        Route::get('/{id}', [PatientController::class, 'show']);
        Route::post('/', [PatientController::class, 'store']);
        Route::put('/{id}', [PatientController::class, 'update']);
        Route::delete('/{id}', [PatientController::class, 'destroy']);
    });
    
    // Reservation management routes (admin only)
    Route::prefix('reservations')->group(function () {
        Route::get('/', [\App\Http\Controllers\ProductReservationController::class, 'index']);
        Route::put('/{id}/status', [\App\Http\Controllers\ProductReservationController::class, 'updateStatus']);
    });
    
    // Client management routes (admin only)
    Route::prefix('clients')->group(function () {
        Route::get('/', [\App\Http\Controllers\ClientAccountController::class, 'index']);
        Route::get('/{id}', [\App\Http\Controllers\ClientAccountController::class, 'show']);
        Route::put('/{id}/block', [\App\Http\Controllers\ClientAccountController::class, 'blockUser']);
    });

    // Customer management routes (admin only)
    Route::prefix('customers')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\V1\CustomerController::class, 'index']);
        Route::get('/{id}', [\App\Http\Controllers\Api\V1\CustomerController::class, 'show']);
        Route::post('/', [\App\Http\Controllers\Api\V1\CustomerController::class, 'store']);
    });
    
    // Appointment management routes (admin only)
    Route::prefix('appointments')->group(function () {
        Route::get('/', [\App\Http\Controllers\AppointmentController::class, 'index']);
        Route::get('/doctor/{doctorId}', [\App\Http\Controllers\AppointmentController::class, 'getDoctorAppointments']);
        Route::put('/{id}/status', [\App\Http\Controllers\AppointmentController::class, 'updateStatus']);
    });
    
    // Sales Transaction routes (admin only - POS)
    Route::prefix('transactions')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\V1\SalesTransactionController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\Api\V1\SalesTransactionController::class, 'store']);
        Route::get('/{id}', [\App\Http\Controllers\Api\V1\SalesTransactionController::class, 'show']);
    });
    
    // POS Notifications routes (admin only)
    Route::prefix('pos-notifications')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\V1\PosNotificationController::class, 'index']);
        Route::put('/{id}/read', [\App\Http\Controllers\Api\V1\PosNotificationController::class, 'markAsRead']);
    });
    
    // Inventory Analytics route (admin only)
    Route::get('/inventory/analytics', [\App\Http\Controllers\Api\V1\SalesTransactionController::class, 'getAnalytics']);

    // Low Stock Alerts route (admin only)
    Route::get('/low-stock-alerts', [LowStockController::class, 'index']);

    // =============================================
    // REPORTS & ANALYTICS ROUTES (AI-powered, backend-driven)
    // =============================================
    Route::prefix('reports')->group(function () {
        Route::get('/appointments', [\App\Http\Controllers\Api\V1\ReportsController::class, 'appointments']);
        Route::get('/services',     [\App\Http\Controllers\Api\V1\ReportsController::class, 'services']);
        Route::get('/sales',        [\App\Http\Controllers\Api\V1\ReportsController::class, 'sales']);
        Route::get('/patients',     [\App\Http\Controllers\Api\V1\ReportsController::class, 'patients']);
        Route::get('/predictions',  [\App\Http\Controllers\Api\V1\ReportsController::class, 'predictions']);
        Route::get('/ai-insights',  [\App\Http\Controllers\Api\V1\ReportsController::class, 'aiInsights']);
    });

    // =============================================
    // DOCTOR MODULE ROUTES (require doctor auth)
    // =============================================
    Route::prefix('doctor')->group(function () {
        // Doctor auth
        Route::post('/auth/logout', [DoctorAuthController::class, 'logout']);
        Route::get('/auth/me', [DoctorAuthController::class, 'me']);

        // Doctor appointments
        Route::get('/appointments', [DoctorModuleController::class, 'getMyAppointments']);
        Route::put('/appointments/{id}/accept', [DoctorModuleController::class, 'acceptAppointment']);
        Route::put('/appointments/{id}/cancel', [DoctorModuleController::class, 'cancelAppointment']);
        Route::put('/appointments/{id}/start-session', [DoctorModuleController::class, 'startSession']);
        Route::post('/appointments/{id}/complete-session', [DoctorModuleController::class, 'completeSession']);

        // Doctor schedules
        Route::get('/schedules', [DoctorModuleController::class, 'getMySchedules']);
        Route::post('/schedules', [DoctorModuleController::class, 'createSchedule']);
        Route::post('/schedules/apply-week', [DoctorModuleController::class, 'applyWeekSchedule']);
        Route::put('/schedules/{id}', [DoctorModuleController::class, 'updateSchedule']);
        Route::delete('/schedules/{id}', [DoctorModuleController::class, 'deleteSchedule']);
        Route::post('/schedules/{id}/toggle-slot', [DoctorModuleController::class, 'toggleSlot']);

        // Clinic default hours
        Route::get('/clinic-hours', [DoctorModuleController::class, 'getClinicHours']);

        // Doctor patients (read-only: walk-in patients + online clients)
        Route::get('/patients', [PatientController::class, 'index']);
        Route::get('/patients/{id}', [PatientController::class, 'show']);
        Route::get('/clients', [\App\Http\Controllers\ClientAccountController::class, 'index']);
        Route::get('/clients/{id}', [\App\Http\Controllers\ClientAccountController::class, 'show']);

        // Doctor status
        Route::put('/duty-status', [DoctorModuleController::class, 'updateDutyStatus']);

        // Doctor reminders
        Route::get('/reminders', [DoctorModuleController::class, 'getReminders']);
    });
});

