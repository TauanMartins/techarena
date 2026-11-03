import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";

export function MatchResultFields({ matchId, homeName, awayName, scores, saving, hasResult, onChange, onSave }: { matchId: string; homeName: string; awayName: string; scores: { home: string; away: string }; saving: boolean; hasResult: boolean; onChange: (side: "home" | "away", value: string) => void; onSave: () => void }) {
  return <div className="d-flex align-items-end gap-2 mt-3"><Form.Group controlId={`home-score-${matchId}`}><Form.Label className="small">{homeName}</Form.Label><Form.Control type="number" min={0} step={1} aria-label={`Placar de ${homeName}`} value={scores.home} onChange={(event) => onChange("home", event.target.value)} /></Form.Group><span className="pb-2">x</span><Form.Group controlId={`away-score-${matchId}`}><Form.Label className="small">{awayName}</Form.Label><Form.Control type="number" min={0} step={1} aria-label={`Placar de ${awayName}`} value={scores.away} onChange={(event) => onChange("away", event.target.value)} /></Form.Group><Button disabled={saving} onClick={onSave}>{hasResult ? "Atualizar resultado" : "Registrar resultado"}</Button></div>;
}
