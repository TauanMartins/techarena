import Dropdown from 'react-bootstrap/Dropdown';

export function ActionMenu({
  label,
  actions,
  disabled = false,
}: {
  label: string;
  disabled?: boolean;
  actions: {
    label: string;
    icon: string;
    onClick: () => void;
    danger?: boolean;
  }[];
}) {
  return (
    <Dropdown align="end">
      <Dropdown.Toggle
        variant="link"
        className="text-body p-2 shadow-none"
        aria-label={label}
        disabled={disabled}
      >
        <i
          className="bi bi-three-dots-vertical"
          aria-hidden="true"
        />
      </Dropdown.Toggle>
      <Dropdown.Menu renderOnMount>
        {actions.map((action) => (
          <Dropdown.Item
            key={action.label}
            as="button"
            className={action.danger ? 'text-danger' : ''}
            onClick={action.onClick}
          >
            <i
              className={`bi ${action.icon} me-2`}
              aria-hidden="true"
            />
            {action.label}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
}
