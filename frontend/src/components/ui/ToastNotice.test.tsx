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
