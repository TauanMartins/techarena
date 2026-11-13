import Button, { type ButtonProps } from 'react-bootstrap/Button';

export function IconButton({
  icon,
  label,
  variant = 'outline-secondary',
  size = 'sm',
  type = 'button',
  ...props
}: Omit<ButtonProps, 'children' | 'aria-label'> & {
  icon: string;
  label: string;
}) {
  return (
    <Button
      {...props}
      type={type}
      variant={variant}
      size={size}
      aria-label={label}
      title={label}
    >
      <i
        className={`bi ${icon}`}
        aria-hidden="true"
      />
    </Button>
  );
}
