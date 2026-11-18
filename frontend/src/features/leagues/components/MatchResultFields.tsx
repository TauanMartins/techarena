import Button from 'react-bootstrap/Button';
import { NumberStepper } from '../../../components/ui/NumberStepper';

export function MatchResultFields({
  matchId,
  homeName,
  awayName,
  scores,
  saving,
  hasResult,
  onChange,
  onSave,
}: {
  matchId: string;
  homeName: string;
  awayName: string;
  scores: { home: string; away: string };
  saving: boolean;
  hasResult: boolean;
  onChange: (side: 'home' | 'away', value: string) => void;
  onSave: () => void;
}) {
  return (
    <div className="row g-2 align-items-end mt-2">
      <div className="col-6 col-md-4">
        <NumberStepper
          id={`home-score-${matchId}`}
          label={homeName}
          value={scores.home}
          onChange={(value) => onChange('home', value)}
          disabled={saving}
        />
      </div>
      <div className="col-6 col-md-4">
        <NumberStepper
          id={`away-score-${matchId}`}
          label={awayName}
          value={scores.away}
          onChange={(value) => onChange('away', value)}
          disabled={saving}
        />
      </div>
      <div className="col-12 col-md-4 d-grid">
        <Button
          disabled={saving}
          onClick={onSave}
        >
          <i
            className="bi bi-check-lg me-2"
            aria-hidden="true"
          />
          {hasResult ? 'Atualizar resultado' : 'Registrar resultado'}
        </Button>
      </div>
    </div>
  );
}
