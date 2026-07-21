import { useMemo, useState } from 'react';
import { money } from '../lib/format';
import { useStore } from '../hooks/useStore';
import type { Sale, SaleItem } from '../types';

interface Props {
  onClose: () => void;
}

export function RecordSaleSheet({ onClose }: Props) {
  const { products, recordSale } = useStore();
  const [qty, setQty] = useState<Record<string, number>>({});
  const [payment, setPayment] = useState<Sale['paymentMethod']>('Cash');
  const [error, setError] = useState('');

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

  function submit() {
    if (!lines.length) {
      setError('Add at least one item.');
      return;
    }
    const items: SaleItem[] = lines.map(({ product, quantity }) => ({
      productId: product.id,
      name: product.name,
      quantity,
      unitPrice: product.price,
    }));
    recordSale(items, payment);
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
          <ul className="pick-list">
            {products.map((p) => (
              <li key={p.id}>
                <div>
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

          <fieldset className="pay-field">
            <legend>Payment</legend>
            {(['Cash', 'Card', 'Transfer'] as const).map((method) => (
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
          <button type="button" className="primary-btn" onClick={submit}>
            Save sale
          </button>
        </footer>
      </div>
    </div>
  );
}
