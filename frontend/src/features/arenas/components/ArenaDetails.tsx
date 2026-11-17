import Button from 'react-bootstrap/Button';
import Offcanvas from 'react-bootstrap/Offcanvas';
import { Link } from 'react-router-dom';
import type { Arena, Sport } from '../../../shared/types';
import { ArenaDirections } from './ArenaDirections';
export function ArenaDetails({
  arena,
  sports,
  onBook,
  onClose,
}: {
  arena: Arena;
  sports: Sport[];
  onBook: (arena: Arena) => void;
  onClose: () => void;
}) {
  const availableSports = sports.filter((sport) =>
    arena.sportIds.includes(sport.id),
  );
  return (
    <Offcanvas
      show
      onHide={onClose}
      placement="end"
      aria-labelledby="selected-arena-title"
      style={{ width: 'min(100vw, 420px)' }}
    >
      <Offcanvas.Header closeButton>
        <Offcanvas.Title id="selected-arena-title">
          Detalhes da quadra
        </Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        {arena.image && (
          <img
            src={arena.image}
            alt={`Arena em ${arena.address}`}
            className="w-100 rounded-3 object-fit-cover mb-3"
            height={180}
          />
        )}
        <span className="small text-body-secondary">LOCAL PARA JOGAR</span>
        <h2 className="h4 mt-2">{arena.address}</h2>
        {arena.distanceKm != null && (
          <p className="text-body-secondary">
            {arena.distanceKm.toFixed(1)} km em linha reta da região pesquisada
          </p>
        )}
        <h3 className="h6 mt-4">O que dá para jogar aqui?</h3>
        <div className="d-flex flex-wrap gap-2 mb-4">
          {availableSports.length ? (
            availableSports.map((sport) => (
              <span
                className="badge rounded-pill bg-primary-subtle text-primary-emphasis p-2"
                key={sport.id}
              >
                {sport.name}
              </span>
            ))
          ) : (
            <p>Modalidades ainda não informadas.</p>
          )}
        </div>
        <div className="d-grid gap-2">
          <Button
            disabled={!arena.sportIds.length}
            onClick={() => onBook(arena)}
          >
            <i
              className="bi bi-calendar-plus me-2"
              aria-hidden="true"
            />
            Agendar aqui
          </Button>
          <Link
            className="btn btn-outline-primary"
            to={`/agendamentos?arenaId=${encodeURIComponent(arena.id)}`}
          >
            Ver agendamentos desta arena
          </Link>
        </div>
        <hr className="my-4" />
        <h3 className="h6">Como chegar</h3>
        <p className="small text-body-secondary">
          Abra a rota no aplicativo ou site de sua preferência.
        </p>
        <ArenaDirections arena={arena} />
      </Offcanvas.Body>
    </Offcanvas>
  );
}
