import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Conversation } from '../types/conversation.types';
import { ConversationAvatar } from './ConversationAvatar';

describe('ConversationAvatar', () => {
  it('uses profile presentation for direct conversations', () => {
    render(<ConversationAvatar conversation={{ id: 'u1', kind: 'direct', label: 'Ana', image: null }} />);
    expect(screen.getByRole('img', { name: 'Avatar padrão de Ana' })).toBeInTheDocument();
  });

  it('uses a team or appointment icon when no image is available', () => {
    const { rerender } = render(<ConversationAvatar conversation={{ id: 't1', kind: 'team', label: 'Aurora' }} />);
    expect(screen.getByRole('img', { name: 'Equipe Aurora' })).toBeInTheDocument();
    rerender(<ConversationAvatar conversation={{ id: 'a1', kind: 'appointment', label: 'Jogo' }} />);
    expect(screen.getByRole('img', { name: 'Agendamento Jogo' })).toBeInTheDocument();
  });

  it('shows the image for team and appointment conversations', () => {
    const conversation: Conversation = { id: 'team-1', kind: 'team', label: 'Aurora', image: '/team.png' };
    render(<ConversationAvatar conversation={conversation} />);
    expect(screen.getByRole('img', { name: 'Imagem de Aurora' })).toHaveAttribute('src', '/team.png');
  });
});
