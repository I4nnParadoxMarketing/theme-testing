import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createSeedUsers } from '../data/users';
import { uid } from '../lib/format';
import { hashPin, verifyPin } from '../lib/pin';
import type { StoreUser, UserRole } from '../types';
import { can, type Permission } from './permissions';

const USERS_KEY = 'gaba-hardware-users-v1';
const SESSION_KEY = 'gaba-hardware-session-v1';

interface AuthContextValue {
  user: StoreUser | null;
  users: StoreUser[];
  loading: boolean;
  login: (username: string, pin: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => void;
  can: (permission: Permission) => boolean;
  setUsers: (users: StoreUser[]) => void;
  addUser: (input: {
    name: string;
    username: string;
    role: UserRole;
    pin: string;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
  updateUser: (
    id: string,
    patch: Partial<Pick<StoreUser, 'name' | 'role' | 'active'>> & { pin?: string },
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function loadUsers(): Promise<StoreUser[]> {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
      const seeded = await createSeedUsers();
      localStorage.setItem(USERS_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as StoreUser[];
    if (!parsed.length) {
      const seeded = await createSeedUsers();
      localStorage.setItem(USERS_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return parsed;
  } catch {
    return createSeedUsers();
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsersState] = useState<StoreUser[]>([]);
  const [user, setUser] = useState<StoreUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const list = await loadUsers();
      setUsersState(list);
      try {
        const sessionId = localStorage.getItem(SESSION_KEY);
        if (sessionId) {
          const found = list.find((u) => u.id === sessionId && u.active);
          if (found) setUser(found);
        }
      } catch {
        /* ignore */
      }
      setLoading(false);
    })();
  }, []);

  const persistUsers = useCallback((next: StoreUser[]) => {
    setUsersState(next);
    localStorage.setItem(USERS_KEY, JSON.stringify(next));
  }, []);

  const login = useCallback(
    async (username: string, pin: string) => {
      const found = users.find(
        (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.active,
      );
      if (!found) return { ok: false as const, error: 'Account not found or inactive.' };
      const match = await verifyPin(pin, found.pinHash);
      if (!match) return { ok: false as const, error: 'Wrong PIN.' };
      setUser(found);
      localStorage.setItem(SESSION_KEY, found.id);
      return { ok: true as const };
    },
    [users],
  );

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  }, []);

  const addUser = useCallback(
    async (input: { name: string; username: string; role: UserRole; pin: string }) => {
      const username = input.username.trim().toLowerCase();
      if (!input.name.trim() || !username || !input.pin.trim()) {
        return { ok: false as const, error: 'Name, username, and PIN are required.' };
      }
      if (input.pin.trim().length < 4) {
        return { ok: false as const, error: 'PIN must be at least 4 digits.' };
      }
      if (users.some((u) => u.username.toLowerCase() === username)) {
        return { ok: false as const, error: 'Username already exists.' };
      }
      const pinHash = await hashPin(input.pin);
      const next: StoreUser = {
        id: uid('user'),
        name: input.name.trim(),
        username,
        role: input.role,
        pinHash,
        active: true,
        createdAt: new Date().toISOString(),
      };
      persistUsers([next, ...users]);
      return { ok: true as const };
    },
    [persistUsers, users],
  );

  const updateUser = useCallback(
    async (
      id: string,
      patch: Partial<Pick<StoreUser, 'name' | 'role' | 'active'>> & { pin?: string },
    ) => {
      const current = users.find((u) => u.id === id);
      if (!current) return { ok: false as const, error: 'User not found.' };
      let pinHash = current.pinHash;
      if (patch.pin) {
        if (patch.pin.trim().length < 4) {
          return { ok: false as const, error: 'PIN must be at least 4 digits.' };
        }
        pinHash = await hashPin(patch.pin);
      }
      const next = users.map((u) =>
        u.id === id
          ? {
              ...u,
              name: patch.name?.trim() || u.name,
              role: patch.role ?? u.role,
              active: patch.active ?? u.active,
              pinHash,
            }
          : u,
      );
      persistUsers(next);
      if (user?.id === id) {
        const refreshed = next.find((u) => u.id === id) ?? null;
        setUser(refreshed);
      }
      return { ok: true as const };
    },
    [persistUsers, user?.id, users],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      users,
      loading,
      login,
      logout,
      can: (permission) => can(user?.role, permission),
      setUsers: persistUsers,
      addUser,
      updateUser,
      isAdmin: user?.role === 'admin',
    }),
    [user, users, loading, login, logout, persistUsers, addUser, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
