import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import type { SubmitEvent } from "react";
import { ProfileAvatar } from "../../../components/ui/ProfileAvatar";
import type { UserCard } from "../types/community.types";

export function AthleteDirectory({ people, friends, requested, search, onSearchChange, onSearch, onDetails, onRequest, busy }: {
  people: UserCard[]; friends: Set<string>; requested: Set<string>; search: string;
  onSearchChange: (value: string) => void; onSearch: (event: SubmitEvent<HTMLFormElement>) => void;
  onDetails: (person: UserCard) => void; onRequest: (id: string) => void; busy: boolean;
}) {
  return <>
    <Form className="d-flex flex-column flex-sm-row align-items-sm-center gap-2 border rounded-4 bg-body shadow-sm p-3 mb-3" onSubmit={onSearch}><i className="bi bi-search" aria-hidden="true" /><Form.Control aria-label="Buscar atletas" placeholder="Buscar por nome ou usuário" value={search} onChange={(event) => onSearchChange(event.target.value)} /><Button type="submit" variant="outline-primary">Buscar</Button></Form>
    <div className="list-group rounded-3">{people.map((person) => { const isFriend = friends.has(person.id); const isRequested = requested.has(person.id); return <div className="list-group-item d-flex flex-wrap align-items-center gap-3 p-3" key={person.id}>
      <ProfileAvatar name={person.name} image={person.image} /><button className="d-flex flex-column gap-1 text-break me-auto btn btn-link text-body text-start text-decoration-none p-0" type="button" onClick={() => onDetails(person)}><strong>{person.name ?? "Atleta"}</strong><span>{person.username ? `@${person.username}` : "TechArena"}</span></button>
      <div className="d-flex gap-2"><Button size="sm" variant="outline-secondary" onClick={() => onDetails(person)}>Detalhes</Button><Button size="sm" variant={isFriend ? "outline-success" : "outline-primary"} disabled={isFriend || isRequested || busy} onClick={() => onRequest(person.id)}>{isFriend ? "Amigos" : isRequested ? "Solicitado" : "Adicionar"}</Button></div>
    </div>; })}</div>
  </>;
}
