import { useState, type FormEvent } from 'react';
import { IconBolt } from '../components/Icons';
import { useAuth } from '../auth/AuthContext';

export function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('admin');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const result = await login(username, pin);
    setBusy(false);
    if (!result.ok) setError(result.error);
  }

  return (
    <div className="login-screen">
      <div className="login-card fade-in">
        <div className="brand-lockup">
          <span className="brand-mark">
            <IconBolt size={22} />
          </span>
          <h1 className="brand-name">Gaba Hardware</h1>
        </div>
        <p className="brand-tagline">Sign in as Admin (boss) or Staff cashier.</p>

        <form className="form-stack" onSubmit={(e) => void submit(e)}>
          <label className="stacked-label">
            Username
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              placeholder="admin or staff"
            />
          </label>
          <label className="stacked-label">
            PIN
            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              autoComplete="current-password"
              placeholder="••••"
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="primary-btn" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="login-hints">
          <p>
            <strong>Admin</strong> · username <code>admin</code> · PIN <code>0000</code>
          </p>
          <p>
            <strong>Staff</strong> · username <code>staff</code> · PIN <code>1234</code>
          </p>
        </div>
      </div>
    </div>
  );
}
