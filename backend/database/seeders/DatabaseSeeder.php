<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            PermissionSeeder::class,
            PreferenceSeeder::class,
            ScheduleSeeder::class,
            SportSeeder::class,
            MaterialSeeder::class,
            ArenaSeeder::class,
            SportMaterialSeeder::class,
            SportArenaSeeder::class,
        ]);
    }
}