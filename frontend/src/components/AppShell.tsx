import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { ErrorState } from './Feedback';
import Button from 'react-bootstrap/Button';
import Image from 'react-bootstrap/Image';
import Navbar from 'react-bootstrap/Navbar';
import logo from '../assets/brand/logo-dark.png';

const navigation = [
  { to: '/', label: 'Início', icon: 'bi-grid-1x2-fill', end: true },
  { to: '/agendamentos', label: 'Agendamentos', icon: 'bi-calendar2-event' },
  { to: '/ligas', label: 'Ligas', icon: 'bi-trophy' },
  { to: '/configuracoes', label: 'Configurações', icon: 'bi-gear' },
];

const communityNavigation = [
  { to: '/social', label: 'Comunidade', icon: 'bi-person-hearts', end: true },
  { to: '/equipes', label: 'Equipes', icon: 'bi-people', end: true },
  { to: '/chat', label: 'Conversas', icon: 'bi-chat-dots' },
];

export function AppShell() {
  const { profile, logout, session, profileError, refreshProfile } = useAuth();
  const location = useLocation();
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [communitiesOpen, setCommunitiesOpen] = useState(() =>
    communityNavigation.some((item) =>
      item.to === '/chat'
        ? location.pathname.startsWith(item.to)
        : location.pathname === item.to,
    ),
  );
  const isCommunityRoute = communityNavigation.some((item) =>
    item.to === '/chat'
      ? location.pathname.startsWith(item.to)
      : location.pathname === item.to,
  );

  async function handleLogout() {
    setLogoutError(null);
    try {
      await logout();
    } catch (cause) {
      setLogoutError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível encerrar a sessão.',
      );
    }
  }

  if (profileError || !profile) {
    return (
      <main className="container profile-error-page">
        <img src={logo} className="brand-logo" alt="TechArena" />
        <h1>Não foi possível carregar seu perfil</h1>
        <p>
          Não foi possível carregar os dados do seu perfil. Tente novamente em
          alguns instantes.
        </p>
        <ErrorState message={profileError ?? 'Perfil indisponível.'} />
        {logoutError && (
          <div className="mt-3">
            <ErrorState message={logoutError} />
          </div>
        )}
        <div className="d-flex gap-2 mt-3">
          <Button variant="primary" onClick={() => void refreshProfile()}>
            Tentar novamente
          </Button>
          <Button
            variant="outline-secondary"
            onClick={() => void handleLogout()}
          >
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
          {navigation.slice(0, 3).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={'end' in item ? item.end : false}
              className={({ isActive }) =>
                `sidebar-link${isActive ? ' active' : ''}`
              }
            >
              <i className={`bi ${item.icon}`} aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
          <div className={`sidebar-community${communitiesOpen ? ' open' : ''}`}>
            <button
              type="button"
              className={`sidebar-link sidebar-community-toggle${isCommunityRoute ? ' active' : ''}`}
              aria-expanded={communitiesOpen}
              aria-controls="sidebar-community-links"
              onClick={() => setCommunitiesOpen((open) => !open)}
            >
              <i className="bi bi-people-fill" aria-hidden="true" />
              Comunidades
              <i
                className="bi bi-chevron-down sidebar-community-chevron"
                aria-hidden="true"
              />
            </button>
            <div
              className="sidebar-community-links"
              id="sidebar-community-links"
              hidden={!communitiesOpen}
            >
              {communityNavigation.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `sidebar-link sidebar-community-link${isActive ? ' active' : ''}`
                  }
                >
                  <i className={`bi ${item.icon}`} aria-hidden="true" />
                  {item.label}
                  {item.to === '/chat' && (
                    <span
                      className="sidebar-link-hint"
                      aria-label="Mensagens em tempo real"
                    >
                      <i className="bi bi-lightning-charge-fill" />
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
          {navigation.slice(3).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={'end' in item ? item.end : false}
              className={({ isActive }) =>
                `sidebar-link${isActive ? ' active' : ''}`
              }
            >
              <i className={`bi ${item.icon}`} aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="app-main">
        <Navbar className="topbar">
          <div className="topbar-mobile-brand">
            <img src={logo} alt="" />
            <span>TECHARENA</span>
          </div>
          <div className="topbar-current">
            {navigation.find((item) => item.to === location.pathname)?.label ??
              communityNavigation.find((item) =>
                item.to === '/chat'
                  ? location.pathname.startsWith(item.to)
                  : item.to === location.pathname,
              )?.label ??
              'TechArena'}
          </div>
          <div className="topbar-user">
            <div className="user-avatar">
              {profile.image ? (
                <Image src={profile.image} alt="" roundedCircle />
              ) : (
                (profile.name ?? profile.username ?? 'A')
                  .slice(0, 1)
                  .toUpperCase()
              )}
            </div>
            <div className="user-summary">
              <strong>
                {profile.name ??
                  profile.username ??
                  session?.user.email ??
                  'Atleta'}
              </strong>
              <small>
                {profile.username ? `@${profile.username}` : 'Atleta TechArena'}
              </small>
            </div>
          </div>
        </Navbar>
        <main className="page-content">
          <Outlet />
        </main>
        <footer className="app-footer">
          TechArena · esporte é melhor em equipe
        </footer>
      </div>
    </div>
  );
}
