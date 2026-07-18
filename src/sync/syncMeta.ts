import AsyncStorage from '@react-native-async-storage/async-storage';
import { SYNC_META_KEY } from './config';
import type { SyncMeta } from './types';

const defaultMeta: SyncMeta = {
  enabled: false,
  provider: 'jsonblob',
  syncCode: '',
};

export async function loadSyncMeta(): Promise<SyncMeta> {
  try {
    const raw = await AsyncStorage.getItem(SYNC_META_KEY);
    if (!raw) return { ...defaultMeta };
    return { ...defaultMeta, ...(JSON.parse(raw) as SyncMeta) };
  } catch {
    return { ...defaultMeta };
  }
}

export async function saveSyncMeta(meta: SyncMeta): Promise<void> {
  await AsyncStorage.setItem(SYNC_META_KEY, JSON.stringify(meta));
}

export function createSyncCode(length = 6): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}
