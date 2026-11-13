import { useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Stack from 'react-bootstrap/Stack';
import Badge from 'react-bootstrap/Badge';
import logo from '../assets/brand/logo-light.png';
import { useAuth } from '../auth/useAuth';

export function LoginPage() {
  const { configured, loginWithGoogle, authError } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
    } catch {
      setError('Não foi possível iniciar o login. Tente novamente.');
      setLoading(false);
    }
  }

  return (
    <main className="min-vh-100 bg-body-tertiary d-flex flex-column">
      <Container
        as="header"
        className="py-4"
      >
        <Stack
          direction="horizontal"
          gap={2}
        >
          <img
            src={logo}
            width={40}
            height={40}
            className="object-fit-contain rounded-3"
            alt=""
          />
          <span className="fw-bold fs-5 text-body">TechArena</span>
          <span className="ms-auto small text-body-secondary d-none d-sm-inline">
            Esporte é melhor em equipe.
          </span>
        </Stack>
      </Container>

      <Container className="flex-grow-1 d-flex align-items-center py-3 py-lg-5">
        <Row className="g-4 g-lg-5 align-items-center w-100 m-0">
          <Col
            lg={7}
            className="px-0 pe-lg-5"
          >
            <Badge
              bg="primary-subtle"
              text="primary-emphasis"
              pill
              className="px-3 py-2 mb-4 fw-semibold"
            >
              <i
                className="bi bi-dribbble me-2"
                aria-hidden="true"
              />
              SEU ESPORTE. SUA COMUNIDADE.
            </Badge>
            <h1 className="display-3 fw-bold mb-3">
              Menos espera.
              <br />
              <span className="text-primary-emphasis">Mais jogo.</span>
            </h1>
            <p className="lead text-body-secondary mb-4">
              Uma partida, um novo time, uma boa amizade.
              <br className="d-none d-lg-block" />
              Seu próximo encontro com o esporte começa aqui.
            </p>
            <Row className="g-3 mt-lg-4 d-none d-lg-flex">
              <Col xs={12}>
                <Stack
                  direction="horizontal"
                  gap={3}
                >
                  <span className="bg-primary-subtle text-primary-emphasis p-3 rounded-4">
                    <i
                      className="bi bi-calendar2-event fs-4"
                      aria-hidden="true"
                    />
                  </span>
                  <div>
                    <h2 className="h6 fw-bold mb-1">
                      Encontre sua próxima partida
                    </h2>
                    <p className="small text-body-secondary mb-0">
                      Descubra agendamentos e organize seus jogos.
                    </p>
                  </div>
                </Stack>
              </Col>
              <Col xs={12}>
                <Stack
                  direction="horizontal"
                  gap={3}
                >
                  <span className="bg-primary-subtle text-primary-emphasis p-3 rounded-4">
                    <i
                      className="bi bi-people fs-4"
                      aria-hidden="true"
                    />
                  </span>
                  <div>
                    <h2 className="h6 fw-bold mb-1">
                      Jogue com a sua comunidade
                    </h2>
                    <p className="small text-body-secondary mb-0">
                      Conheça atletas, forme equipes e combine partidas.
                    </p>
                  </div>
                </Stack>
              </Col>
              <Col xs={12}>
                <Stack
                  direction="horizontal"
                  gap={3}
                >
                  <span className="bg-primary-subtle text-primary-emphasis p-3 rounded-4">
                    <i
                      className="bi bi-trophy fs-4"
                      aria-hidden="true"
                    />
                  </span>
                  <div>
                    <h2 className="h6 fw-bold mb-1">Entre na disputa</h2>
                    <p className="small text-body-secondary mb-0">
                      Participe de ligas e acompanhe sua equipe.
                    </p>
                  </div>
                </Stack>
              </Col>
            </Row>
          </Col>

          <Col
            lg={5}
            className="px-0"
          >
            <Card
              as="section"
              aria-labelledby="login-title"
              className="border rounded-4 shadow-sm bg-body"
            >
              <Card.Body className="p-4 p-xl-5">
                <span className="d-inline-flex bg-primary-subtle text-primary-emphasis p-3 rounded-4 mb-4">
                  <i
                    className="bi bi-box-arrow-in-right fs-4"
                    aria-hidden="true"
                  />
                </span>
                <h2
                  id="login-title"
                  className="h3 fw-bold mb-2"
                >
                  Entre para o jogo
                </h2>
                <p className="text-body-secondary mb-4">
                  Use sua conta Google para acessar a comunidade TechArena.
                </p>
                {(error || authError) && (
                  <Alert
                    variant="danger"
                    role="alert"
                  >
                    {error ?? authError}
                  </Alert>
                )}
                {!configured && (
                  <Alert variant="warning">
                    O login está indisponível no momento. Tente novamente mais
                    tarde.
                  </Alert>
                )}
                <Button
                  className="d-flex align-items-center justify-content-center gap-2 w-100 py-3 rounded-3 fw-semibold"
                  variant="primary"
                  onClick={() => void handleLogin()}
                  disabled={!configured || loading}
                >
                  <i
                    className="bi bi-google"
                    aria-hidden="true"
                  />
                  {loading ? 'Conectando...' : 'Continuar com Google'}
                </Button>
                <Stack
                  direction="horizontal"
                  gap={2}
                  className="justify-content-center text-body-secondary small mt-3"
                >
                  <i
                    className="bi bi-shield-check"
                    aria-hidden="true"
                  />
                  <span>Autenticação com sua conta Google</span>
                </Stack>
                <hr className="my-4" />
                <p className="small text-body-secondary mb-0 text-center">
                  Ao continuar, você concorda com os termos de uso e a política
                  de privacidade do TechArena.
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
      <Container
        as="footer"
        className="py-4 small text-body-secondary"
      >
        TechArena · Conectando pessoas pelo esporte.
      </Container>
    </main>
  );
}
