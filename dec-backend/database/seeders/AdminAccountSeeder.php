<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\AdminAccount;
use App\Models\Role;

class AdminAccountSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $adminRole = Role::where('name', Role::ROLE_ADMIN)->first() ?? Role::where('name', 'Admin')->first();
        
        AdminAccount::updateOrCreate(
            ['email' => 'adminec123@gmail.com'],
            [
                'first_name' => 'System',
                'last_name' => 'Administrator',
                'password' => Hash::make('adminDocEC123'),
                'role_id' => $adminRole ? $adminRole->role_id : 1,
                'position' => 'Superadmin',
            ]
        );
    }
}
