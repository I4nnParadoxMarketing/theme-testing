import { NavLink } from 'react-router-dom';
import { IconDashboard, IconInventory, IconSales } from './Icons';

const links = [
  { to: '/', label: 'Dashboard', icon: IconDashboard, end: true },
  { to: '/sales', label: 'Sales', icon: IconSales },
  { to: '/inventory', label: 'Inventory', icon: IconInventory },
] as const;

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Main">
      {links.map(({ to, label, icon: Icon, ...rest }) => (
        <NavLink
          key={to}
          to={to}
          end={'end' in rest ? rest.end : undefined}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <Icon />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
