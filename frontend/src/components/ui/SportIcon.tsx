const sportIcons: Record<string, string> = {
  basquete: new URL('../../assets/sports/basquete.png', import.meta.url).href,
  ciclismo: new URL('../../assets/sports/ciclismo.png', import.meta.url).href,
  futebol: new URL('../../assets/sports/futebol.png', import.meta.url).href,
  handebol: new URL('../../assets/sports/handebol.png', import.meta.url).href,
  natacao: new URL('../../assets/sports/natacao.png', import.meta.url).href,
  'ping-pong': new URL('../../assets/sports/ping-pong.png', import.meta.url).href,
  skate: new URL('../../assets/sports/skate.png', import.meta.url).href,
  tenis: new URL('../../assets/sports/tênis.png', import.meta.url).href,
  volei: new URL('../../assets/sports/vôlei.png', import.meta.url).href,
  xadrez: new URL('../../assets/sports/xadrez.png', import.meta.url).href,
};

function normalizeSportName(name: string) {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
}

export function SportIcon({ name, className = '' }: { name: string; className?: string }) {
  const normalized = normalizeSportName(name);
  const key = Object.keys(sportIcons).find((candidate) =>
    normalized.includes(normalizeSportName(candidate)),
  );
  const icon = key ? sportIcons[key] : null;

  return icon ? (
    <img className={`sport-image ${className}`} src={icon} alt="" aria-hidden="true" />
  ) : (
    <i className={`bi bi-dribbble ${className}`} aria-hidden="true" />
  );
}
