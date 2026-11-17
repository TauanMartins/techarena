import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import { api } from '../../../lib/api-client';
import { ErrorState, LoadingState } from '../../../components/ui/Feedback';
export function AppointmentMaterials({
  token,
  sportId,
}: {
  token: string;
  sportId: string;
}) {
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ['sportMaterials', sportId, page],
    queryFn: () => api.getSportMaterials(token, sportId, page),
  });
  return (
    <section
      className="border-top pt-3 mt-3"
      aria-label="O que levar"
    >
      <h3 className="h6">O que levar</h3>
      <p className="small text-body-secondary">
        Materiais que os jogadores devem providenciar para esta modalidade.
      </p>
      {query.isPending ? (
        <LoadingState label="Carregando materiais..." />
      ) : query.error ? (
        <ErrorState message="Não foi possível carregar os materiais." />
      ) : query.data?.items.length ? (
        <ul>
          {query.data.items.map((material) => (
            <li key={material.id}>{material.description}</li>
          ))}
        </ul>
      ) : (
        <p>Nenhum material informado.</p>
      )}
      {(page > 1 || query.data?.hasNextPage) && (
        <div className="d-flex gap-2">
          <Button
            size="sm"
            variant="outline-secondary"
            disabled={page === 1}
            onClick={() => setPage((value) => value - 1)}
          >
            Anterior
          </Button>
          <Button
            size="sm"
            variant="outline-secondary"
            disabled={!query.data?.hasNextPage}
            onClick={() => setPage((value) => value + 1)}
          >
            Próxima
          </Button>
        </div>
      )}
    </section>
  );
}
