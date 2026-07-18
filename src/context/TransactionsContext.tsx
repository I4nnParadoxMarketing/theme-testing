import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { loadSession } from '../auth/sessionStore';
import {
  loadDailyBudget,
  saveDailyBudget,
  todayLocalDate,
  type DailyBudget,
} from '../budget';
import { loadTransactions, saveTransactions } from '../storage';
import { syncRoundTrip } from '../sync/cloudSync';
import { addDeletedIds } from '../sync/deletedIds';
import { loadSyncMeta, saveSyncMeta } from '../sync/syncMeta';
import type { SyncMeta } from '../sync/types';
import type { BalanceSummary, Transaction } from '../types';
import { assertCanMarkCashInCompleted } from '../utils/cashInComplete';
import { normalizeReference } from '../utils/fee';

interface TransactionsContextValue {
  transactions: Transaction[];
  ready: boolean;
  summary: BalanceSummary;
  syncMeta: SyncMeta;
  syncing: boolean;
  startingBudget: number;
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
  saveStartingBudget: (amount: number) => Promise<void>;
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

function touch(transaction: Transaction, patch: Partial<Transaction> = {}): Transaction {
  return {
    ...transaction,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
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
  const [startingBudget, setStartingBudget] = useState(0);

  const applyBudget = useCallback((budget: DailyBudget) => {
    setStartingBudget(budget.startingAmount);
  }, []);

  const persistLocal = useCallback(async (next: Transaction[]) => {
    const sorted = sortTransactions(next);
    setTransactions(sorted);
    await saveTransactions(sorted);
    return sorted;
  }, []);

  const runRoundTrip = useCallback(async (list: Transaction[], meta?: SyncMeta) => {
    const current = meta ?? (await loadSyncMeta());
    if (!current.enabled || !current.syncCode) {
      return { meta: current, transactions: list };
    }
    setSyncing(true);
    try {
      const result = await syncRoundTrip(list, current);
      setSyncMeta(result.meta);
      applyBudget(result.budget);
      const sorted = sortTransactions(result.transactions);
      setTransactions(sorted);
      await saveTransactions(sorted);
      return result;
    } finally {
      setSyncing(false);
    }
  }, [applyBudget]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [stored, meta, budget] = await Promise.all([
        loadTransactions(),
        loadSyncMeta(),
        loadDailyBudget(),
      ]);
      let next = sortTransactions(stored);
      let nextMeta = meta;
      let nextBudget = budget;

      if (meta.enabled && meta.syncCode) {
        try {
          const result = await syncRoundTrip(stored, meta);
          next = sortTransactions(result.transactions);
          nextMeta = result.meta;
          nextBudget = result.budget;
          await saveTransactions(next);
        } catch {
          // Keep local data if cloud is unreachable on boot.
        }
      }

      if (mounted) {
        setTransactions(next);
        setSyncMeta(nextMeta);
        applyBudget(nextBudget);
        setReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [applyBudget]);

  useEffect(() => {
    const onChange = (state: AppStateStatus) => {
      if (state !== 'active') return;
      void (async () => {
        const meta = await loadSyncMeta();
        if (!meta.enabled || !meta.syncCode) return;
        try {
          const local = await loadTransactions();
          await runRoundTrip(local, meta);
        } catch {
          // Ignore background refresh errors.
        }
      })();
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [runRoundTrip]);

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

    const stamped = touch(transaction);
    const next = await persistLocal([
      stamped,
      ...current.filter((item) => item.id !== stamped.id),
    ]);
    await runRoundTrip(next);
  }, [persistLocal, runRoundTrip]);

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
      current.map((item) => (item.id === id ? touch(item, patch) : item)),
    );
    await runRoundTrip(next);
  }, [persistLocal, runRoundTrip]);

  const deleteTransaction = useCallback(async (id: string) => {
    const current = await loadTransactions();
    await addDeletedIds([id]);
    const next = await persistLocal(current.filter((item) => item.id !== id));
    await runRoundTrip(next);
  }, [persistLocal, runRoundTrip]);

  const setClaimed = useCallback(async (id: string, claimed: boolean) => {
    const current = await loadTransactions();
    const next = await persistLocal(
      current.map((item) =>
        item.id === id
          ? touch(item, { claimed: item.type === 'cash_out' ? claimed : false })
          : item,
      ),
    );
    await runRoundTrip(next);
  }, [persistLocal, runRoundTrip]);

  const setCompleted = useCallback(async (id: string, completed: boolean) => {
    const [current, session] = await Promise.all([loadTransactions(), loadSession()]);
    const target = current.find((item) => item.id === id);
    if (!target || target.type !== 'cash_in') return;

    assertCanMarkCashInCompleted({
      role: session?.role,
      reference: target.reference,
      completed,
    });

    const next = await persistLocal(
      current.map((item) =>
        item.id === id ? touch(item, { completed: Boolean(completed) }) : item,
      ),
    );
    await runRoundTrip(next);
  }, [persistLocal, runRoundTrip]);

  const clearAll = useCallback(async () => {
    const current = await loadTransactions();
    await addDeletedIds(current.map((item) => item.id));
    const next = await persistLocal([]);
    await runRoundTrip(next);
  }, [persistLocal, runRoundTrip]);

  const replaceAll = useCallback(async (list: Transaction[]) => {
    const next = await persistLocal(list);
    await runRoundTrip(next);
  }, [persistLocal, runRoundTrip]);

  const refreshFromCloud = useCallback(async () => {
    const meta = await loadSyncMeta();
    const local = await loadTransactions();
    await runRoundTrip(local, meta);
  }, [runRoundTrip]);

  const pushToCloud = useCallback(async () => {
    // Upload still does pull+merge+push so this phone cannot wipe newer cloud edits.
    const meta = await loadSyncMeta();
    const local = await loadTransactions();
    await runRoundTrip(local, meta);
  }, [runRoundTrip]);

  const setSyncMetaState = useCallback(async (meta: SyncMeta) => {
    await saveSyncMeta(meta);
    setSyncMeta(meta);
  }, []);

  const saveStartingBudget = useCallback(async (amount: number) => {
    const budget = await saveDailyBudget({
      date: todayLocalDate(),
      startingAmount: amount,
      updatedAt: new Date().toISOString(),
    });
    applyBudget(budget);
    const meta = await loadSyncMeta();
    if (!meta.enabled || !meta.syncCode) return;
    const local = await loadTransactions();
    await runRoundTrip(local, meta);
  }, [applyBudget, runRoundTrip]);

  const value = useMemo<TransactionsContextValue>(
    () => ({
      transactions,
      ready,
      summary: computeSummary(transactions),
      syncMeta,
      syncing,
      startingBudget,
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
      saveStartingBudget,
    }),
    [
      transactions,
      ready,
      syncMeta,
      syncing,
      startingBudget,
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
      saveStartingBudget,
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
