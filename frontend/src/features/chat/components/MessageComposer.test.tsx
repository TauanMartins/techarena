import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { FormEvent } from 'react';
import { MessageComposer } from './MessageComposer';

describe('MessageComposer', () => {
  it('blocks empty and whitespace-only messages, then enables send only when connected', () => {
    const onSubmit = vi.fn((event: FormEvent<HTMLFormElement>) => event.preventDefault());
    const onTextChange = vi.fn();
    const { rerender } = render(<MessageComposer text="" onTextChange={onTextChange} onSubmit={onSubmit} sending={false} connected />);
    const send = screen.getByRole('button', { name: 'Enviar mensagem' });
    expect(send).toBeDisabled();
    fireEvent.change(screen.getByRole('textbox', { name: 'Mensagem' }), { target: { value: '   ' } });
    expect(onTextChange).toHaveBeenCalledWith('   ');
    rerender(<MessageComposer text="   " onTextChange={onTextChange} onSubmit={onSubmit} sending={false} connected />);
    expect(send).toBeDisabled();
    rerender(<MessageComposer text="Olá" onTextChange={onTextChange} onSubmit={onSubmit} sending={false} connected={false} />);
    expect(send).toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'Mensagem' })).toBeDisabled();
    rerender(<MessageComposer text="Olá" onTextChange={onTextChange} onSubmit={onSubmit} sending connected />);
    expect(send).toBeDisabled();
  });

  it('submits a non-empty message when ready', () => {
    const onSubmit = vi.fn((event: FormEvent<HTMLFormElement>) => event.preventDefault());
    render(<MessageComposer text="Olá" onTextChange={vi.fn()} onSubmit={onSubmit} sending={false} connected />);
    fireEvent.click(screen.getByRole('button', { name: 'Enviar mensagem' }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });
});
