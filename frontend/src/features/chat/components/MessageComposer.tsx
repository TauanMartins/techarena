import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import type { SubmitEvent } from "react";

export function MessageComposer({ text, onTextChange, onSubmit, sending, connected }: { text: string; onTextChange: (value: string) => void; onSubmit: (event: SubmitEvent<HTMLFormElement>) => void; sending: boolean; connected: boolean }) {
  return <Form onSubmit={onSubmit} className="chat-compose">
    <Form.Control aria-label="Mensagem" placeholder="Escreva uma mensagem..." value={text} onChange={(event) => onTextChange(event.target.value)} maxLength={1000} disabled={!connected} />
    <Button type="submit" disabled={!text.trim() || sending || !connected} aria-label="Enviar mensagem" title="Enviar mensagem"><i className="bi bi-send-fill" /></Button>
  </Form>;
}
