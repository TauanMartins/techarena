import type { ReactNode } from 'react';
import Button from 'react-bootstrap/Button';
import ListGroup from 'react-bootstrap/ListGroup';
import Stack from 'react-bootstrap/Stack';
import { ProfileAvatar } from './ProfileAvatar';

export function PersonListItem({
  name,
  image,
  description,
  onDetails,
  children,
}: {
  name: string | null;
  image: string | null;
  description: ReactNode;
  onDetails?: () => void;
  children?: ReactNode;
}) {
  const identity = (
    <>
      <strong>{name ?? 'Atleta'}</strong>
      <span className="small text-body-secondary">{description}</span>
    </>
  );

  return (
    <ListGroup.Item className="d-flex flex-wrap align-items-center gap-3 p-3">
      <ProfileAvatar
        name={name}
        image={image}
      />
      {onDetails ? (
        <Button
          type="button"
          variant="link"
          onClick={onDetails}
          className="d-flex flex-column gap-1 text-break text-body text-start text-decoration-none p-0 me-auto"
        >
          {identity}
        </Button>
      ) : (
        <div className="d-flex flex-column gap-1 text-break me-auto">
          {identity}
        </div>
      )}
      {children && (
        <Stack
          direction="horizontal"
          gap={2}
          className="flex-wrap ms-auto"
        >
          {children}
        </Stack>
      )}
    </ListGroup.Item>
  );
}
