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

function dateInputToday() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function SettingsPage() {
  const { session, profile, logout, refreshProfile } = useAuth();
  const { theme, saveTheme, error: themeError } = useThemePreference();
  const token = session!.access_token;
  const [sports, setSports] = useState<Sport[]>([]);
  const [favorites, setFavorites] = useState<FavoriteSports | null>(null);
  const [selectedSportIds, setSelectedSportIds] = useState<string[]>([]);
  const [selectedTheme, setSelectedTheme] = useState(theme);
  const [name, setName] = useState(profile?.name ?? '');
  const [username, setUsername] = useState(profile?.username ?? '');
  const [birthDate, setBirthDate] = useState(profile?.birthDate ?? '');
  const [gender, setGender] = useState(profile?.gender ?? '');
  const [image, setImage] = useState(profile?.image ?? '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [preferencesSaving, setPreferencesSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const today = dateInputToday();

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
    const payload = {
      name: name.trim(),
      username: username.trim().toLowerCase(),
      birthDate,
      gender: gender || null,
      image: image.trim() || null,
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
              <Form.Group className="mb-3">
                <Form.Label htmlFor="profile-name">Nome</Form.Label>
                <Form.Control id="profile-name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={150} autoComplete="name" />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label htmlFor="profile-username">Nome de usuário</Form.Label>
                <Form.Control id="profile-username" value={username} onChange={(event) => setUsername(event.target.value.toLowerCase())} required minLength={3} maxLength={45} pattern="[a-z0-9_]+" aria-describedby="username-help" autoComplete="username" />
                <Form.Text id="username-help">Use letras minúsculas, números e sublinhado.</Form.Text>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label htmlFor="profile-birth-date">Data de nascimento</Form.Label>
                <Form.Control id="profile-birth-date" type="date" value={birthDate} max={today} onChange={(event) => setBirthDate(event.target.value)} required autoComplete="bday" aria-describedby="birth-date-help" />
                <Form.Text id="birth-date-help">Informe uma data válida. É necessário ter pelo menos 18 anos para participar de agendamentos.</Form.Text>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label htmlFor="profile-gender">Gênero</Form.Label>
                <Form.Select id="profile-gender" value={gender} onChange={(event) => setGender(event.target.value)}>
                  <option value="">Prefiro não informar</option>
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                  <option value="O">Outro</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label htmlFor="profile-image">URL da imagem de perfil</Form.Label>
                <Form.Control id="profile-image" type="url" value={image} onChange={(event) => setImage(event.target.value)} maxLength={150} pattern="https://.+" aria-describedby="image-help" />
                <Form.Text id="image-help">Use uma URL HTTPS de até 150 caracteres. Deixe em branco para remover a imagem.</Form.Text>
              </Form.Group>
              <Form.Group className="mb-4">
                <Form.Label htmlFor="profile-email">E-mail</Form.Label>
                <Form.Control id="profile-email" value={profile?.email ?? session?.user.email ?? ''} disabled readOnly />
                <Form.Text>O e-mail é gerenciado pelo provedor de autenticação.</Form.Text>
              </Form.Group>
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
