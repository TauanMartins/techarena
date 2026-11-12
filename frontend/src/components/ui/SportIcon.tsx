const sportColors: Record<string, string> = {
  basquete: 'text-warning-emphasis',
  ciclismo: 'text-success-emphasis',
  futebol: 'text-success-emphasis',
  handebol: 'text-danger-emphasis',
  natacao: 'text-info-emphasis',
  'ping-pong': 'text-warning-emphasis',
  skate: 'text-danger-emphasis',
  tenis: 'text-success-emphasis',
  volei: 'text-primary-emphasis',
  xadrez: 'text-body-secondary',
};

function normalizeSportName(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
}

export function SportIcon({
  name,
  className = '',
}: {
  name: string;
  className?: string;
}) {
  const normalized = normalizeSportName(name);
  const key = Object.keys(sportColors).find((candidate) =>
    normalized.includes(normalizeSportName(candidate)),
  );
  const color = key ? sportColors[key] : 'text-body-secondary';

  return (
    <i
      className={`bi bi-circle-fill small flex-shrink-0 ${color} ${className}`}
      aria-hidden="true"
    />
  );
}
