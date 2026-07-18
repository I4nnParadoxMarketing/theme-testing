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
import type { BalanceSummary, Transaction } from '../types';
import { normalizeReference } from '../utils/fee';

interface TransactionsContextValue {
  transactions: Transaction[];
  ready: boolean;
  summary: BalanceSummary;
  addTransaction: (transaction: Transaction) => Promise<void>;
  updateTransaction: (id: string, patch: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  findByReference: (reference: string, excludeId?: string) => Transaction | undefined;
  setClaimed: (id: string, claimed: boolean) => Promise<void>;
}

const TransactionsContext = createContext<TransactionsContextValue | null>(null);

function computeSummary(transactions: Transaction[]): BalanceSummary {
  return transactions.reduce<BalanceSummary>(
    (acc, item) => {
      if (item.type === 'cash_in') {
        acc.cashIn += item.amount;
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

  useEffect(() => {
    let mounted = true;
    (async () => {
      const stored = await loadTransactions();
      if (mounted) {
        setTransactions(sortTransactions(stored));
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
        (item) =>
          item.id !== excludeId &&
          normalizeReference(item.reference) === key,
      );
    },
    [transactions],
  );

  const addTransaction = useCallback(async (transaction: Transaction) => {
    const current = await loadTransactions();
    const key = normalizeReference(transaction.reference);
    if (key) {
      const duplicate = current.find(
        (item) => normalizeReference(item.reference) === key,
      );
      if (duplicate) {
        throw new Error(
          `Reference ${transaction.reference?.trim()} is already saved. Duplicate not allowed.`,
        );
      }
    }

    const next = sortTransactions([
      transaction,
      ...current.filter((item) => item.id !== transaction.id),
    ]);
    await saveTransactions(next);
    setTransactions(next);
  }, []);

  const updateTransaction = useCallback(async (id: string, patch: Partial<Transaction>) => {
    const current = await loadTransactions();
    if (patch.reference !== undefined) {
      const key = normalizeReference(patch.reference);
      if (key) {
        const duplicate = current.find(
          (item) =>
            item.id !== id && normalizeReference(item.reference) === key,
        );
        if (duplicate) {
          throw new Error(
            `Reference ${String(patch.reference).trim()} is already saved. Duplicate not allowed.`,
          );
        }
      }
    }

    const next = sortTransactions(
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
    await saveTransactions(next);
    setTransactions(next);
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    const current = await loadTransactions();
    const next = current.filter((item) => item.id !== id);
    await saveTransactions(next);
    setTransactions(next);
  }, []);

  const setClaimed = useCallback(async (id: string, claimed: boolean) => {
    const current = await loadTransactions();
    const next = sortTransactions(
      current.map((item) =>
        item.id === id ? { ...item, claimed: item.type === 'cash_out' ? claimed : false } : item,
      ),
    );
    await saveTransactions(next);
    setTransactions(next);
  }, []);

  const clearAll = useCallback(async () => {
    await saveTransactions([]);
    setTransactions([]);
  }, []);

  const value = useMemo<TransactionsContextValue>(
    () => ({
      transactions,
      ready,
      summary: computeSummary(transactions),
      addTransaction,
      updateTransaction,
      deleteTransaction,
      clearAll,
      findByReference,
      setClaimed,
    }),
    [
      transactions,
      ready,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      clearAll,
      findByReference,
      setClaimed,
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
