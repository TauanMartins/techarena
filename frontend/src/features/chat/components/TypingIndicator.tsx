import { ProfileAvatar } from '../../../components/ui/ProfileAvatar';
import styles from '../styles/Chat.module.scss';
export interface TypingParticipant {
  id: string;
  name: string;
  image: string | null;
  expiresAt: number;
}
export function TypingIndicator({ people }: { people: TypingParticipant[] }) {
  if (!people.length) return null;
  return (
    <div
      className="d-flex align-items-center gap-2 px-3 py-1 flex-shrink-0"
      role="status"
      aria-label={`${people.map((person) => person.name).join(', ')} digitando`}
    >
      <ProfileAvatar
        name={people[0].name}
        image={people[0].image}
      />
      <span
        className={styles.dots}
        aria-hidden="true"
      >
        <span />
        <span />
        <span />
      </span>
      <small className="text-body-secondary text-truncate">
        {people.map((person) => person.name).join(', ')} digitando
      </small>
    </div>
  );
}
