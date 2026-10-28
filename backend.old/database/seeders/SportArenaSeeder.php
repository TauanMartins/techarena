<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SportArenaSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('sport_arena')->insert([
            // Arena 1: Quadra de Areia SQN 206
            ['sport_id' => 11, 'arena_id' => 1],
            ['sport_id' => 12, 'arena_id' => 1],

            // Arena 2: Quadra de Esportes SQN 408
            ['sport_id' => 1, 'arena_id' => 2],
            ['sport_id' => 2, 'arena_id' => 2],
            ['sport_id' => 3, 'arena_id' => 2],
            ['sport_id' => 6, 'arena_id' => 2],

            // Arena 3: Quadra de Esportes SQN 106/107
            ['sport_id' => 1, 'arena_id' => 3],
            ['sport_id' => 2, 'arena_id' => 3],
            ['sport_id' => 3, 'arena_id' => 3],
            ['sport_id' => 6, 'arena_id' => 3],

            // Arena 4: Quadra Esportiva SQS 403
            ['sport_id' => 1, 'arena_id' => 4],
            ['sport_id' => 2, 'arena_id' => 4],
            ['sport_id' => 3, 'arena_id' => 4],
            ['sport_id' => 6, 'arena_id' => 4],

            // Arena 5: Quadra Esportiva SQS 303
            ['sport_id' => 1, 'arena_id' => 5],
            ['sport_id' => 2, 'arena_id' => 5],
            ['sport_id' => 3, 'arena_id' => 5],
            ['sport_id' => 6, 'arena_id' => 5],

            // Arena 6: Quadra de Esportes SQS 704
            ['sport_id' => 1, 'arena_id' => 6],
            ['sport_id' => 2, 'arena_id' => 6],
            ['sport_id' => 3, 'arena_id' => 6],
            ['sport_id' => 6, 'arena_id' => 6],

            // Arena 7: Quadra de Esportes SQN 316
            ['sport_id' => 1, 'arena_id' => 7],
            ['sport_id' => 2, 'arena_id' => 7],
            ['sport_id' => 3, 'arena_id' => 7],
            ['sport_id' => 6, 'arena_id' => 7],

            // Arena 8: Q. 301 Rua C - Águas Claras
            ['sport_id' => 2, 'arena_id' => 8],
            ['sport_id' => 3, 'arena_id' => 8],
            ['sport_id' => 6, 'arena_id' => 8],

            // Arena 9: Av. das Araucárias - Águas Claras
            ['sport_id' => 2, 'arena_id' => 9],
            ['sport_id' => 3, 'arena_id' => 9],
            ['sport_id' => 6, 'arena_id' => 9],

            // Arena 10: Quadra de esportes comunitária Guará
            ['sport_id' => 2, 'arena_id' => 10],
            ['sport_id' => 3, 'arena_id' => 10],
            ['sport_id' => 6, 'arena_id' => 10],

            // Arena 11: Quadra Poliesportiva da Vila Mathia - Taguatinga Sul
            ['sport_id' => 1, 'arena_id' => 11],
            ['sport_id' => 2, 'arena_id' => 11],
            ['sport_id' => 3, 'arena_id' => 11],
            ['sport_id' => 6, 'arena_id' => 11],

            // Arena 12: Quadra de Esportes Taguatinga
            ['sport_id' => 2, 'arena_id' => 12],
            ['sport_id' => 3, 'arena_id' => 12],

            // Arena 13: Quadra de Basquete do Taguaparque
            ['sport_id' => 3, 'arena_id' => 13],

            // Arena 14: Quadra Poliesportiva Qsf15 - Taguatinga
            ['sport_id' => 2, 'arena_id' => 14],
            ['sport_id' => 6, 'arena_id' => 14],

            // Arena 15: Quadra da Qsf11 - Taguatinga
            ['sport_id' => 2, 'arena_id' => 15],
            ['sport_id' => 6, 'arena_id' => 15],

            // Arena 16: Skate Park Aguas Claras
            ['sport_id' => 5, 'arena_id' => 16],

            // Arena 17: Vôlei de Praia - Parque Ecológico Águas Claras
            ['sport_id' => 11, 'arena_id' => 17],
            ['sport_id' => 12, 'arena_id' => 17],

            // Arena 18: Quadra de Esporte da Quadra 4
            ['sport_id' => 3, 'arena_id' => 18],
            ['sport_id' => 4, 'arena_id' => 18],

            // Arena 19: Quadra de esportes 210 Asa Sul
            ['sport_id' => 2, 'arena_id' => 19],
            ['sport_id' => 3, 'arena_id' => 19],
            ['sport_id' => 6, 'arena_id' => 19],

            // Arena 20: Quadra Esportiva SQN 102
            ['sport_id' => 1, 'arena_id' => 20],
            ['sport_id' => 2, 'arena_id' => 20],
            ['sport_id' => 3, 'arena_id' => 20],
            ['sport_id' => 6, 'arena_id' => 20],

            // Arena 21: Skate Park Sukata
            ['sport_id' => 5, 'arena_id' => 21],

            // Arena 22: Quadra de Esportes SQN 206
            ['sport_id' => 2, 'arena_id' => 22],
            ['sport_id' => 6, 'arena_id' => 22],

            // Arena 23: Quadra de futebol EQS 110/111
            ['sport_id' => 4, 'arena_id' => 23],

            // Arena 24: Quadras Poliesportivas - Parque da Cidade
            ['sport_id' => 1,  'arena_id' => 24],
            ['sport_id' => 2,  'arena_id' => 24],
            ['sport_id' => 3,  'arena_id' => 24],
            ['sport_id' => 4,  'arena_id' => 24],
            ['sport_id' => 6,  'arena_id' => 24],
            ['sport_id' => 11, 'arena_id' => 24],
            ['sport_id' => 12, 'arena_id' => 24],

            // Arena 25: Rua 6 - Quadra 6 LE 5
            ['sport_id' => 2, 'arena_id' => 25],
            ['sport_id' => 3, 'arena_id' => 25],
            ['sport_id' => 6, 'arena_id' => 25],

            // Arena 26: Quadra 06 De Sobradinho
            ['sport_id' => 1, 'arena_id' => 26],
            ['sport_id' => 2, 'arena_id' => 26],

            // Arena 27: Condomínio Fazendinha Q 2 Conjunto A
            ['sport_id' => 1,  'arena_id' => 27],
            ['sport_id' => 2,  'arena_id' => 27],
            ['sport_id' => 3,  'arena_id' => 27],
            ['sport_id' => 7,  'arena_id' => 27],
            ['sport_id' => 12, 'arena_id' => 27],

            // Arena 28: 1428 Condomínio Fazendinha Q 2 Conjunto A
            ['sport_id' => 1,  'arena_id' => 28],
            ['sport_id' => 2,  'arena_id' => 28],
            ['sport_id' => 3,  'arena_id' => 28],
            ['sport_id' => 12, 'arena_id' => 28],

            // Arena 29: Condomínio Del Lago I Q 4
            ['sport_id' => 5, 'arena_id' => 29],

            // Arena 30: Q. 1 Del Lago
            ['sport_id' => 2, 'arena_id' => 30],

            // Arena 31: Quadra da 9, Paranoá
            ['sport_id' => 1, 'arena_id' => 31],
            ['sport_id' => 2, 'arena_id' => 31],
            ['sport_id' => 3, 'arena_id' => 31],
            ['sport_id' => 6, 'arena_id' => 31],

            // Arena 32: Paranoá 7 Praça Central Conjunto 3
            ['sport_id' => 4, 'arena_id' => 32],

            // Arena 33: 12 Praça Central
            ['sport_id' => 1, 'arena_id' => 33],
            ['sport_id' => 2, 'arena_id' => 33],
            ['sport_id' => 3, 'arena_id' => 33],
            ['sport_id' => 6, 'arena_id' => 33],

            // Arena 34: Condomínio Mansões Entre Lagos Etapa 2
            ['sport_id' => 1, 'arena_id' => 34],
            ['sport_id' => 2, 'arena_id' => 34],
            ['sport_id' => 3, 'arena_id' => 34],
            ['sport_id' => 6, 'arena_id' => 34],

            // Arena 35: Condomínio Mansões Entre lagos Etapa 2
            ['sport_id' => 1, 'arena_id' => 35],
            ['sport_id' => 2, 'arena_id' => 35],
            ['sport_id' => 3, 'arena_id' => 35],
            ['sport_id' => 6, 'arena_id' => 35],

            // Arena 36: Quadra de Esportes SQN 208
            ['sport_id' => 1, 'arena_id' => 36],
            ['sport_id' => 2, 'arena_id' => 36],
            ['sport_id' => 3, 'arena_id' => 36],
            ['sport_id' => 6, 'arena_id' => 36],
        ]);
    }
}