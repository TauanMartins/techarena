import { use, useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { InstallContext } from './InstallContext';

export function InstallApp() {
  const installation = use(InstallContext);
  const [showHelp, setShowHelp] = useState(false);
  if (!installation || installation.installed) return null;

  const { canPrompt, prompting, isIOS, secure, error, install } = installation;
  return (
    <section
      aria-label="Instalar TechArena"
      className="border rounded-4 bg-body p-3 p-md-4 mt-4"
    >
      <div className="d-flex align-items-start gap-3">
        <i
          className="bi bi-phone text-primary-emphasis fs-3"
          aria-hidden="true"
        />
        <div className="flex-grow-1">
          <h2 className="h5 fw-bold">TechArena na sua tela inicial</h2>
          <p className="small text-body-secondary mb-3">
            Abra o TechArena como app, direto pelo ícone no celular. É preciso
            estar conectado à internet para usar.
          </p>
          <Button
            variant="outline-primary"
            className="touch-target"
            disabled={prompting}
            onClick={() => {
              if (canPrompt) void install();
              else setShowHelp(true);
            }}
          >
            <i
              className="bi bi-download me-2"
              aria-hidden="true"
            />
            {prompting
              ? 'Aguardando confirmação...'
              : canPrompt
                ? 'Instalar app'
                : 'Como instalar'}
          </Button>
        </div>
      </div>
      {error && (
        <Alert
          variant="warning"
          className="mt-3 mb-0"
          role="alert"
        >
          {error}
        </Alert>
      )}
      <Modal
        show={showHelp}
        onHide={() => setShowHelp(false)}
        aria-labelledby="install-app-title"
        centered
      >
        <Modal.Header
          closeButton
          closeLabel="Fechar"
        >
          <Modal.Title id="install-app-title">Instalar TechArena</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!secure && (
            <Alert variant="warning">
              Abra o TechArena pelo endereço seguro (HTTPS) para instalar.
            </Alert>
          )}
          {isIOS ? (
            <>
              <h3 className="h6 fw-bold">No iPhone ou iPad</h3>
              <ol className="ps-3 mb-0">
                <li className="mb-2">Abra este site no Safari.</li>
                <li className="mb-2">Abra o menu Compartilhar.</li>
                <li className="mb-2">Toque em Adicionar à Tela de Início.</li>
                <li>
                  Se aparecer, mantenha Abrir como App ativado e toque em
                  Adicionar.
                </li>
              </ol>
            </>
          ) : (
            <>
              <h3 className="h6 fw-bold">No Android</h3>
              <ol className="ps-3">
                <li className="mb-2">Abra este site no Chrome.</li>
                <li className="mb-2">
                  Abra o menu de três pontos do navegador.
                </li>
                <li>Escolha Instalar app ou Adicionar à tela inicial.</li>
              </ol>
              <p className="small text-body-secondary mb-0">
                No computador, procure a opção de instalação na barra de
                endereço ou no menu do navegador. A disponibilidade depende do
                navegador; se o app já estiver instalado, abra pelo ícone.
              </p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            className="touch-target"
            onClick={() => setShowHelp(false)}
          >
            Entendi
          </Button>
        </Modal.Footer>
      </Modal>
    </section>
  );
}
