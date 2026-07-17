import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { loadTransactions, saveTransactions } from '../storage';
import type { BalanceSummary, Transaction } from '../types';

interface TransactionsContextValue {
  transactions: Transaction[];
  ready: boolean;
  summary: BalanceSummary;
  addTransaction: (transaction: Transaction) => Promise<void>;
  updateTransaction: (id: string, patch: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

const TransactionsContext = createContext<TransactionsContextValue | null>(null);

function computeSummary(transactions: Transaction[]): BalanceSummary {
  return transactions.reduce<BalanceSummary>(
    (acc, item) => {
      if (item.type === 'cash_in') {
        acc.cashIn += item.amount;
      } else {
        acc.cashOut += item.amount;
      }
      acc.fees += item.fee || 0;
      acc.count += 1;
      acc.net = acc.cashIn - acc.cashOut - acc.fees;
      return acc;
    },
    { cashIn: 0, cashOut: 0, fees: 0, net: 0, count: 0 },
  );
}

export function TransactionsProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const stored = await loadTransactions();
      if (mounted) {
        setTransactions(stored);
        setReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const persist = async (next: Transaction[]) => {
    setTransactions(next);
    await saveTransactions(next);
  };

  const value = useMemo<TransactionsContextValue>(
    () => ({
      transactions,
      ready,
      summary: computeSummary(transactions),
      addTransaction: async (transaction) => {
        const next = [transaction, ...transactions].sort(
          (a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt),
        );
        await persist(next);
      },
      updateTransaction: async (id, patch) => {
        const next = transactions.map((item) =>
          item.id === id ? { ...item, ...patch } : item,
        );
        await persist(next);
      },
      deleteTransaction: async (id) => {
        await persist(transactions.filter((item) => item.id !== id));
      },
      clearAll: async () => {
        await persist([]);
      },
    }),
    [transactions, ready],
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
