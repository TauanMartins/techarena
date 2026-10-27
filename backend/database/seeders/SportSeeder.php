<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SportSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('sport')->insert([
            ['id' => 1,  'name' => 'Vôlei',          'default_value_player_numbers' => 6],
            ['id' => 2,  'name' => 'Futsal',         'default_value_player_numbers' => 5],
            ['id' => 3,  'name' => 'Basquete',       'default_value_player_numbers' => 5],
            ['id' => 4,  'name' => 'Futebol',        'default_value_player_numbers' => 11],
            ['id' => 5,  'name' => 'Skate',          'default_value_player_numbers' => 1],
            ['id' => 6,  'name' => 'Handebol',       'default_value_player_numbers' => 7],
            ['id' => 7,  'name' => 'Tênis',          'default_value_player_numbers' => 1],
            ['id' => 8,  'name' => 'Xadrez',         'default_value_player_numbers' => 1],
            ['id' => 9,  'name' => 'Natação',        'default_value_player_numbers' => 1],
            ['id' => 10, 'name' => 'Ping-Pong',      'default_value_player_numbers' => 1],
            ['id' => 11, 'name' => 'Vôlei de Praia', 'default_value_player_numbers' => 2],
            ['id' => 12, 'name' => 'Futevôlei',      'default_value_player_numbers' => 2],
        ]);
    }
}