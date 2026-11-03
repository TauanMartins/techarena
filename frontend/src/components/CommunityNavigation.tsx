import { NavLink } from "react-router-dom";

export const communityNavigation = [
  { to: "/social", label: "Comunidade", icon: "bi-person-hearts", end: true },
  { to: "/equipes", label: "Equipes", icon: "bi-people", end: true },
  { to: "/chat", label: "Conversas", icon: "bi-chat-dots" },
];

export function CommunityNavigation({ open, active, onToggle }: { open: boolean; active: boolean; onToggle: () => void }) {
  return <div className={`sidebar-community${open ? " open" : ""}`}>
    <button type="button" className={`sidebar-link sidebar-community-toggle${active ? " active" : ""}`} aria-expanded={open} aria-controls="sidebar-community-links" onClick={onToggle}>
      <i className="bi bi-people-fill" aria-hidden="true" />Comunidades<i className="bi bi-chevron-down sidebar-community-chevron" aria-hidden="true" />
    </button>
    <div className="sidebar-community-links" id="sidebar-community-links" hidden={!open}>
      {communityNavigation.map((item) => <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `sidebar-link sidebar-community-link${isActive ? " active" : ""}`}>
        <i className={`bi ${item.icon}`} aria-hidden="true" />{item.label}{item.to === "/chat" && <span className="sidebar-link-hint" aria-label="Mensagens em tempo real"><i className="bi bi-lightning-charge-fill" /></span>}
      </NavLink>)}
    </div>
  </div>;
}
