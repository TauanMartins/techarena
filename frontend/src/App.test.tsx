import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('application entry', () => {
  it('explains which Supabase configuration is required before login', async () => {
    render(<App />);

    expect(await screen.findByRole('button', { name: 'Continuar com Google' })).toBeDisabled();
    expect(screen.getByText(/SUPABASE_URL/)).toBeInTheDocument();
  });
});
