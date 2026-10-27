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
    }
}