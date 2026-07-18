import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { loadTransactions, saveTransactions } from '../storage';
import { mergeTransactions, pullTransactions, pushTransactions } from '../sync/cloudSync';
import { loadSyncMeta, saveSyncMeta } from '../sync/syncMeta';
import type { SyncMeta } from '../sync/types';
import type { BalanceSummary, Transaction } from '../types';
import { normalizeReference } from '../utils/fee';

interface TransactionsContextValue {
  transactions: Transaction[];
  ready: boolean;
  summary: BalanceSummary;
  syncMeta: SyncMeta;
  syncing: boolean;
  addTransaction: (transaction: Transaction) => Promise<void>;
  updateTransaction: (id: string, patch: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  findByReference: (reference: string, excludeId?: string) => Transaction | undefined;
  setClaimed: (id: string, claimed: boolean) => Promise<void>;
  setCompleted: (id: string, completed: boolean) => Promise<void>;
  replaceAll: (transactions: Transaction[]) => Promise<void>;
  refreshFromCloud: () => Promise<void>;
  pushToCloud: () => Promise<void>;
  setSyncMetaState: (meta: SyncMeta) => Promise<void>;
}

const TransactionsContext = createContext<TransactionsContextValue | null>(null);

function computeSummary(transactions: Transaction[]): BalanceSummary {
  return transactions.reduce<BalanceSummary>(
    (acc, item) => {
      if (item.type === 'cash_in') {
        acc.cashIn += item.amount;
        if (item.completed) acc.completedCount += 1;
        else acc.incompleteCount += 1;
      } else {
        acc.cashOut += item.amount;
        if (item.claimed) acc.claimedCount += 1;
        else acc.unclaimedCount += 1;
      }
      acc.fees += item.fee || 0;
      acc.count += 1;
      acc.net = acc.cashIn - acc.cashOut - acc.fees;
      return acc;
    },
    {
      cashIn: 0,
      cashOut: 0,
      fees: 0,
      net: 0,
      count: 0,
      claimedCount: 0,
      unclaimedCount: 0,
      completedCount: 0,
      incompleteCount: 0,
    },
  );
}

function sortTransactions(list: Transaction[]): Transaction[] {
  return [...list].sort((a, b) => {
    const aTime = Date.parse(a.occurredAt || a.createdAt) || 0;
    const bTime = Date.parse(b.occurredAt || b.createdAt) || 0;
    return bTime - aTime;
  });
}

export function TransactionsProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [ready, setReady] = useState(false);
  const [syncMeta, setSyncMeta] = useState<SyncMeta>({
    enabled: false,
    provider: 'jsonblob',
    syncCode: '',
  });
  const [syncing, setSyncing] = useState(false);

  const persistLocal = useCallback(async (next: Transaction[]) => {
    const sorted = sortTransactions(next);
    setTransactions(sorted);
    await saveTransactions(sorted);
    return sorted;
  }, []);

  const syncPush = useCallback(async (list: Transaction[], meta = syncMeta) => {
    if (!meta.enabled || !meta.syncCode) return meta;
    setSyncing(true);
    try {
      return await pushTransactions(list, meta);
    } finally {
      setSyncing(false);
    }
  }, [syncMeta]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [stored, meta] = await Promise.all([loadTransactions(), loadSyncMeta()]);
      let next = sortTransactions(stored);
      let nextMeta = meta;

      if (meta.enabled && meta.syncCode) {
        try {
          const pulled = await pullTransactions(meta);
          nextMeta = pulled.meta;
          if (pulled.transactions) {
            next = sortTransactions(mergeTransactions(stored, pulled.transactions));
            await saveTransactions(next);
            await pushTransactions(next, nextMeta);
          }
        } catch {
          // Keep local data if cloud is unreachable on boot.
        }
      }

      if (mounted) {
        setTransactions(next);
        setSyncMeta(nextMeta);
        setReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const findByReference = useCallback(
    (reference: string, excludeId?: string) => {
      const key = normalizeReference(reference);
      if (!key) return undefined;
      return transactions.find(
        (item) => item.id !== excludeId && normalizeReference(item.reference) === key,
      );
    },
    [transactions],
  );

  const addTransaction = useCallback(async (transaction: Transaction) => {
    const current = await loadTransactions();
    const key = normalizeReference(transaction.reference);
    if (key) {
      const duplicate = current.find((item) => normalizeReference(item.reference) === key);
      if (duplicate) {
        throw new Error(
          `Reference ${transaction.reference?.trim()} is already saved. Duplicate not allowed.`,
        );
      }
    }

    const next = await persistLocal([
      transaction,
      ...current.filter((item) => item.id !== transaction.id),
    ]);
    const meta = await syncPush(next);
    if (meta) setSyncMeta(meta);
  }, [persistLocal, syncPush]);

  const updateTransaction = useCallback(async (id: string, patch: Partial<Transaction>) => {
    const current = await loadTransactions();
    if (patch.reference !== undefined) {
      const key = normalizeReference(patch.reference);
      if (key) {
        const duplicate = current.find(
          (item) => item.id !== id && normalizeReference(item.reference) === key,
        );
        if (duplicate) {
          throw new Error(
            `Reference ${String(patch.reference).trim()} is already saved. Duplicate not allowed.`,
          );
        }
      }
    }

    const next = await persistLocal(
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
    const meta = await syncPush(next);
    if (meta) setSyncMeta(meta);
  }, [persistLocal, syncPush]);

  const deleteTransaction = useCallback(async (id: string) => {
    const current = await loadTransactions();
    const next = await persistLocal(current.filter((item) => item.id !== id));
    const meta = await syncPush(next);
    if (meta) setSyncMeta(meta);
  }, [persistLocal, syncPush]);

  const setClaimed = useCallback(async (id: string, claimed: boolean) => {
    const current = await loadTransactions();
    const next = await persistLocal(
      current.map((item) =>
        item.id === id ? { ...item, claimed: item.type === 'cash_out' ? claimed : false } : item,
      ),
    );
    const meta = await syncPush(next);
    if (meta) setSyncMeta(meta);
  }, [persistLocal, syncPush]);

  const setCompleted = useCallback(async (id: string, completed: boolean) => {
    const current = await loadTransactions();
    const next = await persistLocal(
      current.map((item) =>
        item.id === id
          ? { ...item, completed: item.type === 'cash_in' ? completed : false }
          : item,
      ),
    );
    const meta = await syncPush(next);
    if (meta) setSyncMeta(meta);
  }, [persistLocal, syncPush]);

  const clearAll = useCallback(async () => {
    const next = await persistLocal([]);
    const meta = await syncPush(next);
    if (meta) setSyncMeta(meta);
  }, [persistLocal, syncPush]);

  const replaceAll = useCallback(async (list: Transaction[]) => {
    const next = await persistLocal(list);
    const meta = await syncPush(next);
    if (meta) setSyncMeta(meta);
  }, [persistLocal, syncPush]);

  const refreshFromCloud = useCallback(async () => {
    setSyncing(true);
    try {
      const meta = await loadSyncMeta();
      const pulled = await pullTransactions(meta);
      setSyncMeta(pulled.meta);
      if (pulled.transactions) {
        const local = await loadTransactions();
        const merged = sortTransactions(mergeTransactions(local, pulled.transactions));
        await saveTransactions(merged);
        setTransactions(merged);
        const pushed = await pushTransactions(merged, pulled.meta);
        setSyncMeta(pushed);
      }
    } finally {
      setSyncing(false);
    }
  }, []);

  const pushToCloud = useCallback(async () => {
    setSyncing(true);
    try {
      const meta = await loadSyncMeta();
      const local = await loadTransactions();
      const pushed = await pushTransactions(local, meta);
      setSyncMeta(pushed);
    } finally {
      setSyncing(false);
    }
  }, []);

  const setSyncMetaState = useCallback(async (meta: SyncMeta) => {
    await saveSyncMeta(meta);
    setSyncMeta(meta);
  }, []);

  const value = useMemo<TransactionsContextValue>(
    () => ({
      transactions,
      ready,
      summary: computeSummary(transactions),
      syncMeta,
      syncing,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      clearAll,
      findByReference,
      setClaimed,
      setCompleted,
      replaceAll,
      refreshFromCloud,
      pushToCloud,
      setSyncMetaState,
    }),
    [
      transactions,
      ready,
      syncMeta,
      syncing,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      clearAll,
      findByReference,
      setClaimed,
      setCompleted,
      replaceAll,
      refreshFromCloud,
      pushToCloud,
      setSyncMetaState,
    ],
  );

  return (
    <TransactionsContext.Provider value={value}>{children}</TransactionsContext.Provider>
  );
}

export function useTransactions() {
  const ctx = useContext(TransactionsContext);
  if (!ctx) {
    throw new Error('useTransactions must be used within TransactionsProvider');
  }
  return ctx;
}
