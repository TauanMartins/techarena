import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import { useAuth } from '../auth/AuthProvider';
import { useThemePreference } from '../features/preferences/ThemeProvider';
import { ErrorState, LoadingState, PageHeading } from '../components/Feedback';
import { api } from '../shared/api';
import type { FavoriteSports, Sport } from '../shared/types';

export function SettingsPage() {
  const { session, profile, logout, refreshProfile } = useAuth();
  const { theme, saveTheme, error: themeError } = useThemePreference();
  const token = session!.access_token;
  const [sports, setSports] = useState<Sport[]>([]);
  const [favorites, setFavorites] = useState<FavoriteSports | null>(null);
  const [selectedSportIds, setSelectedSportIds] = useState<string[]>([]);
  const [selectedTheme, setSelectedTheme] = useState(theme);
  const [profileSaving, setProfileSaving] = useState(false);
  const [preferencesSaving, setPreferencesSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sportPage, favoriteSports] = await Promise.all([
        api.getSports(token),
        api.getFavoriteSports(token),
      ]);
      setSports(sportPage.items);
      setFavorites(favoriteSports);
      setSelectedSportIds(favoriteSports.items.map((sport) => sport.id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível carregar as configurações.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void loadSettings(); }, [loadSettings]);
  useEffect(() => { setSelectedTheme(theme); }, [theme]);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get('name') ?? '').trim(),
      username: String(formData.get('username') ?? '').trim().toLowerCase(),
    };
    setProfileSaving(true);
    setError(null);
    setNotice(null);
    try {
      await api.updateProfile(token, payload);
      await refreshProfile();
      setNotice('Perfil atualizado.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível atualizar o perfil.');
    } finally {
      setProfileSaving(false);
    }
  }

  async function savePreferences() {
    setPreferencesSaving(true);
    setError(null);
    setNotice(null);
    try {
      await Promise.all([
        api.replaceFavoriteSports(token, selectedSportIds),
        saveTheme(selectedTheme),
      ]);
      setNotice('Preferências salvas.');
      await loadSettings();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar as preferências.');
    } finally {
      setPreferencesSaving(false);
    }
  }

  async function signOut() {
    setError(null);
    try {
      await logout();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível encerrar a sessão.');
    }
  }

  function toggleSport(sportId: string) {
    setSelectedSportIds((current) => {
      if (current.includes(sportId)) return current.filter((id) => id !== sportId);
      if (favorites && current.length >= favorites.maxFavorites) return current;
      return [...current, sportId];
    });
  }

  return (
    <>
      <PageHeading eyebrow="SUA CONTA" title="Configurações" description="Atualize seus dados e personalize sua experiência no TechArena." />
      {notice && <Alert variant="success"><i className="bi bi-check-circle me-2" />{notice}</Alert>}
      {(error || themeError) && <ErrorState message={error ?? themeError!} />}
      {loading && <LoadingState label="Carregando preferências..." />}
      <div className="settings-grid">
        <Card className="content-card">
          <Card.Body>
            <div className="section-title-row"><div><span className="eyebrow">DADOS DA CONTA</span><h2>Meu perfil</h2></div></div>
            <Form onSubmit={(event) => void saveProfile(event)}>
              <Form.Group className="mb-3"><Form.Label>Nome</Form.Label><Form.Control name="name" defaultValue={profile?.name ?? ''} required maxLength={150} /></Form.Group>
              <Form.Group className="mb-3"><Form.Label>Nome de usuário</Form.Label><Form.Control name="username" defaultValue={profile?.username ?? ''} required minLength={3} maxLength={45} pattern="[a-z0-9_]+" aria-describedby="username-help" /><Form.Text id="username-help">Use letras minúsculas, números e sublinhado.</Form.Text></Form.Group>
              <Form.Group className="mb-4"><Form.Label>E-mail</Form.Label><Form.Control value={profile?.email ?? session?.user.email ?? ''} disabled readOnly /></Form.Group>
              <Button type="submit" disabled={profileSaving}>{profileSaving ? 'Salvando...' : 'Salvar perfil'}</Button>
            </Form>
          </Card.Body>
        </Card>
        <Card className="content-card">
          <Card.Body>
            <div className="section-title-row"><div><span className="eyebrow">PERSONALIZAÇÃO</span><h2>Preferências</h2></div></div>
            <Form.Group className="mb-4">
              <Form.Label>Tema</Form.Label>
              <Form.Select value={selectedTheme} onChange={(event) => setSelectedTheme(event.target.value as 'light' | 'dark' | 'system')}>
                <option value="system">Usar tema do dispositivo</option>
                <option value="light">Claro</option>
                <option value="dark">Escuro</option>
              </Form.Select>
            </Form.Group>
            <div className="d-flex justify-content-between align-items-end mb-2">
              <Form.Label className="mb-0">Esportes favoritos</Form.Label>
              <small className="text-secondary">{selectedSportIds.length}/{favorites?.maxFavorites ?? 5}</small>
            </div>
            <div className="sports-select-list">
              {sports.map((sport) => (
                <Form.Check
                  type="checkbox"
                  key={sport.id}
                  id={`sport-${sport.id}`}
                  label={sport.name}
                  checked={selectedSportIds.includes(sport.id)}
                  disabled={!selectedSportIds.includes(sport.id) && selectedSportIds.length >= (favorites?.maxFavorites ?? 5)}
                  onChange={() => toggleSport(sport.id)}
                />
              ))}
            </div>
            <Button className="mt-4" onClick={() => void savePreferences()} disabled={preferencesSaving || loading}>
              {preferencesSaving ? 'Salvando...' : 'Salvar preferências'}
            </Button>
          </Card.Body>
        </Card>
      </div>
      <Card className="content-card mt-4 logout-card">
        <Card.Body>
          <div><h3>Encerrar sessão</h3><p>Saia da sua conta neste dispositivo.</p></div>
          <Button variant="outline-danger" onClick={() => void signOut()}>Sair da conta <i className="bi bi-box-arrow-right ms-2" /></Button>
        </Card.Body>
      </Card>
    </>
  );
}
