/** Never navigate to arbitrary origins or executable URLs supplied in stored content. */
export function notificationTarget(path: string | null): string | null {
  return path &&
    /^\/(chat|social|equipes|agendamentos|ligas|notificacoes)(\/[a-zA-Z0-9_-]+)*$/.test(
      path,
    )
    ? path
    : null;
}
