import { format, isSameDay, subDays } from 'date-fns';
import { useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { IconPlus, IconSearch } from '../components/Icons';
import { isValidPhMobile, money } from '../lib/format';
import { openReceiptSms } from '../lib/receiptSms';
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
  const { sales, settings, updateSaleCustomer, voidSale } = useStore();
  const { can } = useAuth();
  const [filter, setFilter] = useState<Filter>('today');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [smsSale, setSmsSale] = useState<Sale | null>(null);
  const [phoneDraft, setPhoneDraft] = useState('');
  const [smsError, setSmsError] = useState('');

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

  function startSms(sale: Sale) {
    setSmsSale(sale);
    setPhoneDraft(sale.customerPhone ?? '');
    setSmsError('');
  }

  function confirmSms() {
    if (!smsSale) return;
    if (!isValidPhMobile(phoneDraft)) {
      setSmsError('Enter a valid PH mobile (e.g. 09171234567).');
      return;
    }
    updateSaleCustomer(smsSale.id, {
      customerName: smsSale.customerName,
      customerPhone: phoneDraft,
    });
    const updated = { ...smsSale, customerPhone: phoneDraft.trim() };
    openReceiptSms(phoneDraft, updated, settings);
    setSmsSale(null);
  }

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
              {!sale.voided && (
                <div className="sale-actions">
                  <button type="button" className="sms-btn" onClick={() => startSms(sale)}>
                    SMS
                  </button>
                  {can('sale.void') && (
                    <button
                      type="button"
                      className="ghost-btn void-btn"
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
              <p className="sale-items">
                {sale.items.map((i) => `${i.quantity}× ${i.name}`).join(' · ')}
                {sale.customerPhone ? ` · ${sale.customerPhone}` : ''}
              </p>
            </li>
          ))
        )}
      </ul>

      {open && <RecordSaleSheet onClose={() => setOpen(false)} />}

      {smsSale && (
        <div className="sheet-backdrop" role="presentation" onClick={() => setSmsSale(null)}>
          <div
            className="sheet sheet-compact"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sms-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="sheet-head">
              <h2 id="sms-title">Send SMS receipt</h2>
              <button type="button" className="ghost-btn" onClick={() => setSmsSale(null)}>
                Close
              </button>
            </header>
            <div className="sheet-body">
              <p className="sms-hint">
                Opens Messages with a {settings.storeName} receipt for{' '}
                <strong>{money(smsSale.total)}</strong>.
              </p>
              <label className="stacked-label">
                Client mobile
                <input
                  type="tel"
                  inputMode="tel"
                  placeholder="0917 123 4567"
                  value={phoneDraft}
                  onChange={(e) => setPhoneDraft(e.target.value)}
                />
              </label>
              {smsError && <p className="form-error">{smsError}</p>}
            </div>
            <footer className="sheet-foot">
              <button type="button" className="primary-btn" onClick={confirmSms}>
                Open SMS
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
