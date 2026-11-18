import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';

/** A numeric stepper, with direct editing and keyboard access retained. */
export function NumberStepper({
  id,
  label,
  value,
  onChange,
  disabled = false,
  min = 0,
  max = 100000,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
}) {
  const numeric = value === '' ? min : Number(value);
  const change = (step: number) =>
    onChange(
      String(
        Math.min(
          max,
          Math.max(min, (Number.isFinite(numeric) ? numeric : min) + step),
        ),
      ),
    );
  return (
    <Form.Group controlId={id}>
      <Form.Label className="small">{label}</Form.Label>
      <InputGroup>
        <Button
          variant="outline-secondary"
          disabled={disabled || numeric <= min}
          aria-label={`Diminuir ${label}`}
          onClick={() => change(-1)}
        >
          <i
            className="bi bi-dash"
            aria-hidden="true"
          />
        </Button>
        <Form.Control
          type="number"
          min={min}
          max={max}
          step={1}
          inputMode="numeric"
          className="text-center"
          aria-label={`Placar de ${label}`}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
        />
        <Button
          variant="outline-secondary"
          disabled={disabled || numeric >= max}
          aria-label={`Aumentar ${label}`}
          onClick={() => change(1)}
        >
          <i
            className="bi bi-plus"
            aria-hidden="true"
          />
        </Button>
      </InputGroup>
    </Form.Group>
  );
}
