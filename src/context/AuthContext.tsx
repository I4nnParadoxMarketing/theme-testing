import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AppUser, AuthSession, UserRole } from '../auth/types';
import { hashPassword, verifyPassword } from '../auth/password';
import { clearSession, loadSession, saveSession } from '../auth/sessionStore';
import { loadUsers, saveUsers, subscribeUsers } from '../auth/userStore';
import { pushTransactions } from '../sync/cloudSync';
import { loadSyncMeta } from '../sync/syncMeta';
import { loadTransactions } from '../storage';
import { createId } from '../utils/id';

interface AuthContextValue {
  ready: boolean;
  session: AuthSession | null;
  users: AppUser[];
  currentUser: AppUser | null;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  changeOwnPassword: (currentPassword: string, nextPassword: string) => Promise<void>;
  addStaff: (input: {
    username: string;
    password: string;
    displayName?: string;
  }) => Promise<void>;
  updateStaff: (
    userId: string,
    patch: { password?: string; displayName?: string; active?: boolean },
  ) => Promise<void>;
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function syncUsersOnline(users: AppUser[]) {
  const meta = await loadSyncMeta();
  if (!meta.enabled || !meta.syncCode) return;
  const transactions = await loadTransactions();
  await pushTransactions(transactions, meta, users);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [session, setSession] = useState<AuthSession | null>(null);

  const refreshUsers = useCallback(async () => {
    const next = await loadUsers();
    setUsers(next);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [storedUsers, storedSession] = await Promise.all([loadUsers(), loadSession()]);
      if (!mounted) return;
      setUsers(storedUsers);
      if (storedSession) {
        const stillValid = storedUsers.find(
          (u) => u.id === storedSession.userId && u.active && u.username === storedSession.username,
        );
        setSession(stillValid ? storedSession : null);
        if (!stillValid) await clearSession();
      }
      setReady(true);
    })();

    const unsubscribe = subscribeUsers((next) => {
      setUsers(next);
      setSession((prev) => {
        if (!prev) return prev;
        const stillValid = next.find(
          (u) => u.id === prev.userId && u.active && u.username === prev.username,
        );
        if (!stillValid) {
          void clearSession();
          return null;
        }
        return prev;
      });
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const currentUser = useMemo(
    () => (session ? users.find((u) => u.id === session.userId) || null : null),
    [session, users],
  );

  const login = useCallback(async (username: string, password: string) => {
    const list = await loadUsers();
    const key = username.trim().toLowerCase();
    const user = list.find((item) => item.username === key);
    if (!user || !user.active) {
      throw new Error('Account not found or inactive.');
    }
    if (!verifyPassword(password, user.passwordHash)) {
      throw new Error('Incorrect password.');
    }
    const nextSession: AuthSession = {
      userId: user.id,
      username: user.username,
      role: user.role,
      loggedInAt: new Date().toISOString(),
    };
    await saveSession(nextSession);
    setUsers(list);
    setSession(nextSession);
  }, []);

  const logout = useCallback(async () => {
    await clearSession();
    setSession(null);
  }, []);

  const persistUsers = useCallback(async (next: AppUser[]) => {
    const saved = await saveUsers(next);
    setUsers(saved);
    try {
      await syncUsersOnline(saved);
    } catch {
      // Keep local account changes even if cloud is offline.
    }
    return saved;
  }, []);

  const changeOwnPassword = useCallback(
    async (currentPassword: string, nextPassword: string) => {
      if (!session) throw new Error('Not logged in.');
      if (!nextPassword || nextPassword.length < 4) {
        throw new Error('New password must be at least 4 characters.');
      }
      const list = await loadUsers();
      const user = list.find((item) => item.id === session.userId);
      if (!user) throw new Error('Account not found.');
      if (!verifyPassword(currentPassword, user.passwordHash)) {
        throw new Error('Current password is incorrect.');
      }
      const now = new Date().toISOString();
      const next = list.map((item) =>
        item.id === user.id
          ? { ...item, passwordHash: hashPassword(nextPassword), updatedAt: now }
          : item,
      );
      await persistUsers(next);
    },
    [persistUsers, session],
  );

  const addStaff = useCallback(
    async (input: { username: string; password: string; displayName?: string }) => {
      if (session?.role !== 'admin') throw new Error('Only admin can add staff.');
      const username = input.username.trim().toLowerCase();
      if (!username) throw new Error('Enter a staff username.');
      if (!input.password || input.password.length < 4) {
        throw new Error('Password must be at least 4 characters.');
      }
      if (username === 'admin') throw new Error('Username "admin" is reserved.');

      const list = await loadUsers();
      if (list.some((item) => item.username === username)) {
        throw new Error('That username already exists.');
      }

      const now = new Date().toISOString();
      const staff: AppUser = {
        id: createId(),
        username,
        role: 'staff',
        passwordHash: hashPassword(input.password),
        displayName: input.displayName?.trim() || undefined,
        active: true,
        createdAt: now,
        updatedAt: now,
      };
      await persistUsers([...list, staff]);
    },
    [persistUsers, session?.role],
  );

  const updateStaff = useCallback(
    async (
      userId: string,
      patch: { password?: string; displayName?: string; active?: boolean },
    ) => {
      if (session?.role !== 'admin') throw new Error('Only admin can update staff.');
      const list = await loadUsers();
      const target = list.find((item) => item.id === userId);
      if (!target) throw new Error('Staff account not found.');
      if (target.role === 'admin' && patch.active === false) {
        throw new Error('Cannot deactivate the admin account.');
      }
      if (patch.password !== undefined && patch.password.length < 4) {
        throw new Error('Password must be at least 4 characters.');
      }

      const now = new Date().toISOString();
      const next = list.map((item) => {
        if (item.id !== userId) return item;
        return {
          ...item,
          displayName:
            patch.displayName !== undefined
              ? patch.displayName.trim() || undefined
              : item.displayName,
          active: patch.active !== undefined ? patch.active : item.active,
          passwordHash:
            patch.password !== undefined ? hashPassword(patch.password) : item.passwordHash,
          updatedAt: now,
        };
      });
      await persistUsers(next);
    },
    [persistUsers, session?.role],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      session,
      users,
      currentUser,
      isAdmin: session?.role === 'admin',
      login,
      logout,
      changeOwnPassword,
      addStaff,
      updateStaff,
      refreshUsers,
    }),
    [
      ready,
      session,
      users,
      currentUser,
      login,
      logout,
      changeOwnPassword,
      addStaff,
      updateStaff,
      refreshUsers,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export type { UserRole };
