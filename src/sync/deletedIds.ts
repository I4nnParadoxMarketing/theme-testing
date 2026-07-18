import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'gcash_cashflow_deleted_ids_v1';

export async function loadDeletedIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.filter((id) => typeof id === 'string' && id.length > 0))];
  } catch {
    return [];
  }
}

export async function saveDeletedIds(ids: string[]): Promise<string[]> {
  const next = [...new Set(ids.filter((id) => typeof id === 'string' && id.length > 0))];
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export async function addDeletedIds(ids: string[]): Promise<string[]> {
  const current = await loadDeletedIds();
  return saveDeletedIds([...current, ...ids]);
}
