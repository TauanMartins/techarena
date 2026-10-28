<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PreferenceSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('preference')->insert([
            [
                'id' => 1,
                'desc_preference' => 'prefered_theme',
                'default_value' => null,
            ],
        ]);

        // Mantém a sequence PostgreSQL alinhada após inserir IDs explícitos.
        DB::statement("SELECT setval(pg_get_serial_sequence('preference', 'id'), COALESCE((SELECT MAX(id) FROM preference), 1), EXISTS (SELECT 1 FROM preference))");
    }
}