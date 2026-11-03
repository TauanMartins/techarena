import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ComponentProps, FormEvent } from 'react';
import type { LeagueMatch } from '../types/leagues.types';
import { LeagueMatchCard } from './LeagueMatchCard';

const match: LeagueMatch = {
  id: 'match-1', appointmentId: 'appointment-1', matchNumber: 1, scheduledAt: '2099-12-01T20:00:00.000Z',
  status: 'scheduled', resultAllowed: true, phase: 'manual', roundNumber: 1, groupNumber: null,
  arenaAddress: null,
  homeTeam: { id: 'home', name: 'Aurora', image: null, captainName: null, groupNumber: null },
  awayTeam: { id: 'away', name: 'Cometas', image: null, captainName: null, groupNumber: null },
  result: null,
};

function props(overrides: Partial<ComponentProps<typeof LeagueMatchCard>> = {}) {
  return {
    match, canRecordResult: true, canManage: true, isRescheduling: false, date: '2099-12-05',
    arenas: [{ id: 'arena-1', address: 'Arena Central', image: null }], arenaId: 'arena-1',
    availability: [{ id: 'slot-1', horary: '20:00' }], scores: { home: '', away: '' }, saving: false,
    onScoreChange: vi.fn(), onSaveResult: vi.fn(), onCancel: vi.fn(), onToggleReschedule: vi.fn(),
    onDateChange: vi.fn(), onArenaChange: vi.fn(), onReschedule: vi.fn(), ...overrides,
  };
}

describe('LeagueMatchCard', () => {
  it('offers score, reschedule and cancel actions to the owner for an eligible manual match', async () => {
    const user = userEvent.setup();
    const onSaveResult = vi.fn();
    const onCancel = vi.fn();
    const onReschedule = vi.fn((event: FormEvent<HTMLFormElement>) => event.preventDefault());
    const onToggleReschedule = vi.fn();
    const componentProps = props({ onSaveResult, onCancel, onReschedule, onToggleReschedule });
    const { rerender } = render(<LeagueMatchCard {...componentProps} />);

    expect(screen.getByText('Resultado pendente')).toBeInTheDocument();
    expect(screen.getByText('Partida avulsa')).toBeInTheDocument();
    expect(screen.queryByText(/Local a confirmar/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Registrar resultado' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar partida' }));
    expect(onSaveResult).toHaveBeenCalledOnce();
    expect(onCancel).toHaveBeenCalledOnce();

    await user.click(screen.getByRole('button', { name: 'Reagendar' }));
    expect(onToggleReschedule).toHaveBeenCalledOnce();
    rerender(<LeagueMatchCard {...componentProps} isRescheduling />);
    await user.selectOptions(screen.getByLabelText('Horário disponível'), 'slot-1');
    await user.click(screen.getByRole('button', { name: 'Salvar novo horário' }));
    expect(onReschedule).toHaveBeenCalledOnce();
    await user.click(screen.getByRole('button', { name: 'Voltar' }));
    expect(onToggleReschedule).toHaveBeenCalledTimes(2);
  });

  it('shows finished scores without owner controls and formats tournament phase variants', () => {
    const finished: LeagueMatch = {
      ...match, status: 'finished', phase: 'group', groupNumber: 2, arenaAddress: 'Ginásio Municipal',
      resultAllowed: false, result: { winnerTeamId: 'home', homeScore: 2, awayScore: 1 },
    };
    const { rerender } = render(<LeagueMatchCard {...props({ match: finished, canRecordResult: false, canManage: false })} />);
    expect(screen.getByText('Concluída')).toBeInTheDocument();
    expect(screen.getByText('Placar: 2 x 1')).toBeInTheDocument();
    expect(screen.getByText('Grupos · grupo 2 · rodada 1')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reagendar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Atualizar resultado' })).not.toBeInTheDocument();

    rerender(<LeagueMatchCard {...props({ match: { ...match, status: 'canceled', phase: 'knockout', groupNumber: null }, canRecordResult: false, canManage: false })} />);
    expect(screen.getByText('Cancelada')).toBeInTheDocument();
    expect(screen.getByText('Mata-mata · rodada 1')).toBeInTheDocument();
  });

  it('uses score update labels and supports group-stage round-robin wording', () => {
    const scored: LeagueMatch = { ...match, phase: 'group', groupNumber: null, result: { winnerTeamId: null, homeScore: 0, awayScore: 0 } };
    render(<LeagueMatchCard {...props({ match: scored, canManage: false })} />);
    expect(screen.getByRole('button', { name: 'Atualizar resultado' })).toBeInTheDocument();
    expect(screen.getByText('Pontos corridos · rodada 1')).toBeInTheDocument();
  });
});
