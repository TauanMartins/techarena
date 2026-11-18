import Image from 'react-bootstrap/Image';

// Paths from the installed Bootstrap Icons (person-fill, people-fill, calendar2-event).
// SVG geometry gives placeholders the same fixed dimensions as photographs.
const placeholderPaths = {
  person:
    'M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6',
  team: 'M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6m-5.784 6A2.24 2.24 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.3 6.3 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1zM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5',
  appointment:
    'M11 7.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5z M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5M2 2a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z M2.5 4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5z',
};

export function Avatar({
  image,
  label,
  size = 40,
  icon = 'person',
  className = '',
}: {
  image: string | null;
  label: string;
  size?: 24 | 40 | 80;
  icon?: keyof typeof placeholderPaths;
  className?: string;
}) {
  const appearance = `d-inline-block flex-shrink-0 align-middle rounded-circle border bg-body-tertiary text-body-secondary ${className}`;

  return image ? (
    <Image
      src={image}
      alt={label}
      width={size}
      height={size}
      className={`object-fit-cover ${appearance}`}
    />
  ) : (
    <svg
      width={size}
      height={size}
      viewBox="-4 -4 24 24"
      fill="currentColor"
      className={appearance}
      role="img"
      aria-label={label}
      focusable="false"
    >
      <path d={placeholderPaths[icon]} />
    </svg>
  );
}
