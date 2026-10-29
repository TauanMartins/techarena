import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('application entry', () => {
  it('shows a general availability message when login is not configured', async () => {
    render(<App />);

    expect(
      await screen.findByRole('button', { name: 'Continuar com Google' }),
    ).toBeDisabled();
    expect(
      screen.getByText(
        'O login está indisponível no momento. Tente novamente mais tarde.',
      ),
    ).toBeInTheDocument();
  });
});
