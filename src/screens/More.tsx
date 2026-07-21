import { Link } from 'react-router-dom';
import { IconChevron } from '../components/Icons';
import { useStore } from '../hooks/useStore';
import { lowStockProducts } from '../lib/stats';

const links = [
  {
    to: '/reports',
    title: 'Reports',
    desc: 'Daily sales, profit, payment mix',
  },
  {
    to: '/customers',
    title: 'Customers',
    desc: 'Saved clients for SMS receipts',
  },
  {
    to: '/settings',
    title: 'Settings',
    desc: 'Store details on receipts',
  },
] as const;

export function More() {
  const { products, customers, settings } = useStore();
  const lowCount = lowStockProducts(products).length;

  return (
    <div className="screen fade-in">
      <header className="screen-header">
        <div>
          <p className="eyebrow">{settings.storeName}</p>
          <h1>More</h1>
        </div>
      </header>

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
        {links.map((item) => (
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
