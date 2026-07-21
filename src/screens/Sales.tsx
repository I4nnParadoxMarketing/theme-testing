import { format, isSameDay, subDays } from 'date-fns';
import { useMemo, useState } from 'react';
import { IconPlus } from '../components/Icons';
import { money } from '../lib/format';
import { sumSales } from '../lib/stats';
import { useStore } from '../hooks/useStore';
import type { Sale } from '../types';
import { RecordSaleSheet } from './RecordSaleSheet';

type Filter = 'today' | '7d' | 'all';

function filterSales(sales: Sale[], filter: Filter): Sale[] {
  const now = new Date();
  if (filter === 'today') {
    return sales.filter((s) => isSameDay(new Date(s.createdAt), now));
  }
  if (filter === '7d') {
    const cutoff = subDays(now, 6).getTime();
    return sales.filter((s) => new Date(s.createdAt).getTime() >= cutoff);
  }
  return sales;
}

export function Sales() {
  const { sales } = useStore();
  const [filter, setFilter] = useState<Filter>('today');
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => filterSales(sales, filter), [sales, filter]);
  const total = sumSales(filtered);

  return (
    <div className="screen fade-in">
      <header className="screen-header">
        <div>
          <p className="eyebrow">Monitor</p>
          <h1>Sales</h1>
        </div>
        <button type="button" className="fab-btn" onClick={() => setOpen(true)} aria-label="Record sale">
          <IconPlus />
          <span>Sale</span>
        </button>
      </header>

      <div className="filter-row" role="tablist" aria-label="Sales period">
        {(
          [
            ['today', 'Today'],
            ['7d', '7 days'],
            ['all', 'All'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={filter === key}
            className={`chip${filter === key ? ' active' : ''}`}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="summary-bar rise-1">
        <span>{filtered.length} tickets</span>
        <strong>{money(total)}</strong>
      </div>

      <ul className="sale-list">
        {filtered.length === 0 ? (
          <li className="empty-block">No sales in this period. Record one to start tracking.</li>
        ) : (
          filtered.map((sale, index) => (
            <li key={sale.id} className={`sale-row rise-${Math.min(index + 1, 5)}`}>
              <div className="sale-main">
                <strong>{money(sale.total)}</strong>
                <span>
                  {format(new Date(sale.createdAt), 'MMM d · h:mm a')} · {sale.paymentMethod}
                </span>
              </div>
              <p className="sale-items">
                {sale.items.map((i) => `${i.quantity}× ${i.name}`).join(' · ')}
              </p>
            </li>
          ))
        )}
      </ul>

      {open && <RecordSaleSheet onClose={() => setOpen(false)} />}
    </div>
  );
}
