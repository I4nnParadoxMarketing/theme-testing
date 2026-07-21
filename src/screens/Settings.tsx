import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../hooks/useStore';

export function Settings() {
  const { settings, updateSettings, resetDemo } = useStore();
  const [storeName, setStoreName] = useState(settings.storeName);
  const [address, setAddress] = useState(settings.address);
  const [phone, setPhone] = useState(settings.phone);
  const [receiptFooter, setReceiptFooter] = useState(settings.receiptFooter);
  const [saved, setSaved] = useState(false);

  function save() {
    updateSettings({
      storeName: storeName.trim() || 'Gaba Hardware',
      address: address.trim(),
      phone: phone.trim(),
      receiptFooter: receiptFooter.trim() || 'Salamat! Thank you for your purchase.',
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
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
          <h1>Settings</h1>
        </div>
      </header>

      <div className="form-stack">
        <label className="stacked-label">
          Store name
          <input value={storeName} onChange={(e) => setStoreName(e.target.value)} />
        </label>
        <label className="stacked-label">
          Address
          <input value={address} onChange={(e) => setAddress(e.target.value)} />
        </label>
        <label className="stacked-label">
          Store mobile
          <input
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="09XX XXX XXXX"
          />
        </label>
        <label className="stacked-label">
          Receipt footer
          <input value={receiptFooter} onChange={(e) => setReceiptFooter(e.target.value)} />
        </label>
      </div>

      <button type="button" className="primary-btn" onClick={save}>
        {saved ? 'Saved' : 'Save settings'}
      </button>

      <section className="panel">
        <div className="panel-head">
          <h2>Demo data</h2>
        </div>
        <p className="empty-line">
          Reset products, sales, and customers back to the sample Gaba Hardware data.
        </p>
        <button
          type="button"
          className="secondary-btn full danger"
          onClick={() => {
            if (window.confirm('Reset all local data to demo?')) resetDemo();
          }}
        >
          Reset demo data
        </button>
      </section>
    </div>
  );
}
