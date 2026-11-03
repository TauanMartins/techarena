import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "react-bootstrap/Alert";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import { useAuth } from "../auth/useAuth";
import { ErrorState, LoadingState, PageHeading } from "../components/ui/Feedback";
import { ProfileForm } from "../features/settings/components/ProfileForm";
import { PreferencesForm } from "../features/settings/components/PreferencesForm";
import { profileFormSchema, type ProfileFormInput, type ProfileFormValues } from "../features/settings/schemas/profile.schema";
import { useSettingsData, useSavePreferences, useUpdateProfile } from "../features/settings/api/settings.api";
import { useThemePreference } from "../features/preferences/hooks/useThemePreference";
import type { ThemePreference } from "../features/preferences/ThemeContext";

function dateInputToday() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function SettingsPage() {
  const { session, profile, logout, refreshProfile } = useAuth();
  const { theme, saveTheme, error: themeError } = useThemePreference();
  const token = session!.access_token;
  const userId = session!.user.id;
  const settingsQuery = useSettingsData(token, userId);
  const [themeDraft, setThemeDraft] = useState<{ source: ThemePreference; value: ThemePreference } | null>(null);
  const [favoriteDraft, setFavoriteDraft] = useState<{ source: NonNullable<typeof settingsQuery.data>['favorites']; ids: string[] } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ProfileFormInput, undefined, ProfileFormValues>({ resolver: zodResolver(profileFormSchema), defaultValues: { name: profile?.name ?? "", username: profile?.username ?? "", birthDate: profile?.birthDate ?? "", gender: profile?.gender === "M" || profile?.gender === "F" || profile?.gender === "O" ? profile.gender : "" } });
  const updateProfile = useUpdateProfile(token, refreshProfile);
  const savePreferences = useSavePreferences(token, userId, saveTheme);
  const favorites = settingsQuery.data?.favorites;
  const sports = settingsQuery.data?.sports ?? [];
  const selectedTheme = themeDraft?.source === theme ? themeDraft.value : theme;
  const selectedSportIds = favoriteDraft && favoriteDraft.source === favorites ? favoriteDraft.ids : favorites?.items.map((sport) => sport.id) ?? [];
  useEffect(() => { reset({ name: profile?.name ?? "", username: profile?.username ?? "", birthDate: profile?.birthDate ?? "", gender: profile?.gender === "M" || profile?.gender === "F" || profile?.gender === "O" ? profile.gender : "" }); }, [profile, reset]);

  function submitProfile(values: ProfileFormValues) {
    setNotice(null);
    updateProfile.mutate({ ...values, gender: values.gender || null }, { onSuccess: () => setNotice("Perfil atualizado.") });
  }
  function submitPreferences() {
    setNotice(null);
    savePreferences.mutate({ sportIds: selectedSportIds, theme: selectedTheme }, { onSuccess: () => { setNotice("Preferências salvas."); setThemeDraft(null); setFavoriteDraft(null); } });
  }
  async function signOut() {
    setLogoutError(null);
    try { await logout(); } catch (cause) { setLogoutError(cause instanceof Error ? cause.message : "Não foi possível encerrar a sessão."); }
  }
  function toggleSport(id: string) {
    if (!favorites) return;
    setFavoriteDraft((draft) => {
      const current = draft?.source === favorites ? draft.ids : favorites.items.map((sport) => sport.id);
      const ids = current.includes(id) ? current.filter((item) => item !== id) : current.length >= favorites.maxFavorites ? current : [...current, id];
      return { source: favorites, ids };
    });
  }
  const errorMessage = settingsQuery.error instanceof Error ? settingsQuery.error.message : updateProfile.error instanceof Error ? updateProfile.error.message : savePreferences.error instanceof Error ? savePreferences.error.message : logoutError ?? themeError;

  return <>
    <PageHeading eyebrow="SUA CONTA" title="Configurações" description="Atualize seus dados e personalize sua experiência no TechArena." />
    {notice && <Alert variant="success"><i className="bi bi-check-circle me-2" />{notice}</Alert>}
    {errorMessage && <ErrorState message={errorMessage} />}
    {settingsQuery.isPending && <LoadingState label="Carregando preferências..." />}
    <div className="settings-grid">
      <Card className="content-card"><Card.Body><div className="section-title-row"><div><span className="eyebrow">DADOS DA CONTA</span><h2>Meu perfil</h2></div></div><ProfileForm profile={profile} email={profile?.email ?? session?.user.email ?? ""} today={dateInputToday()} register={register} errors={errors} busy={isSubmitting || updateProfile.isPending} onSubmit={(event) => void handleSubmit(submitProfile)(event)} /></Card.Body></Card>
      <Card className="content-card"><Card.Body><div className="section-title-row"><div><span className="eyebrow">PERSONALIZAÇÃO</span><h2>Preferências</h2></div></div><PreferencesForm sports={sports} selectedSportIds={selectedSportIds} maxFavorites={favorites?.maxFavorites ?? 5} theme={selectedTheme} busy={savePreferences.isPending || settingsQuery.isPending} onThemeChange={(value) => setThemeDraft({ source: theme, value })} onToggleSport={toggleSport} onSave={() => void submitPreferences()} /></Card.Body></Card>
    </div>
    <Card className="content-card mt-4 logout-card"><Card.Body><div><h3>Encerrar sessão</h3><p>Saia da sua conta neste dispositivo.</p></div><Button variant="outline-danger" onClick={() => void signOut()}>Sair da conta <i className="bi bi-box-arrow-right ms-2" /></Button></Card.Body></Card>
  </>;
}
