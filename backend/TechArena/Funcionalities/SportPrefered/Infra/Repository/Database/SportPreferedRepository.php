<?php

namespace TechArena\Funcionalities\SportPrefered\Infra\Repository\Database;

use DateTime;
use Exception;
use Illuminate\Support\Facades\DB;
use TechArena\Funcionalities\SportPrefered\Infra\Interfaces\SportPreferedInterface as Base;
use TechArena\Funcionalities\SportPrefered\Infra\Model\SportPrefered;
use TechArena\Funcionalities\User\Infra\Model\User;

class SportPreferedRepository implements Base
{

    public function selectAll(User $user): array
    {
        try {
            $user_sport = DB::table('user_sport', 'ps')
                ->select('s.*')
                ->join('sport as s', 'ps.sport_id', '=', 's.id')
                ->where('ps.user_id', '=', $user->getId())
                ->get()
                ->toArray();
            return $user_sport;
        } catch (Exception $e) {
            throw new Exception($e->getMessage());
        }
    }
    public function create(SportPrefered $sportPrefered): void
    {
        try {
            DB::table('user_sport')->insert($sportPrefered->toArray());
        } catch (Exception $e) {
            throw new Exception($e->getMessage());
        }
    }
    public function update(SportPrefered $sportPrefered): void
    {
        try {
            DB::table('user_sport')->get()->toArray();
        } catch (Exception $e) {
            throw new Exception($e->getMessage());
        }
    }
    public function removeAll(User $user): void
    {
        try {
            DB::table('user_sport')->where('user_id', '=', $user->getId())->delete();
        } catch (Exception $e) {
            throw new Exception($e->getMessage());
        }
    }
    public function allowed(User $user): bool
    {
        try {
            $result = DB::table('user_sport')
                ->where('user_id', '=', $user->getId())
                ->count('*');

            if ($result >= 4) {
                return false;
            }

            // Continue com a execução ou retorne true
            return true;
        } catch (Exception $e) {
            throw new Exception($e->getMessage());
        }
    }
}