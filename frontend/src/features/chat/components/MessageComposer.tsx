import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { useLayoutEffect, useRef, type SubmitEvent } from 'react';
import styles from '../styles/Chat.module.scss';

export function MessageComposer({
  text,
  onTextChange,
  onSubmit,
  sending,
  connected,
  onBlur,
}: {
  text: string;
  onTextChange: (value: string) => void;
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
  sending: boolean;
  connected: boolean;
  onBlur?: () => void;
}) {
  const input = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    if (!input.current) return;
    input.current.style.height = 'auto';
    input.current.style.height = `${Math.min((input.current.scrollHeight || 42) + 2, 144)}px`;
  }, [text]);
  return (
    <Form
      onSubmit={onSubmit}
      className={`d-flex align-items-end gap-2 p-2 p-md-3 border-top flex-shrink-0 ${styles.composer}`}
    >
      <Form.Control
        as="textarea"
        rows={1}
        ref={input}
        onBlur={onBlur}
        aria-label="Mensagem"
        placeholder="Escreva uma mensagem..."
        value={text}
        onChange={(event) => onTextChange(event.target.value)}
        maxLength={1000}
        disabled={!connected}
      />
      <Button
        type="submit"
        disabled={!text.trim() || sending || !connected}
        aria-label="Enviar mensagem"
        title="Enviar mensagem"
      >
        <i className="bi bi-send-fill" />
      </Button>
    </Form>
  );
}
