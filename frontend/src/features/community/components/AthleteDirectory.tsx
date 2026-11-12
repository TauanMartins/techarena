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
    <Form className="search-bar mb-3" onSubmit={onSearch}><i className="bi bi-search" aria-hidden="true" /><Form.Control aria-label="Buscar atletas" placeholder="Buscar por nome ou usuário" value={search} onChange={(event) => onSearchChange(event.target.value)} /><Button type="submit" variant="outline-primary">Buscar</Button></Form>
    <div className="people-list">{people.map((person) => { const isFriend = friends.has(person.id); const isRequested = requested.has(person.id); return <div className="person-row" key={person.id}>
      <ProfileAvatar name={person.name} image={person.image} /><button className="person-info person-detail-trigger" type="button" onClick={() => onDetails(person)}><strong>{person.name ?? "Atleta"}</strong><span>{person.username ? `@${person.username}` : "TechArena"}</span></button>
      <div className="d-flex gap-2"><Button size="sm" variant="outline-secondary" onClick={() => onDetails(person)}>Detalhes</Button><Button size="sm" variant={isFriend ? "outline-success" : "outline-primary"} disabled={isFriend || isRequested || busy} onClick={() => onRequest(person.id)}>{isFriend ? "Amigos" : isRequested ? "Solicitado" : "Adicionar"}</Button></div>
    </div>; })}</div>
  </>;
}
