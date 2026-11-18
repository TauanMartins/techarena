import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Friend } from '../types/community.types';
import { FriendSections } from './FriendSections';

const friend: Friend = {
  id: 'friend-1',
  status: 'pending',
  user: { id: 'user-1', name: 'Ana', username: 'ana', image: null },
};

describe('FriendSections', () => {
  it('shows empty guidance for incoming requests and accepted friendships', () => {
    render(
      <FriendSections
        incoming={[]}
        friends={[]}
        onDetails={vi.fn()}
        onAccept={vi.fn()}
        onBlock={vi.fn()}
        onChat={vi.fn()}
        busy={false}
      />,
    );
    expect(
      screen.getByText('Nenhuma solicitação pendente por enquanto.'),
    ).toBeInTheDocument();
    expect(screen.getByText(/Sua rede está começando/)).toBeInTheDocument();
  });

  it('offers accept, block, details, and chat actions for listed people', () => {
    const onDetails = vi.fn();
    const onAccept = vi.fn();
    const onBlock = vi.fn();
    const onChat = vi.fn();
    render(
      <FriendSections
        incoming={[friend]}
        friends={[{ ...friend, status: 'accepted' }]}
        onDetails={onDetails}
        onAccept={onAccept}
        onBlock={onBlock}
        onChat={onChat}
        busy={false}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Aceitar' }));
    fireEvent.click(
      screen.getAllByRole('button', { name: 'Ações para Ana' })[0],
    );
    fireEvent.click(screen.getAllByRole('button', { name: 'Bloquear' })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Conversar com Ana' }));
    expect(onAccept).toHaveBeenCalledWith('friend-1');
    expect(onBlock).toHaveBeenCalledWith('friend-1');
    expect(onChat).toHaveBeenCalledWith(friend.user);
    expect(
      screen.getAllByRole('button', { name: 'Ações para Ana' }),
    ).toHaveLength(2);
  });

  it('disables request decisions while a mutation is pending', () => {
    render(
      <FriendSections
        incoming={[friend]}
        friends={[]}
        onDetails={vi.fn()}
        onAccept={vi.fn()}
        onBlock={vi.fn()}
        onChat={vi.fn()}
        busy
      />,
    );
    expect(screen.getByRole('button', { name: 'Aceitar' })).toBeDisabled();
    expect(
      screen.getAllByRole('button', { name: 'Ações para Ana' })[0],
    ).toBeDisabled();
  });
});
