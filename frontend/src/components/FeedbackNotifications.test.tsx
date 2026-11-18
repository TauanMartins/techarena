import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { expect, it } from 'vitest';
import { FeedbackNotifications } from './FeedbackNotifications';
import { notifyFeedback } from './ui/notify-feedback';
it('surfaces new action alerts without moving keyboard focus and allows dismissal', async () => {
  render(
    <>
      <FeedbackNotifications />
      <input aria-label="Rascunho" />
    </>,
  );
  const input = screen.getByLabelText('Rascunho');
  input.focus();
  act(() => notifyFeedback('Atualizado'));
  await waitFor(() =>
    expect(screen.getByRole('status')).toHaveTextContent('Atualizado'),
  );
  expect(input).toHaveFocus();
  fireEvent.click(screen.getByLabelText('Fechar aviso'));
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  act(() => notifyFeedback('Falha ao salvar', true));
  expect(screen.getByRole('alert')).toHaveTextContent('Falha ao salvar');
});
