import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { NumberStepper } from './NumberStepper';
it('increments, decrements, permits direct editing and respects score bounds', () => {
  function Fixture() {
    const [value, setValue] = useState('0');
    return (
      <NumberStepper
        id="score"
        label="Casa"
        value={value}
        onChange={setValue}
        max={3}
      />
    );
  }
  render(<Fixture />);
  expect(screen.getByRole('button', { name: 'Diminuir Casa' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Aumentar Casa' }));
  expect(screen.getByRole('spinbutton')).toHaveValue(1);
  fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '3' } });
  expect(screen.getByRole('button', { name: 'Aumentar Casa' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Diminuir Casa' }));
  expect(screen.getByRole('spinbutton')).toHaveValue(2);
});
