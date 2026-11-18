import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ToastNotice } from './ToastNotice';
afterEach(() => vi.useRealTimers());
it('automatically dismisses routine feedback using Bootstrap Toast', () => {
  vi.useFakeTimers();
  render(<ToastNotice message="Preferências salvas" />);
  expect(screen.getByRole('status')).toHaveClass('toast');
  act(() => vi.advanceTimersByTime(6100));
  expect(screen.queryByText('Preferências salvas')).not.toBeInTheDocument();
});
it('keeps errors and important confirmations until acknowledged', () => {
  vi.useFakeTimers();
  const { rerender } = render(
    <ToastNotice
      message="Falha ao salvar"
      error
    />,
  );
  act(() => vi.advanceTimersByTime(60000));
  expect(screen.getByRole('alert')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Entendi' }));
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  rerender(
    <ToastNotice
      message="Liga cancelada"
      requiresAcknowledgment
    />,
  );
  act(() => vi.advanceTimersByTime(60000));
  expect(screen.getByText('Liga cancelada')).toBeInTheDocument();
});

it('positions mobile feedback above navigation and desktop feedback at the bottom right', () => {
  const media = vi.spyOn(window, 'matchMedia');
  media.mockReturnValue({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as unknown as MediaQueryList);
  const { unmount } = render(<ToastNotice message="Salvo no celular" />);
  expect(screen.getByRole('status').parentElement).toHaveClass(
    'top-0',
    'start-50',
  );
  expect(screen.getByRole('status')).toHaveClass('bg-body', 'overflow-hidden');
  unmount();
  media.mockReturnValue({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as unknown as MediaQueryList);
  render(<ToastNotice message="Salvo no desktop" />);
  expect(screen.getByRole('status').parentElement).toHaveClass(
    'bottom-0',
    'end-0',
  );
  media.mockRestore();
});
