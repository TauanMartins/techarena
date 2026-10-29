import { useEffect, useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Image from 'react-bootstrap/Image';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/useAuth';
import { useThemePreference } from '../features/preferences/useThemePreference';
import { ErrorState, LoadingState, PageHeading } from '../components/Feedback';
import { api } from '../shared/api';
import {
  profileFormSchema,
  type ProfileFormInput,
  type ProfileFormValues,
} from '../shared/validation';

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
  const userId = session!.user.id;
  const queryClient = useQueryClient();
  const [selectedSportIds, setSelectedSportIds] = useState<string[]>([]);
  const [selectedTheme, setSelectedTheme] = useState(theme);
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
    formState: { errors: profileErrors, isSubmitting: profileSaving },
  } = useForm<ProfileFormInput, undefined, ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: profile?.name ?? '',
      username: profile?.username ?? '',
      birthDate: profile?.birthDate ?? '',
      gender:
        profile?.gender === 'M' ||
        profile?.gender === 'F' ||
        profile?.gender === 'O'
          ? profile.gender
          : '',
    },
  });
  const [notice, setNotice] = useState<string | null>(null);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const today = dateInputToday();
  const settingsQuery = useQuery({
    queryKey: ['settings', userId],
    queryFn: async () => {
      const [sportPage, favoriteSports] = await Promise.all([
        api.getSports(token),
        api.getFavoriteSports(token),
      ]);
      return { sports: sportPage.items, favorites: favoriteSports };
    },
  });
  const sports = settingsQuery.data?.sports ?? [];
  const favorites = settingsQuery.data?.favorites ?? null;
  const loading = settingsQuery.isPending;
  const error = settingsQuery.error;
  const profileMutation = useMutation({
    mutationFn: (payload: {
      name: string;
      username: string;
      birthDate: string;
      gender: string | null;
    }) =>
      api.updateProfile(token, payload),
    onSuccess: async () => {
      await refreshProfile();
      setNotice('Perfil atualizado.');
    },
  });
  const preferencesMutation = useMutation({
    mutationFn: async () => {
      await Promise.all([
        api.replaceFavoriteSports(token, selectedSportIds),
        saveTheme(selectedTheme),
      ]);
    },
    onSuccess: async () => {
      setNotice('Preferências salvas.');
      await queryClient.invalidateQueries({ queryKey: ['settings', userId] });
      await settingsQuery.refetch();
    },
  });
  useEffect(() => { setSelectedTheme(theme); }, [theme]);
  useEffect(() => {
    if (favorites)
      setSelectedSportIds(favorites.items.map((sport) => sport.id));
  }, [favorites]);
  useEffect(() => {
    resetProfile({
      name: profile?.name ?? '',
      username: profile?.username ?? '',
      birthDate: profile?.birthDate ?? '',
      gender:
        profile?.gender === 'M' ||
        profile?.gender === 'F' ||
        profile?.gender === 'O'
          ? profile.gender
          : '',
    });
  }, [profile, resetProfile]);

  async function saveProfile(values: ProfileFormValues) {
    const payload = {
      ...values,
      gender: values.gender || null,
    };
    setNotice(null);
    profileMutation.mutate(payload);
  }

  function savePreferences() {
    setNotice(null);
    preferencesMutation.mutate();
  }

  async function signOut() {
    setLogoutError(null);
    try {
      await logout();
    } catch (cause) {
      setLogoutError(cause instanceof Error ? cause.message : 'Não foi possível encerrar a sessão.');
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
      {(error || themeError || profileMutation.error || preferencesMutation.error || logoutError) && (
        <ErrorState
          message={
            error instanceof Error
              ? error.message
              : profileMutation.error instanceof Error
                ? profileMutation.error.message
                : preferencesMutation.error instanceof Error
                  ? preferencesMutation.error.message
                  : logoutError ?? themeError ?? 'Não foi possível concluir a operação.'
          }
        />
      )}
      {loading && <LoadingState label="Carregando preferências..." />}
      <div className="settings-grid">
        <Card className="content-card">
          <Card.Body>
            <div className="section-title-row"><div><span className="eyebrow">DADOS DA CONTA</span><h2>Meu perfil</h2></div></div>
            <Form
              onSubmit={handleProfileSubmit(saveProfile)}
              noValidate
            >
              <div className="settings-profile-photo mb-4">
                <div className="settings-profile-avatar">
                  {profile?.image ? (
                    <Image src={profile.image} alt="Foto de perfil" roundedCircle />
                  ) : (
                    (profile?.name ?? profile?.username ?? 'A').slice(0, 1).toUpperCase()
                  )}
                </div>
                <div>
                  <strong>Foto de perfil</strong>
                  <p className="mb-0">A foto vinculada à sua conta é exibida aqui e não pode ser alterada nesta tela.</p>
                </div>
              </div>
              <Form.Group className="mb-3">
                <Form.Label htmlFor="profile-name">Nome</Form.Label>
                <Form.Control
                  id="profile-name"
                  autoComplete="name"
                  isInvalid={!!profileErrors.name}
                  {...registerProfile('name')}
                />
                <Form.Control.Feedback type="invalid">
                  {profileErrors.name?.message}
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label htmlFor="profile-username">Nome de usuário</Form.Label>
                <Form.Control
                  id="profile-username"
                  aria-describedby="username-help"
                  autoComplete="username"
                  isInvalid={!!profileErrors.username}
                  {...registerProfile('username')}
                />
                <Form.Text id="username-help">Use letras minúsculas, números e sublinhado.</Form.Text>
                <Form.Control.Feedback type="invalid">
                  {profileErrors.username?.message}
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label htmlFor="profile-birth-date">Data de nascimento</Form.Label>
                <Form.Control
                  id="profile-birth-date"
                  type="date"
                  max={today}
                  autoComplete="bday"
                  aria-describedby="birth-date-help"
                  isInvalid={!!profileErrors.birthDate}
                  {...registerProfile('birthDate')}
                />
                <Form.Text id="birth-date-help">Informe uma data válida. É necessário ter pelo menos 18 anos para participar de agendamentos.</Form.Text>
                <Form.Control.Feedback type="invalid">
                  {profileErrors.birthDate?.message}
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label htmlFor="profile-gender">Gênero</Form.Label>
                <Form.Select
                  id="profile-gender"
                  isInvalid={!!profileErrors.gender}
                  {...registerProfile('gender')}
                >
                  <option value="">Prefiro não informar</option>
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                  <option value="O">Outro</option>
                </Form.Select>
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
            <Button className="mt-4" onClick={savePreferences} disabled={preferencesMutation.isPending || loading}>
              {preferencesMutation.isPending ? 'Salvando...' : 'Salvar preferências'}
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
