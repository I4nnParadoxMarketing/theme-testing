import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { IconPlus, IconSearch } from '../components/Icons';
import { isValidPhMobile } from '../lib/format';
import { openSms } from '../lib/receiptSms';
import { useStore } from '../hooks/useStore';
import type { Customer } from '../types';

export function Customers() {
  const { customers, upsertCustomer, deleteCustomer, settings } = useStore();
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Customer | null>(null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customers
      .filter(
        (c) =>
          !q ||
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          (c.note ?? '').toLowerCase().includes(q),
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [customers, query]);

  function openAdd() {
    setAdding(true);
    setEditing(null);
    setName('');
    setPhone('');
    setNote('');
    setError('');
  }

  function openEdit(c: Customer) {
    setEditing(c);
    setAdding(false);
    setName(c.name);
    setPhone(c.phone);
    setNote(c.note ?? '');
    setError('');
  }

  function save() {
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    if (!isValidPhMobile(phone)) {
      setError('Enter a valid PH mobile (e.g. 09171234567).');
      return;
    }
    upsertCustomer({ id: editing?.id, name, phone, note });
    setAdding(false);
    setEditing(null);
  }

  const sheetOpen = adding || editing;

  return (
    <div className="screen fade-in">
      <header className="screen-header">
        <div>
          <p className="eyebrow">
            <Link to="/more" className="text-link">
              More
            </Link>
          </p>
          <h1>Customers</h1>
        </div>
        <button type="button" className="fab-btn" onClick={openAdd}>
          <IconPlus />
          <span>Add</span>
        </button>
      </header>

      <label className="search-field">
        <IconSearch />
        <input
          type="search"
          placeholder="Search name or mobile"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>

      <ul className="customer-list">
        {filtered.map((c) => (
          <li key={c.id} className="customer-row">
            <button type="button" className="customer-main" onClick={() => openEdit(c)}>
              <strong>{c.name}</strong>
              <span>
                {c.phone}
                {c.note ? ` · ${c.note}` : ''}
              </span>
            </button>
            <button
              type="button"
              className="sms-btn"
              onClick={() => {
                void openSms(
                  c.phone,
                  `Kumusta ${c.name}! This is ${settings.storeName}. Salamat po.`,
                );
              }}
            >
              SMS
            </button>
          </li>
        ))}
        {filtered.length === 0 && <li className="empty-block">No customers yet.</li>}
      </ul>

      {sheetOpen && (
        <div
          className="sheet-backdrop"
          role="presentation"
          onClick={() => {
            setAdding(false);
            setEditing(null);
          }}
        >
          <div className="sheet sheet-compact" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <header className="sheet-head">
              <h2>{editing ? 'Edit customer' : 'Add customer'}</h2>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => {
                  setAdding(false);
                  setEditing(null);
                }}
              >
                Close
              </button>
            </header>
            <div className="sheet-body form-grid">
              <label>
                Name
                <input value={name} onChange={(e) => setName(e.target.value)} />
              </label>
              <label>
                Mobile
                <input
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0917 123 4567"
                />
              </label>
              <label>
                Note
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" />
              </label>
            </div>
            <footer className="sheet-foot">
              {error && <p className="form-error">{error}</p>}
              <button type="button" className="primary-btn" onClick={save}>
                Save customer
              </button>
              {editing && (
                <button
                  type="button"
                  className="secondary-btn full danger"
                  onClick={() => {
                    deleteCustomer(editing.id);
                    setEditing(null);
                  }}
                >
                  Delete
                </button>
              )}
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
