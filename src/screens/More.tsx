import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { IconChevron } from '../components/Icons';
import { useStore } from '../hooks/useStore';
import { lowStockProducts } from '../lib/stats';

export function More() {
  const { products, customers, settings, cloudStatus } = useStore();
  const { user, logout, can, isAdmin } = useAuth();
  const lowCount = lowStockProducts(products).length;

  const links = [
    {
      to: '/reports',
      title: 'Reports',
      desc: 'Daily sales, profit, payment mix',
      show: can('reports.view'),
    },
    {
      to: '/customers',
      title: 'Customers',
      desc: 'Saved clients for SMS receipts',
      show: can('customers.manage'),
    },
    {
      to: '/staff',
      title: 'Staff accounts',
      desc: 'Admin: add cashiers and bosses',
      show: can('staff.manage'),
    },
    {
      to: '/settings',
      title: 'Settings & Online',
      desc: 'Store details + cloud sync',
      show: can('settings.manage'),
    },
  ] as const;

  return (
    <div className="screen fade-in">
      <header className="screen-header">
        <div>
          <p className="eyebrow">{settings.storeName}</p>
          <h1>More</h1>
        </div>
        <button type="button" className="secondary-btn" onClick={logout}>
          Log out
        </button>
      </header>

      <section className="session-card">
        <div>
          <strong>{user?.name}</strong>
          <span>
            {isAdmin ? 'Admin / Boss' : 'Staff'} · @{user?.username}
          </span>
        </div>
        <em className={`cloud-pill status-${cloudStatus}`}>
          {cloudStatus === 'online'
            ? 'Online'
            : cloudStatus === 'syncing'
              ? 'Syncing'
              : cloudStatus === 'error'
                ? 'Sync error'
                : 'Local'}
        </em>
      </section>

      <section className="kpi-strip">
        <div className="kpi primary">
          <span className="kpi-label">Clients</span>
          <strong className="kpi-value">{customers.length}</strong>
          <span className="kpi-meta">saved</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Low stock</span>
          <strong className="kpi-value">{lowCount}</strong>
          <span className="kpi-meta">to reorder</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">SKUs</span>
          <strong className="kpi-value">{products.length}</strong>
          <span className="kpi-meta">in stockroom</span>
        </div>
      </section>

      <ul className="menu-list rise-2">
        {links
          .filter((item) => item.show)
          .map((item) => (
            <li key={item.to}>
              <Link to={item.to} className="menu-link">
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.desc}</span>
                </div>
                <IconChevron />
              </Link>
            </li>
          ))}
      </ul>
    </div>
  );
}
