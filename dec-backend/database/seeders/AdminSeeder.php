<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\AdminAccount;

class AdminSeeder extends Seeder
{
    /**
     * Seed a default super admin account.
     */
    public function run(): void
    {
        AdminAccount::updateOrCreate(
            ['email' => 'doctorec_administrator@docec.com'],
            [
                'first_name'  => 'Super',
                'last_name'   => 'Admin',
                'email'       => 'doctorec_administrator@docec.com',
                'password'    => bcrypt('adminDocEC2026'),
                'position'    => 'Administrator',
                'role_id'     => 1,
            ]
        );
    }
}
