import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { ErrorState } from './ui/Feedback';
import { NavigationLink } from './NavigationLink';
import { CommunityNavigation } from './CommunityNavigation';
import { communityNavigation } from './CommunityNavigation.data';
import Button from 'react-bootstrap/Button';
import { ProfileAvatar } from './ui/ProfileAvatar';
import Navbar from 'react-bootstrap/Navbar';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Nav from 'react-bootstrap/Nav';
import logo from '../assets/brand/logo-dark.png';
import { navigation } from './AppNavigation.data';
import { MobileNavigation } from './MobileNavigation';

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
      <Container
        as="main"
        className="min-vh-100 d-flex align-items-center py-5"
      >
        <Row className="justify-content-center w-100 g-0">
          <Col
            md={8}
            lg={6}
            className="bg-body border rounded-4 shadow-sm p-4 p-md-5"
          >
            <img
              src={logo}
              width={56}
              height={56}
              className="object-fit-contain bg-white rounded-3 p-1 mb-4"
              alt="TechArena"
            />
            <h1 className="h3 fw-bold">Não foi possível carregar seu perfil</h1>
            <p className="text-body-secondary">
              Não foi possível carregar os dados do seu perfil. Tente novamente
              em alguns instantes.
            </p>
            <ErrorState message={profileError ?? 'Perfil indisponível.'} />
            {logoutError && (
              <div className="mt-3">
                <ErrorState message={logoutError} />
              </div>
            )}
            <div className="d-flex flex-wrap gap-2 mt-3">
              <Button
                variant="primary"
                onClick={() => void refreshProfile()}
              >
                Tentar novamente
              </Button>
              <Button
                variant="outline-secondary"
                onClick={() => void handleLogout()}
              >
                Sair
              </Button>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container
      fluid
      className="vh-100 h-dvh d-flex flex-column bg-body-tertiary p-0 pt-safe-0 ps-safe-0 pe-safe-0 overflow-hidden"
    >
      <a
        href="#main-content"
        className="visually-hidden-focusable position-absolute top-0 start-0 z-3 bg-body p-3"
      >
        Pular para o conteúdo
      </a>
      <Row className="g-0 flex-grow-1 min-h-0 flex-nowrap overflow-hidden">
        <Col
          as="aside"
          xs={12}
          lg={3}
          xxl={2}
          className="d-none d-lg-block bg-body border-end border-bottom flex-shrink-0 mh-100 overflow-auto p-4"
        >
          <Navbar
            expand="lg"
            className="d-block p-0"
            key={location.pathname}
          >
            <div className="d-flex align-items-center justify-content-between gap-2 mb-lg-4">
              <NavLink
                to="/"
                className="d-flex align-items-center gap-2 text-body text-decoration-none fw-bold"
                aria-label="TechArena, início"
              >
                <img
                  src={logo}
                  alt=""
                  width={36}
                  height={36}
                  className="object-fit-contain bg-white rounded-3 p-1"
                />
                <span>TECHARENA</span>
              </NavLink>
              <Navbar.Toggle
                aria-controls="main-navigation"
                label="Abrir ou fechar menu"
              />
            </div>
            <Navbar.Collapse
              id="main-navigation"
              className="mt-3 mt-lg-0"
            >
              <div className="w-100">
                <div className="d-none d-lg-block small fw-semibold text-body-secondary mb-3">
                  MENU PRINCIPAL
                </div>
                <Nav
                  as="nav"
                  variant="pills"
                  navbar={false}
                  className="flex-column gap-2"
                  aria-label="Navegação principal"
                >
                  {navigation.slice(0, 3).map((item) => (
                    <NavigationLink
                      key={item.to}
                      to={item.to}
                      label={item.label}
                      icon={item.icon}
                      end={'end' in item ? item.end : false}
                    />
                  ))}
                  <CommunityNavigation
                    open={communitiesOpen}
                    active={isCommunityRoute}
                    onToggle={() => setCommunitiesOpen((open) => !open)}
                  />
                  {navigation.slice(3).map((item) => (
                    <NavigationLink
                      key={item.to}
                      to={item.to}
                      label={item.label}
                      icon={item.icon}
                      end={'end' in item ? item.end : false}
                    />
                  ))}
                </Nav>
              </div>
            </Navbar.Collapse>
          </Navbar>
        </Col>

        <Col
          xs={12}
          lg={9}
          xxl={10}
          className="d-flex flex-column flex-grow-1 flex-shrink-1 min-h-0 overflow-hidden"
        >
          <Navbar className="bg-body border-bottom px-3 px-md-4 py-2 py-lg-3 gap-3 flex-shrink-0">
            <div className="small text-body-secondary fw-semibold">
              {navigation.find((item) => item.to === location.pathname)
                ?.label ??
                communityNavigation.find((item) =>
                  item.to === '/chat'
                    ? location.pathname.startsWith(item.to)
                    : item.to === location.pathname,
                )?.label ??
                'TechArena'}
            </div>
            <div className="d-flex align-items-center gap-2 ms-auto">
              <ProfileAvatar
                name={profile.name ?? profile.username}
                image={profile.image}
              />
              <div className="d-none d-sm-flex flex-column small text-break">
                <strong>
                  {profile.name ??
                    profile.username ??
                    session?.user.email ??
                    'Atleta'}
                </strong>
                <small className="text-body-secondary">
                  {profile.username
                    ? `@${profile.username}`
                    : 'Atleta TechArena'}
                </small>
              </div>
            </div>
          </Navbar>
          {isCommunityRoute && (
            <Nav
              as="nav"
              variant="pills"
              fill
              className="d-lg-none flex-nowrap gap-1 p-2 bg-body border-bottom flex-shrink-0"
              aria-label="Navegação social mobile"
            >
              {communityNavigation.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `nav-link touch-target d-flex align-items-center justify-content-center flex-fill small px-2 py-2${isActive ? ' active' : ' text-body-secondary'}`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </Nav>
          )}
          <Container
            fluid
            as="main"
            id="main-content"
            tabIndex={-1}
            className="flex-grow-1 min-h-0 overflow-auto p-3 p-md-4 p-xl-5"
          >
            <Outlet />
          </Container>
          <footer className="d-none d-lg-block small text-body-secondary px-3 px-md-4 pb-4 flex-shrink-0">
            TechArena · esporte é melhor em equipe
          </footer>
        </Col>
      </Row>
      <MobileNavigation communityActive={isCommunityRoute} />
    </Container>
  );
}
