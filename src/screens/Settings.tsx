import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useStore } from '../hooks/useStore';

export function Settings() {
  const { settings, updateSettings, resetDemo, cloud, cloudStatus, cloudError, updateCloudConfig, syncNow } =
    useStore();
  const { can } = useAuth();
  const [storeName, setStoreName] = useState(settings.storeName);
  const [address, setAddress] = useState(settings.address);
  const [phone, setPhone] = useState(settings.phone);
  const [receiptFooter, setReceiptFooter] = useState(settings.receiptFooter);
  const [supabaseUrl, setSupabaseUrl] = useState(cloud.supabaseUrl);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(cloud.supabaseAnonKey);
  const [enabled, setEnabled] = useState(cloud.enabled);
  const [saved, setSaved] = useState(false);
  const [cloudMsg, setCloudMsg] = useState('');

  if (!can('settings.manage')) {
    return (
      <div className="screen fade-in">
        <p className="empty-block">Admin only.</p>
        <Link to="/more" className="text-link">
          Back
        </Link>
      </div>
    );
  }

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

  async function saveCloud() {
    setCloudMsg('Connecting…');
    await updateCloudConfig({
      supabaseUrl: supabaseUrl.trim(),
      supabaseAnonKey: supabaseAnonKey.trim(),
      enabled,
    });
    setCloudMsg(enabled ? 'Cloud settings saved. Syncing…' : 'Cloud sync disabled. Using this device only.');
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
        {saved ? 'Saved' : 'Save store details'}
      </button>

      <section className="panel">
        <div className="panel-head">
          <h2>Go online (Supabase)</h2>
        </div>
        <p className="empty-line">
          Status: <strong>{cloudStatus}</strong>
          {cloudError ? ` · ${cloudError}` : ''}
        </p>
        <div className="form-stack">
          <label className="stacked-label">
            Supabase URL
            <input
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://xxxx.supabase.co"
            />
          </label>
          <label className="stacked-label">
            Anon key
            <input
              value={supabaseAnonKey}
              onChange={(e) => setSupabaseAnonKey(e.target.value)}
              placeholder="eyJhbGciOi..."
            />
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
            Enable online sync for all devices
          </label>
        </div>
        {cloudMsg && <p className="ok-line">{cloudMsg}</p>}
        <div className="action-stack">
          <button type="button" className="primary-btn" onClick={() => void saveCloud()}>
            Save cloud settings
          </button>
          <button type="button" className="secondary-btn full" onClick={() => void syncNow()}>
            Sync now
          </button>
        </div>
        <p className="empty-line">
          Setup steps are in <strong>ONLINE.md</strong> — create a free Supabase project, run{' '}
          <code>supabase/schema.sql</code>, then paste URL + anon key here.
        </p>
      </section>

      {can('demo.reset') && (
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
      )}
    </div>
  );
}
