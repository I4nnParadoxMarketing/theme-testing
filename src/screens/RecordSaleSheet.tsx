import { useMemo, useState } from 'react';
import { isValidPhMobile, money } from '../lib/format';
import { openReceiptSms } from '../lib/receiptSms';
import { useStore } from '../hooks/useStore';
import type { PaymentMethod, SaleItem } from '../types';

interface Props {
  onClose: () => void;
}

const PAYMENTS: PaymentMethod[] = ['Cash', 'GCash', 'Card', 'Bank transfer'];

export function RecordSaleSheet({ onClose }: Props) {
  const { products, recordSale } = useStore();
  const [qty, setQty] = useState<Record<string, number>>({});
  const [payment, setPayment] = useState<PaymentMethod>('Cash');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
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
    if (sendSms && !isValidPhMobile(customerPhone)) {
      setError('Enter a valid PH mobile (e.g. 09171234567) to send SMS.');
      return;
    }

    const sale = recordSale({
      items: buildItems(),
      paymentMethod: payment,
      customerName,
      customerPhone,
    });
    if (!sale) return;

    if (sendSms) {
      openReceiptSms(customerPhone, sale);
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

          <div className="customer-fields">
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
