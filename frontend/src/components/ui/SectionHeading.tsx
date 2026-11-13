import type { ReactNode } from 'react';
import Stack from 'react-bootstrap/Stack';

export function SectionHeading({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <Stack
      direction="horizontal"
      gap={3}
      className="flex-wrap justify-content-between mb-3"
    >
      <div>
        <span className="d-block small fw-semibold text-body-secondary mb-1">
          {eyebrow}
        </span>
        <h2 className="h5 fw-bold mb-0">{title}</h2>
      </div>
      {action}
    </Stack>
  );
}
