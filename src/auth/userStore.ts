import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppUser } from './types';
import { hashPassword } from './password';

const USERS_KEY = 'gcash_cashflow_users_v1';

type UsersListener = (users: AppUser[]) => void;
const listeners = new Set<UsersListener>();

export function subscribeUsers(listener: UsersListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyUsers(users: AppUser[]) {
  listeners.forEach((listener) => listener(users));
}

export function createDefaultUsers(now = new Date().toISOString()): AppUser[] {
  const passwordHash = hashPassword('1234');
  return [
    {
      id: 'user-admin',
      username: 'admin',
      role: 'admin',
      passwordHash,
      displayName: 'Admin',
      active: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'user-staff',
      username: 'staff',
      role: 'staff',
      passwordHash,
      displayName: 'Staff',
      active: true,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

function normalizeUser(item: AppUser): AppUser | null {
  if (!item || typeof item.id !== 'string' || typeof item.username !== 'string') return null;
  if (item.role !== 'admin' && item.role !== 'staff') return null;
  if (typeof item.passwordHash !== 'string') return null;
  return {
    id: item.id,
    username: item.username.trim().toLowerCase(),
    role: item.role,
    passwordHash: item.passwordHash,
    displayName: item.displayName?.trim() || undefined,
    active: item.active !== false,
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || item.createdAt || new Date().toISOString(),
  };
}

export async function loadUsers(): Promise<AppUser[]> {
  try {
    const raw = await AsyncStorage.getItem(USERS_KEY);
    if (!raw) {
      const defaults = createDefaultUsers();
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(defaults));
      notifyUsers(defaults);
      return defaults;
    }
    const parsed = JSON.parse(raw) as AppUser[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const defaults = createDefaultUsers();
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(defaults));
      notifyUsers(defaults);
      return defaults;
    }
    const users = parsed
      .map(normalizeUser)
      .filter((item): item is AppUser => Boolean(item));

    // Always ensure a default admin account exists.
    if (!users.some((u) => u.role === 'admin' && u.active)) {
      const defaults = createDefaultUsers();
      const admin = defaults[0];
      const merged = [admin, ...users.filter((u) => u.username !== 'admin')];
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(merged));
      notifyUsers(merged);
      return merged;
    }

    return users;
  } catch {
    const defaults = createDefaultUsers();
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(defaults));
    notifyUsers(defaults);
    return defaults;
  }
}

export async function saveUsers(users: AppUser[]): Promise<AppUser[]> {
  const normalized = users
    .map(normalizeUser)
    .filter((item): item is AppUser => Boolean(item));
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(normalized));
  notifyUsers(normalized);
  return normalized;
}

export function mergeUsers(local: AppUser[], remote: AppUser[]): AppUser[] {
  const map = new Map<string, AppUser>();

  for (const item of [...local, ...remote]) {
    const normalized = normalizeUser(item);
    if (!normalized) continue;
    const key = normalized.username;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, normalized);
      continue;
    }
    const existingTime = Date.parse(existing.updatedAt) || 0;
    const nextTime = Date.parse(normalized.updatedAt) || 0;
    map.set(
      key,
      nextTime >= existingTime
        ? { ...existing, ...normalized, id: existing.id || normalized.id }
        : existing,
    );
  }

  return [...map.values()].sort((a, b) => {
    if (a.role !== b.role) return a.role === 'admin' ? -1 : 1;
    return a.username.localeCompare(b.username);
  });
}
