import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthSession } from './types';

const SESSION_KEY = 'gcash_cashflow_session_v1';

export async function loadSession(): Promise<AuthSession | null> {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.userId || !parsed?.username || (parsed.role !== 'admin' && parsed.role !== 'staff')) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function saveSession(session: AuthSession): Promise<void> {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_KEY);
}
