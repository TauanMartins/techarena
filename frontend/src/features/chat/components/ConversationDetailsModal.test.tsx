import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Conversation } from '../types/conversation.types';
import { ConversationDetailsModal } from './ConversationDetailsModal';

describe('ConversationDetailsModal', () => {
  it('does not show details without a selected conversation', () => {
    render(
      <ConversationDetailsModal
        show
        onHide={vi.fn()}
      />,
    );
    expect(screen.queryByText('Detalhes da conversa')).not.toBeInTheDocument();
  });

  it('shows direct-chat identity and fallback when username is unavailable', () => {
    const direct: Conversation = {
      id: 'u1',
      kind: 'direct',
      label: 'Ana',
      image: null,
    };
    render(
      <ConversationDetailsModal
        conversation={direct}
        show
        onHide={vi.fn()}
      />,
    );
    expect(screen.getByText('AMIZADE')).toBeInTheDocument();
    expect(screen.getByText('Atleta da sua rede')).toBeInTheDocument();
  });

  it('shows team metadata with and without an optional role', () => {
    const team: Conversation = {
      id: 't1',
      kind: 'team',
      label: 'Aurora',
      description: null,
    };
    const { rerender } = render(
      <ConversationDetailsModal
        conversation={team}
        show
        onHide={vi.fn()}
      />,
    );
    expect(
      screen.getByText('Esta equipe ainda não tem uma descrição.'),
    ).toBeInTheDocument();
    rerender(
      <ConversationDetailsModal
        conversation={{ ...team, role: 'captain' }}
        show
        onHide={vi.fn()}
      />,
    );
    expect(screen.getByText('Você participa como capitão')).toBeInTheDocument();
  });

  it('formats appointment description, schedule, status, and image details', () => {
    const appointment: Conversation = {
      id: 'a1',
      kind: 'appointment',
      label: 'Jogo',
      image: '/arena.png',
    };
    const { rerender } = render(
      <ConversationDetailsModal
        conversation={appointment}
        show
        onHide={vi.fn()}
      />,
    );
    expect(screen.getByText('CONVERSA DO AGENDAMENTO')).toBeInTheDocument();
    expect(
      screen.getByText('Sem descrição adicional para este agendamento.'),
    ).toBeInTheDocument();
    rerender(
      <ConversationDetailsModal
        conversation={{
          ...appointment,
          description: 'Partida',
          scheduledAt: '2026-12-01T20:00:00Z',
          status: 'canceled',
        }}
        show
        onHide={vi.fn()}
      />,
    );
    expect(screen.getByText('Partida')).toBeInTheDocument();
    expect(screen.getByText(/Data:/)).toBeInTheDocument();
    expect(screen.getByText(/Cancelado/)).toBeInTheDocument();
  });
});
