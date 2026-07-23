import { useState } from 'react';
import { isValidPhMobile, money } from '../lib/format';
import { buildReceiptMessage, openReceiptSms, shareReceipt } from '../lib/receiptSms';
import { useStore } from '../hooks/useStore';
import type { Sale } from '../types';

interface Props {
  sale: Sale;
  title?: string;
  onClose: () => void;
  onSent?: () => void;
}

export function SendReceiptSheet({ sale, title = 'Send SMS receipt', onClose, onSent }: Props) {
  const { settings, updateSaleCustomer, customers } = useStore();
  const [phoneDraft, setPhoneDraft] = useState(sale.customerPhone ?? '');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const preview = buildReceiptMessage(
    { ...sale, customerPhone: phoneDraft.trim() || sale.customerPhone },
    settings,
  );

  async function sendSms() {
    if (!isValidPhMobile(phoneDraft)) {
      setError('Enter a valid PH mobile (e.g. 09171234567).');
      return;
    }
    setBusy(true);
    setError('');
    setStatus('');
    updateSaleCustomer(sale.id, {
      customerName: sale.customerName,
      customerPhone: phoneDraft,
    });
    const updated = { ...sale, customerPhone: phoneDraft.trim() };
    const result = await openReceiptSms(phoneDraft, updated, settings);
    setBusy(false);
    if (result === 'failed') {
      setError('Could not open SMS. Try Share receipt or Copy instead.');
      return;
    }
    if (result === 'clipboard') {
      setStatus('Receipt copied. Paste it into Messages and send.');
      return;
    }
    if (result === 'share') {
      setStatus('Choose Messages / SMS in the share sheet.');
      return;
    }
    setStatus('Opening Messages… tap Send in your SMS app.');
    onSent?.();
  }

  async function onShare() {
    setBusy(true);
    setError('');
    const result = await shareReceipt(
      { ...sale, customerPhone: phoneDraft.trim() || sale.customerPhone },
      settings,
    );
    setBusy(false);
    if (result === 'clipboard') setStatus('Receipt copied to clipboard.');
    else if (result === 'failed') setError('Share is not available on this device.');
    else setStatus('Pick Messages or another app to send.');
  }

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(preview);
      setStatus('Receipt copied. Open Messages and paste.');
      setError('');
    } catch {
      setError('Could not copy. Long-press the preview to copy.');
    }
  }

  return (
    <div className="sheet-backdrop" role="presentation" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="send-receipt-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sheet-head">
          <h2 id="send-receipt-title">{title}</h2>
          <button type="button" className="ghost-btn" onClick={onClose}>
            Close
          </button>
        </header>

        <div className="sheet-body">
          <p className="sms-hint">
            Receipt total <strong>{money(sale.total)}</strong>
            {sale.customerName ? ` for ${sale.customerName}` : ''}.
          </p>

          {customers.length > 0 && (
            <label className="stacked-label">
              Saved customer
              <select
                defaultValue=""
                onChange={(e) => {
                  const c = customers.find((x) => x.id === e.target.value);
                  if (c) setPhoneDraft(c.phone);
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

          <div className="receipt-preview" aria-label="Receipt preview">
            <pre>{preview}</pre>
          </div>

          {error && <p className="form-error">{error}</p>}
          {status && <p className="ok-line">{status}</p>}
        </div>

        <footer className="sheet-foot">
          <button type="button" className="primary-btn" disabled={busy} onClick={() => void sendSms()}>
            {busy ? 'Opening…' : 'Send SMS receipt'}
          </button>
          <button type="button" className="secondary-btn full" disabled={busy} onClick={() => void onShare()}>
            Share receipt
          </button>
          <button type="button" className="secondary-btn full" disabled={busy} onClick={() => void onCopy()}>
            Copy receipt
          </button>
        </footer>
      </div>
    </div>
  );
}
