import type { NewNotification } from './new-notification.js';

export function validateNotification(input: NewNotification): void {
  const bounded = (value: string, max: number) =>
    typeof value === 'string' && value.trim().length > 0 && value.length <= max;
  if (
    !/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(input.recipientId) ||
    !bounded(input.eventKey, 200) ||
    !bounded(input.kind, 80) ||
    !/^[a-z][a-z0-9_.]*$/.test(input.kind) ||
    !bounded(input.title, 120) ||
    !bounded(input.body, 500) ||
    (input.targetPath !== undefined &&
      (!bounded(input.targetPath, 300) ||
        !/^\/(chat|social|equipes|agendamentos|ligas|notificacoes)(\/[a-zA-Z0-9_-]+)*$/.test(
          input.targetPath,
        )))
  ) {
    throw new TypeError('Invalid notification');
  }
}
