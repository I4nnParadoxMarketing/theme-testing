import { useMemo, useState } from 'react';
import { IconPlus, IconSearch } from '../components/Icons';
import { ProductThumb } from '../components/ProductThumb';
import { money } from '../lib/format';
import { stockStatus } from '../lib/stats';
import { CATEGORIES } from '../data/categories';
import { useStore } from '../hooks/useStore';
import type { Category, Product } from '../types';
import { ProductSheet } from './ProductSheet';

export function Inventory() {
  const { products, adjustStock } = useStore();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | 'All'>('All');
  const [editing, setEditing] = useState<Product | null>(null);
  const [adding, setAdding] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((p) => (category === 'All' ? true : p.category === category))
      .filter(
        (p) =>
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q),
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, query, category]);

  return (
    <div className="screen fade-in">
      <header className="screen-header">
        <div>
          <p className="eyebrow">Stockroom</p>
          <h1>Inventory</h1>
        </div>
        <button type="button" className="fab-btn" onClick={() => setAdding(true)} aria-label="Add product">
          <IconPlus />
          <span>Add</span>
        </button>
      </header>

      <label className="search-field">
        <IconSearch />
        <input
          type="search"
          placeholder="Search name, SKU, category"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>

      <div className="filter-row scroll-x" role="tablist" aria-label="Category">
        {(['All', ...CATEGORIES] as const).map((c) => (
          <button
            key={c}
            type="button"
            role="tab"
            aria-selected={category === c}
            className={`chip${category === c ? ' active' : ''}`}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <ul className="inv-list">
        {filtered.map((p, index) => {
          const status = stockStatus(p);
          return (
            <li key={p.id} className={`inv-row rise-${Math.min(index + 1, 5)}`}>
              <button type="button" className="inv-main" onClick={() => setEditing(p)}>
                <ProductThumb name={p.name} image={p.image} category={p.category} size="md" />
                <div className="inv-copy">
                  <strong>{p.name}</strong>
                  <span>
                    {p.sku} · {p.category}
                  </span>
                </div>
                <em className={`stock-badge status-${status}`}>
                  {p.stock} {p.unit}
                </em>
              </button>
              <div className="inv-meta">
                <span>{money(p.price)}</span>
                <div className="qty-controls">
                  <button type="button" aria-label={`Decrease ${p.name}`} onClick={() => adjustStock(p.id, -1)}>
                    −
                  </button>
                  <button type="button" aria-label={`Increase ${p.name}`} onClick={() => adjustStock(p.id, 1)}>
                    +
                  </button>
                </div>
              </div>
            </li>
          );
        })}
        {filtered.length === 0 && <li className="empty-block">No products match this filter.</li>}
      </ul>

      {(adding || editing) && (
        <ProductSheet
          product={editing}
          onClose={() => {
            setAdding(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
