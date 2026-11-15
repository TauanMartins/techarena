import Nav from 'react-bootstrap/Nav';
import { NavLink } from 'react-router-dom';
import { navigation } from './AppNavigation.data';

const mobileNavigation = [
  ...navigation.slice(0, 3),
  {
    to: '/social',
    label: 'Comunidade',
    mobileLabel: 'Social',
    icon: 'bi-people',
    end: true,
  },
  ...navigation.slice(3),
];

export function MobileNavigation({
  communityActive,
}: {
  communityActive: boolean;
}) {
  return (
    <div className="d-lg-none bg-body border-top flex-shrink-0 pb-safe-0">
      <Nav
        as="nav"
        className="row row-cols-5 g-0 flex-nowrap p-1"
        aria-label="Navegação inferior"
      >
        {mobileNavigation.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            aria-label={item.label}
            className={({ isActive }) =>
              `col touch-target d-flex flex-column align-items-center justify-content-center gap-1 rounded-3 py-2 text-decoration-none${
                isActive || (item.to === '/social' && communityActive)
                  ? ' bg-primary-subtle text-primary-emphasis fw-semibold'
                  : ' text-body-secondary'
              }`
            }
          >
            <i
              className={`bi ${item.icon} fs-5 lh-1`}
              aria-hidden="true"
            />
            <small>{item.mobileLabel}</small>
          </NavLink>
        ))}
      </Nav>
    </div>
  );
}
