import { format, isSameDay, subDays } from 'date-fns';
import { useMemo, useState } from 'react';
import { IconPlus } from '../components/Icons';
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
  const { sales, updateSaleCustomer } = useStore();
  const [filter, setFilter] = useState<Filter>('today');
  const [open, setOpen] = useState(false);
  const [smsSale, setSmsSale] = useState<Sale | null>(null);
  const [phoneDraft, setPhoneDraft] = useState('');
  const [smsError, setSmsError] = useState('');

  const filtered = useMemo(() => filterSales(sales, filter), [sales, filter]);
  const total = sumSales(filtered);

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
    openReceiptSms(phoneDraft, updated);
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
                  {sale.customerName ? ` · ${sale.customerName}` : ''}
                </span>
              </div>
              <button type="button" className="sms-btn" onClick={() => startSms(sale)}>
                SMS
              </button>
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
                Opens your Messages app with a Gaba Hardware receipt for{' '}
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
