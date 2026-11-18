import { IconButton } from '../../../components/ui/IconButton';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import type { SubmitEvent } from 'react';
import { PersonListItem } from '../../../components/ui/PersonListItem';
import type { UserCard } from '../types/community.types';

export function AthleteDirectory({
  people,
  friends,
  requested,
  search,
  onSearchChange,
  onSearch,
  onDetails,
  onRequest,
  busy,
}: {
  people: UserCard[];
  friends: Set<string>;
  requested: Set<string>;
  search: string;
  onSearchChange: (value: string) => void;
  onSearch: (event: SubmitEvent<HTMLFormElement>) => void;
  onDetails: (person: UserCard) => void;
  onRequest: (id: string) => void;
  busy: boolean;
}) {
  return (
    <>
      <Form
        className="d-flex flex-column flex-sm-row align-items-sm-center gap-2 border rounded-4 bg-body shadow-sm p-3 mb-3"
        onSubmit={onSearch}
      >
        <i
          className="bi bi-search"
          aria-hidden="true"
        />
        <Form.Control
          aria-label="Buscar atletas"
          placeholder="Buscar por nome ou usuário"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
        <Button
          type="submit"
          variant="outline-primary"
        >
          Buscar
        </Button>
      </Form>
      <div className="list-group rounded-3">
        {people.map((person) => {
          const isFriend = friends.has(person.id);
          const isRequested = requested.has(person.id);
          return (
            <PersonListItem
              key={person.id}
              name={person.name}
              image={person.image}
              description={
                person.username ? `@${person.username}` : 'TechArena'
              }
              onDetails={() => onDetails(person)}
            >
              <IconButton
                icon="bi-person"
                label="Detalhes"
                onClick={() => onDetails(person)}
              />
              <Button
                size="sm"
                variant={isFriend ? 'outline-success' : 'outline-primary'}
                disabled={isFriend || isRequested || busy}
                onClick={() => onRequest(person.id)}
              >
                <i
                  className={`bi ${isFriend ? 'bi-person-check' : isRequested ? 'bi-clock' : 'bi-person-plus'} me-2`}
                  aria-hidden="true"
                />
                {isFriend ? 'Amigos' : isRequested ? 'Solicitado' : 'Adicionar'}
              </Button>
            </PersonListItem>
          );
        })}
      </div>
    </>
  );
}
