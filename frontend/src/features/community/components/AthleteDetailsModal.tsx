import Image from "react-bootstrap/Image";
import Modal from "react-bootstrap/Modal";
import { ProfileAvatar } from "../../../components/ProfileAvatar";
import type { UserCard } from "../types/community.types";

export function AthleteDetailsModal({ person, onHide }: { person: UserCard | null; onHide: () => void }) {
  return <Modal show={person !== null} onHide={onHide} centered><Modal.Header closeButton><Modal.Title>Perfil do atleta</Modal.Title></Modal.Header><Modal.Body>
    {person && <div className="profile-detail">{person.image ? <Image className="profile-detail-image" src={person.image} alt={`Foto de ${person.name ?? "atleta"}`} roundedCircle /> : <ProfileAvatar name={person.name} image={null} className="person-avatar profile-detail-avatar" />}<h3>{person.name ?? "Atleta"}</h3><p>{person.username ? `@${person.username}` : "Nome de usuário não informado"}</p></div>}
  </Modal.Body></Modal>;
}
