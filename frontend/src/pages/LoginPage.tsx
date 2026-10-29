import { useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
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
    <main className="login-page">
      <section className="login-brand-panel">
        <div className="login-brand-content">
          <div className="login-brand-name">TECHARENA</div>
          <img src={logo} className="login-logo" alt="TechArena" />
          <p>Seu próximo jogo começa aqui.</p>
        </div>
        <div className="login-brand-note">
          Encontre atletas. Marque partidas. Faça parte do jogo.
        </div>
      </section>
      <section className="login-form-panel">
        <div className="login-form-content">
          <span className="eyebrow">BEM-VINDO À COMUNIDADE</span>
          <h1>
            Jogue mais.
            <br />
            <span>Jogue junto.</span>
          </h1>
          <p>
            Entre para descobrir partidas, conhecer atletas e organizar seus
            próximos desafios.
          </p>
          {(error || authError) && (
            <Alert variant="danger" role="alert">
              {error ?? authError}
            </Alert>
          )}
          {!configured && (
            <Alert variant="warning">
              O login está indisponível no momento. Tente novamente mais tarde.
            </Alert>
          )}
          <Button
            className="google-login-button"
            variant="light"
            onClick={() => void handleLogin()}
            disabled={!configured || loading}
          >
            <i className="bi bi-google" aria-hidden="true" />
            {loading ? 'Conectando...' : 'Continuar com Google'}
          </Button>
          <small className="login-legal">
            Ao continuar, você concorda com os termos de uso e a política de
            privacidade do TechArena.
          </small>
        </div>
      </section>
    </main>
  );
}
