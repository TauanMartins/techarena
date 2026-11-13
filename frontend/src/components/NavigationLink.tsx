import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

export function NavigationLink({
  to,
  label,
  icon,
  end,
  children,
}: {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
  children?: ReactNode;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `nav-link d-flex align-items-center gap-3 rounded-3 px-3 py-2${isActive ? ' active' : ' text-body'}`
      }
    >
      <i
        className={`bi ${icon} flex-shrink-0`}
        aria-hidden="true"
      />
      {label}
      {children}
    </NavLink>
  );
}
