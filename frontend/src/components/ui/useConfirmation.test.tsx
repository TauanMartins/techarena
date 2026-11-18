import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { useConfirmation } from './useConfirmation';

it('only executes the action after confirmation and supports canceling', async () => {
  const action = vi.fn();
  function Fixture() {
    const confirmation = useConfirmation();
    return (
      <>
        <button
          onClick={() =>
            confirmation.request({
              title: 'Excluir equipe',
              message: 'Esta ação remove a equipe.',
              label: 'Excluir',
              onConfirm: action,
            })
          }
        >
          Gerenciar
        </button>
        {confirmation.dialog}
      </>
    );
  }
  const user = userEvent.setup();
  render(<Fixture />);
  await user.click(screen.getByText('Gerenciar'));
  expect(action).not.toHaveBeenCalled();
  await user.click(screen.getByText('Cancelar'));
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  );
  expect(action).not.toHaveBeenCalled();
  await user.click(screen.getByText('Gerenciar'));
  await user.click(screen.getByRole('button', { name: 'Excluir' }));
  await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
});
