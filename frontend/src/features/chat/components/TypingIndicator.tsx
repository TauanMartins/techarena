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
      className="d-flex align-items-center gap-2 align-self-start flex-shrink-0"
      role="status"
      aria-label={`${people.map((person) => person.name).join(', ')} digitando`}
    >
      <ProfileAvatar
        size={24}
        name={people[0].name}
        image={people[0].image}
      />
      <span
        className={`${styles.dots} border rounded-4 bg-body text-body-secondary px-3 py-2`}
        aria-hidden="true"
      >
        <span />
        <span />
        <span />
      </span>
    </div>
  );
}
