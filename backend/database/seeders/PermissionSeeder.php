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
    }
}