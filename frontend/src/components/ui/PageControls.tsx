import Button from 'react-bootstrap/Button';
export function PageControls({
  page,
  hasNext,
  busy,
  onChange,
  label = 'Páginas dos resultados',
}: {
  page: number;
  hasNext: boolean;
  busy: boolean;
  onChange: (page: number) => void;
  label?: string;
}) {
  if (page === 1 && !hasNext) return null;
  return (
    <nav
      aria-label={label}
      className="d-flex align-items-center gap-3 my-3"
    >
      <Button
        variant="outline-secondary"
        disabled={page <= 1 || busy}
        onClick={() => onChange(page - 1)}
      >
        Anterior
      </Button>
      <span aria-live="polite">Página {page}</span>
      <Button
        variant="outline-secondary"
        disabled={!hasNext || busy}
        onClick={() => onChange(page + 1)}
      >
        Próxima
      </Button>
    </nav>
  );
}
