<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ScheduleSeeder extends Seeder
{
    public function run(): void
    {
        $times = [];
        for ($hour = 6; $hour < 24; $hour++) {
            foreach (['00', '30'] as $minute) {
                $times[] = ['horary' => sprintf('%02d:%s:00', $hour, $minute)];
            }
        }

        DB::table('schedule')->insert($times);
    }
}