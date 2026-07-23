import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import type { UserRole } from '../types';

export function Staff() {
  const { users, addUser, updateUser, can } = useAuth();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<UserRole>('staff');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  if (!can('staff.manage')) {
    return (
      <div className="screen fade-in">
        <p className="empty-block">Admin only. Ask the boss for access.</p>
        <Link to="/more" className="text-link">
          Back to More
        </Link>
      </div>
    );
  }

  async function createStaff(e: FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    const result = await addUser({ name, username, role, pin });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setName('');
    setUsername('');
    setPin('');
    setRole('staff');
    setMessage('Staff account created.');
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
          <h1>Staff</h1>
        </div>
      </header>

      <section className="panel">
        <div className="panel-head">
          <h2>Accounts</h2>
        </div>
        <ul className="rank-list">
          {users.map((u) => (
            <li key={u.id}>
              <div>
                <strong>
                  {u.name} · {u.role}
                </strong>
                <span>
                  @{u.username}
                  {u.active ? '' : ' · inactive'}
                </span>
              </div>
              {u.role !== 'admin' && (
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => void updateUser(u.id, { active: !u.active })}
                >
                  {u.active ? 'Disable' : 'Enable'}
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Add staff</h2>
        </div>
        <form className="form-stack" onSubmit={(e) => void createStaff(e)}>
          <label className="stacked-label">
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="stacked-label">
            Username
            <input value={username} onChange={(e) => setUsername(e.target.value)} />
          </label>
          <label className="stacked-label">
            Role
            <select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <label className="stacked-label">
            PIN
            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="At least 4 digits"
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          {message && <p className="ok-line">{message}</p>}
          <button type="submit" className="primary-btn">
            Create account
          </button>
        </form>
      </section>
    </div>
  );
}
