<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('permission')->insert([
            ['id' => 1, 'symbol' => 'U', 'slug' => 'user'],
            ['id' => 2, 'symbol' => 'A', 'slug' => 'admin'],
            ['id' => 3, 'symbol' => 'G', 'slug' => 'guest'],
        ]);

        // Mantém a sequence PostgreSQL alinhada após inserir IDs explícitos.
        DB::statement("SELECT setval(pg_get_serial_sequence('permission', 'id'), COALESCE((SELECT MAX(id) FROM permission), 1), EXISTS (SELECT 1 FROM permission))");
    }
}