import { useMemo, useState } from 'react';
import { ProductThumb } from '../components/ProductThumb';
import { money } from '../lib/format';
import { favoriteProducts } from '../lib/stats';
import { useStore } from '../hooks/useStore';
import type { PaymentMethod, Sale, SaleItem } from '../types';

interface Props {
  onClose: () => void;
  /** Called after save when cashier chose Send SMS — parent should open receipt sheet. */
  onSavedForSms?: (sale: Sale) => void;
}

const PAYMENTS: PaymentMethod[] = ['Cash', 'GCash', 'Card', 'Bank transfer'];

export function RecordSaleSheet({ onClose, onSavedForSms }: Props) {
  const { products, customers, recordSale } = useStore();
  const [qty, setQty] = useState<Record<string, number>>({});
  const [payment, setPayment] = useState<PaymentMethod>('Cash');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [error, setError] = useState('');
  const [showAll, setShowAll] = useState(false);

  const favorites = favoriteProducts(products);
  const visibleProducts = showAll || favorites.length === 0 ? products : favorites;

  const lines = useMemo(() => {
    return products
      .map((p) => ({ product: p, quantity: qty[p.id] ?? 0 }))
      .filter((l) => l.quantity > 0);
  }, [products, qty]);

  const total = lines.reduce((acc, l) => acc + l.quantity * l.product.price, 0);

  function bump(id: string, delta: number, max: number) {
    setQty((prev) => {
      const next = Math.max(0, Math.min(max, (prev[id] ?? 0) + delta));
      return { ...prev, [id]: next };
    });
  }

  function pickCustomer(id: string) {
    const c = customers.find((x) => x.id === id);
    if (!c) return;
    setCustomerName(c.name);
    setCustomerPhone(c.phone);
  }

  function buildItems(): SaleItem[] {
    return lines.map(({ product, quantity }) => ({
      productId: product.id,
      name: product.name,
      quantity,
      unitPrice: product.price,
    }));
  }

  function submit(sendSms: boolean) {
    if (!lines.length) {
      setError('Add at least one item.');
      return;
    }

    const sale = recordSale({
      items: buildItems(),
      paymentMethod: payment,
      customerName,
      customerPhone,
      referenceNo: payment === 'GCash' || payment === 'Bank transfer' ? referenceNo : undefined,
    });
    if (!sale) return;

    if (sendSms) {
      onSavedForSms?.(sale);
      return;
    }
    onClose();
  }

  return (
    <div className="sheet-backdrop" role="presentation" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="record-sale-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sheet-head">
          <h2 id="record-sale-title">Record sale</h2>
          <button type="button" className="ghost-btn" onClick={onClose}>
            Close
          </button>
        </header>

        <div className="sheet-body">
          {favorites.length > 0 && (
            <div className="filter-row">
              <button
                type="button"
                className={`chip${!showAll ? ' active' : ''}`}
                onClick={() => setShowAll(false)}
              >
                Favorites
              </button>
              <button
                type="button"
                className={`chip${showAll ? ' active' : ''}`}
                onClick={() => setShowAll(true)}
              >
                All items
              </button>
            </div>
          )}

          <ul className="pick-list">
            {visibleProducts.map((p) => (
              <li key={p.id} className="pick-row">
                <ProductThumb name={p.name} image={p.image} category={p.category} size="sm" />
                <div className="pick-copy">
                  <strong>{p.name}</strong>
                  <span>
                    {money(p.price)} · {p.stock} in stock
                  </span>
                </div>
                <div className="qty-controls">
                  <button
                    type="button"
                    aria-label={`Fewer ${p.name}`}
                    onClick={() => bump(p.id, -1, p.stock)}
                  >
                    −
                  </button>
                  <span className="qty-val">{qty[p.id] ?? 0}</span>
                  <button
                    type="button"
                    aria-label={`More ${p.name}`}
                    onClick={() => bump(p.id, 1, p.stock)}
                    disabled={(qty[p.id] ?? 0) >= p.stock}
                  >
                    +
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="customer-fields">
            {customers.length > 0 && (
              <label>
                Saved customer
                <select
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) pickCustomer(e.target.value);
                  }}
                >
                  <option value="">Select client…</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} · {c.phone}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label>
              Customer name
              <input
                type="text"
                placeholder="Optional"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                autoComplete="name"
              />
            </label>
            <label>
              Mobile (SMS receipt)
              <input
                type="tel"
                inputMode="tel"
                placeholder="0917 123 4567"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                autoComplete="tel"
              />
            </label>
            {(payment === 'GCash' || payment === 'Bank transfer') && (
              <label>
                Reference no.
                <input
                  type="text"
                  placeholder="Optional GCash / transfer ref"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                />
              </label>
            )}
          </div>

          <fieldset className="pay-field">
            <legend>Payment</legend>
            {PAYMENTS.map((method) => (
              <label key={method} className={`pay-option${payment === method ? ' active' : ''}`}>
                <input
                  type="radio"
                  name="payment"
                  value={method}
                  checked={payment === method}
                  onChange={() => setPayment(method)}
                />
                {method}
              </label>
            ))}
          </fieldset>
        </div>

        <footer className="sheet-foot">
          {error && <p className="form-error">{error}</p>}
          <div className="foot-row">
            <span>Total</span>
            <strong>{money(total)}</strong>
          </div>
          <button type="button" className="primary-btn" onClick={() => submit(true)}>
            Save & send SMS
          </button>
          <button type="button" className="secondary-btn full" onClick={() => submit(false)}>
            Save only
          </button>
        </footer>
      </div>
    </div>
  );
}
