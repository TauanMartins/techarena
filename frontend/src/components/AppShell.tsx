import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { ErrorState } from './Feedback';
import Button from 'react-bootstrap/Button';
import Image from 'react-bootstrap/Image';
import Navbar from 'react-bootstrap/Navbar';
import logo from '../assets/brand/logo-dark.png';

const navigation = [
  { to: '/', label: 'Início', icon: 'bi-grid-1x2-fill', end: true },
  { to: '/agendamentos', label: 'Agendamentos', icon: 'bi-calendar2-event' },
  { to: '/ligas', label: 'Ligas', icon: 'bi-trophy' },
  { to: '/equipes', label: 'Equipes', icon: 'bi-people' },
  { to: '/social', label: 'Comunidade', icon: 'bi-person-hearts' },
  { to: '/chat', label: 'Conversas', icon: 'bi-chat-dots' },
  { to: '/configuracoes', label: 'Configurações', icon: 'bi-gear' },
];

export function AppShell() {
  const { profile, logout, session, profileError, refreshProfile } = useAuth();
  const location = useLocation();
  const [logoutError, setLogoutError] = useState<string | null>(null);

  async function handleLogout() {
    setLogoutError(null);
    try {
      await logout();
    } catch (cause) {
      setLogoutError(cause instanceof Error ? cause.message : 'Não foi possível encerrar a sessão.');
    }
  }

  if (profileError || !profile) {
    return (
      <main className="container profile-error-page">
        <img src={logo} className="brand-logo" alt="TechArena" />
        <h1>Não foi possível carregar seu perfil</h1>
        <p>
          O login foi validado pelo Supabase, mas a API atual não encontrou ou não
          conseguiu consultar seu perfil. Confira a configuração do trigger de
          cadastro e do banco usado pelo backend.
        </p>
        <ErrorState message={profileError ?? 'Perfil indisponível.'} />
        {logoutError && <div className="mt-3"><ErrorState message={logoutError} /></div>}
        <div className="d-flex gap-2 mt-3">
          <Button variant="primary" onClick={() => void refreshProfile()}>
            Tentar novamente
          </Button>
          <Button variant="outline-secondary" onClick={() => void handleLogout()}>
            Sair
          </Button>
        </div>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <NavLink to="/" className="brand-lockup" aria-label="TechArena, início">
          <img src={logo} alt="" className="brand-logo" />
          <span>TECHARENA</span>
        </NavLink>
        <div className="sidebar-caption">MENU PRINCIPAL</div>
        <nav className="sidebar-nav" aria-label="Navegação principal">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={'end' in item ? item.end : false}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              <i className={`bi ${item.icon}`} aria-hidden="true" />
              {item.label}
              {item.to === '/chat' && (
                <span className="sidebar-link-hint" aria-label="Mensagens em tempo real">
                  <i className="bi bi-lightning-charge-fill" />
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="connection-indicator">
            <span />
            Sessão autenticada
          </div>
          <small>API protegida por access token Supabase</small>
        </div>
      </aside>

      <div className="app-main">
        <Navbar className="topbar">
          <div className="topbar-mobile-brand">
            <img src={logo} alt="" />
            <span>TECHARENA</span>
          </div>
          <div className="topbar-current">{navigation.find((item) => item.to === location.pathname)?.label ?? 'TechArena'}</div>
          <div className="topbar-user">
            <div className="user-avatar">
              {profile.image ? (
                <Image src={profile.image} alt="" roundedCircle />
              ) : (
                (profile.name ?? profile.username ?? 'A').slice(0, 1).toUpperCase()
              )}
            </div>
            <div className="user-summary">
              <strong>{profile.name ?? profile.username ?? session?.user.email ?? 'Atleta'}</strong>
              <small>{profile.username ? `@${profile.username}` : 'Atleta TechArena'}</small>
            </div>
          </div>
        </Navbar>
        <main className="page-content">
          <Outlet />
        </main>
        <footer className="app-footer">TechArena · esporte é melhor em equipe</footer>
      </div>
    </div>
  );
}
