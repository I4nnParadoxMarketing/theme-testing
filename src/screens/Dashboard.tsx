import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { IconAlert, IconBolt, IconChevron } from '../components/Icons';
import { ProductThumb } from '../components/ProductThumb';
import { money } from '../lib/format';
import {
  inventoryValue,
  lowStockProducts,
  profitForSales,
  stockStatus,
  sumSales,
  todaySales,
  topSelling,
  weekSeries,
} from '../lib/stats';
import { useStore } from '../hooks/useStore';

export function Dashboard() {
  const { products, sales, settings } = useStore();

  const stats = useMemo(() => {
    const today = todaySales(sales);
    const series = weekSeries(sales);
    const weekTotal = sumSales(
      sales.filter((s) => {
        const t = new Date(s.createdAt).getTime();
        return t >= Date.now() - 7 * 24 * 60 * 60 * 1000;
      }),
    );
    return {
      todayTotal: sumSales(today),
      todayCount: today.length,
      todayProfit: profitForSales(today, products),
      weekTotal,
      series,
      low: lowStockProducts(products),
      invValue: inventoryValue(products),
      top: topSelling(sales, 4),
      skuCount: products.length,
    };
  }, [products, sales]);

  return (
    <div className="screen dashboard fade-in">
      <header className="dash-hero">
        <div className="brand-lockup">
          <span className="brand-mark">
            <IconBolt size={22} />
          </span>
          <h1 className="brand-name">{settings.storeName}</h1>
        </div>
        <p className="brand-tagline">Floor ops for tools, stock, and today&apos;s till.</p>
      </header>

      <section className="kpi-strip" aria-label="Today overview">
        <div className="kpi primary rise-1">
          <span className="kpi-label">Today</span>
          <strong className="kpi-value">{money(stats.todayTotal)}</strong>
          <span className="kpi-meta">{stats.todayCount} sales</span>
        </div>
        <div className="kpi rise-2">
          <span className="kpi-label">Profit</span>
          <strong className="kpi-value">{money(stats.todayProfit)}</strong>
          <span className="kpi-meta">today est.</span>
        </div>
        <div className="kpi rise-3">
          <span className="kpi-label">Stock</span>
          <strong className="kpi-value">{money(stats.invValue)}</strong>
          <span className="kpi-meta">{stats.skuCount} SKUs</span>
        </div>
      </section>

      <section className="panel rise-2">
        <div className="panel-head">
          <h2>Sales this week</h2>
          <Link to="/sales" className="text-link">
            View all <IconChevron size={14} />
          </Link>
        </div>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={stats.series} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E10600" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#E10600" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#000000', fontSize: 11, fontFamily: 'Figtree' }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#666666', fontSize: 11, fontFamily: 'Figtree' }}
                width={36}
              />
              <Tooltip
                contentStyle={{
                  background: '#000000',
                  border: '2px solid #FF6A00',
                  borderRadius: 0,
                  color: '#FFFFFF',
                  fontFamily: 'Figtree',
                  fontSize: 12,
                }}
                formatter={(value) => [money(Number(value ?? 0)), 'Sales']}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#E10600"
                strokeWidth={2.4}
                fill="url(#salesFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel rise-3">
        <div className="panel-head">
          <h2>
            <IconAlert size={16} className="inline-icon warn" /> Low stock
          </h2>
          <Link to="/inventory" className="text-link">
            Inventory <IconChevron size={14} />
          </Link>
        </div>
        {stats.low.length === 0 ? (
          <p className="empty-line">All items above reorder levels.</p>
        ) : (
          <ul className="alert-list">
            {stats.low.slice(0, 4).map((p) => {
              const status = stockStatus(p);
              return (
                <li key={p.id} className={`alert-row status-${status}`}>
                  <ProductThumb name={p.name} image={p.image} category={p.category} size="sm" />
                  <div className="alert-copy">
                    <strong>{p.name}</strong>
                    <span>
                      {p.sku} · reorder at {p.reorderAt}
                    </span>
                  </div>
                  <em>
                    {p.stock} {p.unit}
                  </em>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="panel rise-3">
        <div className="panel-head">
          <h2>Quick links</h2>
        </div>
        <div className="quick-links">
          <Link to="/reports" className="quick-link">
            Reports
          </Link>
          <Link to="/customers" className="quick-link">
            Customers
          </Link>
          <Link to="/sales" className="quick-link">
            New sale
          </Link>
        </div>
      </section>

      <section className="panel rise-4">
        <div className="panel-head">
          <h2>Top movers</h2>
        </div>
        <ul className="rank-list">
          {stats.top.map((item, i) => {
            const product = products.find((p) => p.id === item.productId);
            return (
              <li key={item.productId}>
                <span className="rank">{i + 1}</span>
                <ProductThumb
                  name={item.name}
                  image={product?.image}
                  category={product?.category}
                  size="sm"
                />
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.qty} sold</span>
                </div>
                <em>{money(item.revenue)}</em>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
