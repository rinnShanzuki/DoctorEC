<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = [
            ['role_id' => 1, 'name' => 'Admin'],
            ['role_id' => 2, 'name' => 'Cashier'],
            ['role_id' => 3, 'name' => 'Staff'],
        ];

        foreach ($roles as $role) {
            \DB::table('roles')->updateOrInsert(
                ['role_id' => $role['role_id']],
                [
                    'name' => $role['name'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }
    }
}
