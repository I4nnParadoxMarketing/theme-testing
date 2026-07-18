import type { Transaction } from '../types';
import { todayLocalDate } from '../budget';

function isSameLocalDay(iso: string, day: string): boolean {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  return todayLocalDate(date) === day;
}

export interface TodayStats {
  date: string;
  cashIn: number;
  cashOut: number;
  fees: number;
  /** startingBudget + cashIn - cashOut */
  remaining: number;
  count: number;
}

export function computeTodayStats(
  transactions: Transaction[],
  startingBudget: number,
  now = new Date(),
): TodayStats {
  const date = todayLocalDate(now);
  let cashIn = 0;
  let cashOut = 0;
  let fees = 0;
  let count = 0;

  for (const tx of transactions) {
    const when = tx.occurredAt || tx.createdAt;
    if (!isSameLocalDay(when, date)) continue;
    count += 1;
    fees += tx.fee || 0;
    if (tx.type === 'cash_in') cashIn += tx.amount;
    else cashOut += tx.amount;
  }

  const start = Number.isFinite(startingBudget) ? startingBudget : 0;
  return {
    date,
    cashIn,
    cashOut,
    fees,
    remaining: start + cashIn - cashOut,
    count,
  };
}
