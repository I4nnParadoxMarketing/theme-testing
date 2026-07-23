import { format, isSameDay, subDays } from 'date-fns';
import { useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { SendReceiptSheet } from '../components/SendReceiptSheet';
import { IconPlus, IconSearch } from '../components/Icons';
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
  const { sales, voidSale } = useStore();
  const { can } = useAuth();
  const [filter, setFilter] = useState<Filter>('today');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [smsSale, setSmsSale] = useState<Sale | null>(null);
  const [pendingSmsSale, setPendingSmsSale] = useState<Sale | null>(null);

  const filtered = useMemo(() => {
    const base = filterSales(sales, filter);
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (s) =>
        s.customerName?.toLowerCase().includes(q) ||
        s.customerPhone?.includes(q) ||
        s.paymentMethod.toLowerCase().includes(q) ||
        s.referenceNo?.toLowerCase().includes(q) ||
        s.items.some((i) => i.name.toLowerCase().includes(q)),
    );
  }, [sales, filter, query]);

  const total = sumSales(filtered.filter((s) => !s.voided));
  const activeSms = smsSale ?? pendingSmsSale;

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

      <label className="search-field">
        <IconSearch />
        <input
          type="search"
          placeholder="Search item, client, GCash ref"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>

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
        <span>{filtered.filter((s) => !s.voided).length} tickets</span>
        <strong>{money(total)}</strong>
      </div>

      <ul className="sale-list">
        {filtered.length === 0 ? (
          <li className="empty-block">No sales in this period. Record one to start tracking.</li>
        ) : (
          filtered.map((sale, index) => (
            <li
              key={sale.id}
              className={`sale-row rise-${Math.min(index + 1, 5)}${sale.voided ? ' voided' : ''}`}
            >
              <div className="sale-main">
                <strong>
                  {money(sale.total)}
                  {sale.voided ? ' · VOID' : ''}
                </strong>
                <span>
                  {format(new Date(sale.createdAt), 'MMM d · h:mm a')} · {sale.paymentMethod}
                  {sale.soldByName ? ` · ${sale.soldByName}` : ''}
                  {sale.customerName ? ` · ${sale.customerName}` : ''}
                  {sale.referenceNo ? ` · Ref ${sale.referenceNo}` : ''}
                </span>
              </div>
              <p className="sale-items">
                {sale.items.map((i) => `${i.quantity}× ${i.name}`).join(' · ')}
                {sale.customerPhone ? ` · ${sale.customerPhone}` : ''}
              </p>
              {!sale.voided && (
                <div className="sale-actions-row">
                  <button
                    type="button"
                    className="primary-btn sale-sms-btn"
                    onClick={() => setSmsSale(sale)}
                  >
                    Send SMS receipt
                  </button>
                  {can('sale.void') && (
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => {
                        if (window.confirm('Void this sale and return items to stock?')) {
                          voidSale(sale.id);
                        }
                      }}
                    >
                      Void
                    </button>
                  )}
                </div>
              )}
            </li>
          ))
        )}
      </ul>

      {open && (
        <RecordSaleSheet
          onClose={() => setOpen(false)}
          onSavedForSms={(sale) => {
            setOpen(false);
            setPendingSmsSale(sale);
          }}
        />
      )}

      {activeSms && (
        <SendReceiptSheet
          sale={activeSms}
          title={pendingSmsSale ? 'Sale saved — send SMS' : 'Send SMS receipt'}
          onClose={() => {
            setSmsSale(null);
            setPendingSmsSale(null);
          }}
        />
      )}
    </div>
  );
}
