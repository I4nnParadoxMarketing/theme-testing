import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Transaction } from './types';

const STORAGE_KEY = 'gcash_cashflow_transactions_v1';

function sanitizeForStorage(transactions: Transaction[]): Transaction[] {
  // Avoid blowing AsyncStorage with huge camera data URIs; keep short file/content URIs.
  return transactions.map((item) => {
    const imageUri =
      item.imageUri &&
      item.imageUri.length < 2048 &&
      !item.imageUri.startsWith('data:image/')
        ? item.imageUri
        : undefined;

    return {
      ...item,
      imageUri,
      rawText: item.rawText?.slice(0, 4000),
    };
  });
}

export async function loadTransactions(): Promise<Transaction[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Transaction[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item) =>
          item &&
          typeof item.id === 'string' &&
          (item.type === 'cash_in' || item.type === 'cash_out') &&
          typeof item.amount === 'number',
      )
      .map((item) => ({
        ...item,
        fee: typeof item.fee === 'number' ? item.fee : 0,
        claimed: item.type === 'cash_out' ? Boolean(item.claimed) : false,
        completed: item.type === 'cash_in' ? Boolean(item.completed) : false,
        updatedAt:
          typeof item.updatedAt === 'string' && item.updatedAt
            ? item.updatedAt
            : item.createdAt,
        deletedAt: typeof item.deletedAt === 'string' ? item.deletedAt : undefined,
      }))
      .filter((item) => !item.deletedAt);
  } catch (error) {
    console.warn('Failed to load transactions', error);
    return [];
  }
}

export async function saveTransactions(transactions: Transaction[]): Promise<void> {
  const payload = sanitizeForStorage(transactions);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}
