import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Appointment } from '../types/appointments.types';
import { AppointmentCard } from './AppointmentCard';

const appointment: Appointment = {
  id: 'appointment-1',
  title: 'Jogo amistoso',
  description: null,
  scheduledAt: '2026-12-01T20:00:00.000Z',
  status: 'scheduled',
  organizerId: 'organizer-1',
  arenaId: null,
  sportId: null,
  scheduleId: null,
  arenaAddress: null,
  arenaImage: null,
  sportName: null,
  maxPlayers: null,
  players: 2,
  startingPlayers: 1,
  isInside: false,
  distanceKm: null,
  participants: [],
};

describe('AppointmentCard', () => {
  it('shows fallbacks for sparse data and opens then closes its details dialog', () => {
    render(<AppointmentCard appointment={appointment} />);
    expect(screen.getByText('Esporte')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Encontre pessoas para jogar e pratique seu esporte favorito.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Confirmado')).toBeInTheDocument();
    expect(screen.getByText('Local a confirmar')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ver detalhes' }));
    expect(screen.getByText('Sem descrição adicional.')).toBeInTheDocument();
    expect(screen.getByText('Não informado')).toBeInTheDocument();
    expect(screen.getAllByText('Confirmado')).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
  });

  it('renders populated match details, participant roles, capacity, distance, and disabled actions', () => {
    const action = vi.fn();
    const populated: Appointment = {
      ...appointment,
      description: 'Partida da semana',
      arenaAddress: 'Arena Central',
      arenaImage: '/arena.png',
      sportName: 'Futebol',
      status: 'in_progress',
      maxPlayers: 10,
      distanceKm: 3.25,
      participants: [
        { id: 'p1', name: 'Ana', username: 'ana', image: null, holder: true },
        { id: 'p2', name: null, username: null, image: null, holder: false },
      ],
    };
    render(
      <AppointmentCard
        appointment={populated}
        action={action}
        actionLabel="Entrando..."
        disabled
      />,
    );
    expect(screen.getByAltText('Arena de Jogo amistoso')).toHaveAttribute(
      'src',
      '/arena.png',
    );
    expect(screen.getByText('Partida da semana')).toBeInTheDocument();
    expect(screen.getAllByText('3.3 km')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Ver detalhes' }));
    expect(screen.getByText('Em andamento')).toBeInTheDocument();
    expect(screen.getAllByText('3.3 km')).toHaveLength(2);
    expect(screen.getByText('@ana')).toBeInTheDocument();
    expect(screen.getByText('Participante')).toBeInTheDocument();
    expect(screen.getAllByText('Titular')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Entrando...' })).toBeDisabled();
  });

  it('delegates details to the page and uses the default action label', () => {
    const onDetails = vi.fn();
    const action = vi.fn();
    render(
      <AppointmentCard
        appointment={appointment}
        action={action}
        onDetails={onDetails}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Ver detalhes' }));
    fireEvent.click(screen.getByRole('button', { name: 'Participar' }));
    expect(onDetails).toHaveBeenCalledOnce();
    expect(action).toHaveBeenCalledOnce();
  });
});
