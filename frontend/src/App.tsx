import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './auth/AuthProvider';
import { useAuth } from './auth/useAuth';
import { AppShell } from './components/AppShell';
import { LoadingState } from './components/Feedback';
import { LoginPage } from './pages/LoginPage';
import { ThemeProvider } from './features/preferences/ThemeProvider';
import { queryClient } from './shared/queryClient';

const AppointmentsPage = lazy(() =>
  import('./pages/AppointmentsPage').then((module) => ({
    default: module.AppointmentsPage,
  })),
);
const ChatPage = lazy(() =>
  import('./pages/ChatPage').then((module) => ({
    default: module.ChatPage,
  })),
);
const CommunityPage = lazy(() =>
  import('./pages/CommunityPage').then((module) => ({
    default: module.CommunityPage,
  })),
);
const HomePage = lazy(() =>
  import('./pages/HomePage').then((module) => ({
    default: module.HomePage,
  })),
);
const LeaguePage = lazy(() =>
  import('./pages/LeaguePage').then((module) => ({
    default: module.LeaguePage,
  })),
);
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage').then((module) => ({
    default: module.SettingsPage,
  })),
);
const TeamsPage = lazy(() =>
  import('./pages/TeamsPage').then((module) => ({
    default: module.TeamsPage,
  })),
);

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
    <Suspense
      fallback={
        <main className="login-loading">
          <LoadingState label="Carregando página..." />
        </main>
      }
    >
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
    </Suspense>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <BrowserRouter>
            <ApplicationRoutes />
          </BrowserRouter>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
