<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MaterialSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('material')->insert([
            ['id' => 1,  'description' => 'Bola de futebol'],
            ['id' => 2,  'description' => 'Bola de basquete'],
            ['id' => 3,  'description' => 'Skate'],
            ['id' => 4,  'description' => 'Bola de futsal'],
            ['id' => 5,  'description' => 'Bola de handebol'],
            ['id' => 6,  'description' => 'Raquete de tênis'],
            ['id' => 7,  'description' => 'Bola de tênis'],
            ['id' => 8,  'description' => 'Tabuleiro de xadrez'],
            ['id' => 9,  'description' => 'Peças de xadrez'],
            ['id' => 10, 'description' => 'Relógio de xadrez'],
            ['id' => 11, 'description' => 'Óculos de natação'],
            ['id' => 12, 'description' => 'Touca de natação'],
            ['id' => 13, 'description' => 'Raquete de tênis de mesa'],
            ['id' => 14, 'description' => 'Bola de tênis de mesa'],
            ['id' => 15, 'description' => 'Rede de tênis de mesa'],
            ['id' => 16, 'description' => 'Mesa de tênis de mesa'],
            ['id' => 17, 'description' => 'Bola de vôlei'],
            ['id' => 18, 'description' => 'Bola de vôlei de praia'],
            ['id' => 19, 'description' => 'Bola de futevôlei'],
            ['id' => 20, 'description' => 'Traves de gol de futebol'],
            ['id' => 21, 'description' => 'Cesta de basquete (aro, tabela, rede)'],
            ['id' => 22, 'description' => 'Rampas e trilhos para skate'],
            ['id' => 23, 'description' => 'Traves de gol de futsal'],
            ['id' => 24, 'description' => 'Traves de gol de handebol'],
            ['id' => 25, 'description' => 'Rede de tênis'],
            ['id' => 26, 'description' => 'Quadra de tênis'],
            ['id' => 27, 'description' => 'Piscina'],
            ['id' => 28, 'description' => 'Rede de vôlei'],
            ['id' => 29, 'description' => 'Postes de vôlei'],
            ['id' => 30, 'description' => 'Rede de vôlei de praia'],
            ['id' => 31, 'description' => 'Postes de vôlei de praia'],
            ['id' => 32, 'description' => 'Areia para vôlei de praia'],
            ['id' => 33, 'description' => 'Rede de futevôlei'],
            ['id' => 34, 'description' => 'Postes de futevôlei'],
            ['id' => 35, 'description' => 'Areia para futevôlei'],
        ]);
    }
}