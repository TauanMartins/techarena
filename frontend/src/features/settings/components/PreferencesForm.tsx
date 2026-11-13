import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import type { Sport } from '../types/settings.types';

export function PreferencesForm({
  sports,
  selectedSportIds,
  maxFavorites,
  theme,
  busy,
  onThemeChange,
  onToggleSport,
  onSave,
}: {
  sports: Sport[];
  selectedSportIds: string[];
  maxFavorites: number;
  theme: 'light' | 'dark' | 'system';
  busy: boolean;
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
  onToggleSport: (sportId: string) => void;
  onSave: () => void;
}) {
  return (
    <>
      <Form.Group className="mb-4">
        <Form.Label>Tema</Form.Label>
        <Form.Select
          value={theme}
          onChange={(event) =>
            onThemeChange(event.target.value as typeof theme)
          }
        >
          <option value="system">Usar tema do dispositivo</option>
          <option value="light">Claro</option>
          <option value="dark">Escuro</option>
        </Form.Select>
      </Form.Group>
      <div className="d-flex justify-content-between align-items-end mb-2">
        <Form.Label className="mb-0">Esportes favoritos</Form.Label>
        <small className="text-secondary">
          {selectedSportIds.length}/{maxFavorites}
        </small>
      </div>
      <div className="d-flex flex-wrap gap-3 border rounded-3 p-3">
        {sports.map((sport) => (
          <Form.Check
            type="checkbox"
            key={sport.id}
            id={`sport-${sport.id}`}
            label={sport.name}
            checked={selectedSportIds.includes(sport.id)}
            disabled={
              !selectedSportIds.includes(sport.id) &&
              selectedSportIds.length >= maxFavorites
            }
            onChange={() => onToggleSport(sport.id)}
          />
        ))}
      </div>
      <Button
        className="mt-4"
        onClick={onSave}
        disabled={busy}
      >
        {busy ? 'Salvando...' : 'Salvar preferências'}
      </Button>
    </>
  );
}
