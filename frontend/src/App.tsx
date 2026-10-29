import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthProvider';
import { AppShell } from './components/AppShell';
import { LoadingState } from './components/Feedback';
import { ChatPage } from './pages/ChatPage';
import { CommunityPage } from './pages/CommunityPage';
import { HomePage } from './pages/HomePage';
import { AppointmentsPage } from './pages/AppointmentsPage';
import { LeaguePage } from './pages/LeaguePage';
import { LoginPage } from './pages/LoginPage';
import { SettingsPage } from './pages/SettingsPage';
import { TeamsPage } from './pages/TeamsPage';
import { ThemeProvider } from './features/preferences/ThemeProvider';

function ApplicationRoutes() {
  const { session, profile, loading, profileLoading, profileError } = useAuth();
  if (loading) {
    return <main className="login-loading"><LoadingState label="Restaurando sua sessão..." /></main>;
  }
  if (!session) return <LoginPage />;
  if (profileLoading) {
    return <main className="login-loading"><LoadingState label="Carregando seu perfil..." /></main>;
  }
  if (profileError || !profile) return <AppShell />;

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="agendamentos" element={<AppointmentsPage />} />
        <Route path="ligas" element={<LeaguePage />} />
        <Route path="equipes" element={<TeamsPage />} />
        <Route path="social" element={<CommunityPage />} />
        <Route path="chat/:kind?/:id?" element={<ChatPage />} />
        <Route path="configuracoes" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <ApplicationRoutes />
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}
