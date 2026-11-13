import Button from 'react-bootstrap/Button';
import { NavigationLink } from './NavigationLink';
import { communityNavigation } from './CommunityNavigation.data';

export function CommunityNavigation({
  open,
  active,
  onToggle,
}: {
  open: boolean;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="d-flex flex-column gap-2">
      <Button
        variant="link"
        type="button"
        className={`nav-link d-flex align-items-center gap-3 w-100 rounded-3 px-3 py-2 text-start${active ? ' active' : ' text-body'}`}
        aria-expanded={open}
        aria-controls="sidebar-community-links"
        onClick={onToggle}
      >
        <i
          className="bi bi-people-fill"
          aria-hidden="true"
        />
        Comunidades
        <i
          className={`bi ${open ? 'bi-chevron-up' : 'bi-chevron-down'} ms-auto`}
          aria-hidden="true"
        />
      </Button>
      <div
        className="ms-3 ps-2 border-start small"
        id="sidebar-community-links"
        hidden={!open}
      >
        {communityNavigation.map((item) => (
          <NavigationLink
            key={item.to}
            to={item.to}
            label={item.label}
            icon={item.icon}
            end={item.end}
          >
            {item.to === '/chat' && (
              <span
                className="ms-auto"
                aria-label="Mensagens em tempo real"
              >
                <i className="bi bi-lightning-charge-fill" />
              </span>
            )}
          </NavigationLink>
        ))}
      </div>
    </div>
  );
}
