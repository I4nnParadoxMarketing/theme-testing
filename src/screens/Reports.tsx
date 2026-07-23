import { format, subDays } from 'date-fns';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { money } from '../lib/format';
import {
  buildDailyReportMessage,
  buildReorderMessage,
  openSms,
  shareText,
} from '../lib/receiptSms';
import {
  lowStockProducts,
  paymentBreakdown,
  profitForSales,
  salesInRange,
  sumSales,
  todaySales,
} from '../lib/stats';
import { useStore } from '../hooks/useStore';

type Period = 'today' | '7d';

export function Reports() {
  const { sales, products, settings } = useStore();
  const [period, setPeriod] = useState<Period>('today');

  const stats = useMemo(() => {
    const now = new Date();
    const list =
      period === 'today' ? todaySales(sales) : salesInRange(sales, subDays(now, 6), now);
    const revenue = sumSales(list);
    const profit = profitForSales(list, products);
    const payments = paymentBreakdown(list);
    const low = lowStockProducts(products);
    return { list, revenue, profit, payments, low, tickets: list.length };
  }, [sales, products, period]);

  async function shareReport() {
    const text = buildDailyReportMessage({
      settings,
      dateLabel:
        period === 'today'
          ? format(new Date(), 'MMMM d, yyyy')
          : `Last 7 days · ${format(new Date(), 'MMM d')}`,
      tickets: stats.tickets,
      revenue: stats.revenue,
      profit: stats.profit,
      payments: stats.payments,
    });
    await shareText(`${settings.storeName} report`, text);
  }

  function smsReorder() {
    if (!stats.low.length) return;
    const text = buildReorderMessage(stats.low, settings);
    void openSms(undefined, text);
  }

  return (
    <div className="screen fade-in">
      <header className="screen-header">
        <div>
          <p className="eyebrow">
            <Link to="/more" className="text-link">
              More
            </Link>
          </p>
          <h1>Reports</h1>
        </div>
      </header>

      <div className="filter-row" role="tablist">
        {(
          [
            ['today', 'Today'],
            ['7d', '7 days'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`chip${period === key ? ' active' : ''}`}
            onClick={() => setPeriod(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <section className="kpi-strip">
        <div className="kpi primary">
          <span className="kpi-label">Sales</span>
          <strong className="kpi-value">{money(stats.revenue)}</strong>
          <span className="kpi-meta">{stats.tickets} tickets</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Profit</span>
          <strong className="kpi-value">{money(stats.profit)}</strong>
          <span className="kpi-meta">est.</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Avg</span>
          <strong className="kpi-value">
            {money(stats.tickets ? stats.revenue / stats.tickets : 0)}
          </strong>
          <span className="kpi-meta">ticket</span>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>By payment</h2>
        </div>
        {stats.payments.length === 0 ? (
          <p className="empty-line">No sales in this period.</p>
        ) : (
          <ul className="rank-list">
            {stats.payments.map((p) => (
              <li key={p.method}>
                <div>
                  <strong>{p.method}</strong>
                  <span>{p.count} tickets</span>
                </div>
                <em>{money(p.total)}</em>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Actions</h2>
        </div>
        <div className="action-stack">
          <button type="button" className="primary-btn" onClick={() => void shareReport()}>
            Share / SMS report
          </button>
          <button
            type="button"
            className="secondary-btn full"
            onClick={smsReorder}
            disabled={!stats.low.length}
          >
            SMS reorder list ({stats.low.length})
          </button>
        </div>
      </section>
    </div>
  );
}
