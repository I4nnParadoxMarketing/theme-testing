import type { Transaction } from '../types';
import { normalizeReference } from '../utils/fee';

function txTime(item: Transaction): number {
  return Date.parse(item.updatedAt || item.createdAt || item.occurredAt) || 0;
}

function olderCreatedAt(a: Transaction, b: Transaction): string {
  const aTime = Date.parse(a.createdAt || a.occurredAt) || 0;
  const bTime = Date.parse(b.createdAt || b.occurredAt) || 0;
  return aTime <= bTime ? a.createdAt : b.createdAt;
}

function pickNewer(a: Transaction, b: Transaction): Transaction {
  return txTime(a) >= txTime(b) ? a : b;
}

export function mergeTransactions(
  local: Transaction[],
  remote: Transaction[],
  deletedIds: string[] = [],
): { transactions: Transaction[]; deletedIds: string[] } {
  const deleted = new Set(deletedIds);

  for (const item of [...local, ...remote]) {
    if (item.deletedAt) deleted.add(item.id);
  }

  const map = new Map<string, Transaction>();
  for (const item of [...remote, ...local]) {
    if (!item?.id || deleted.has(item.id) || item.deletedAt) continue;

    const existing = map.get(item.id);
    if (!existing) {
      map.set(item.id, item);
      continue;
    }

    const winner = pickNewer(existing, item);
    map.set(item.id, {
      ...existing,
      ...item,
      ...winner,
      claimed: winner.type === 'cash_out' ? Boolean(winner.claimed) : false,
      completed: winner.type === 'cash_in' ? Boolean(winner.completed) : false,
      createdAt: olderCreatedAt(existing, item),
      updatedAt: winner.updatedAt || winner.createdAt,
      deletedAt: undefined,
    });
  }

  const byRef = new Map<string, Transaction>();
  const noRef: Transaction[] = [];

  for (const item of map.values()) {
    const ref = normalizeReference(item.reference);
    if (!ref) {
      noRef.push(item);
      continue;
    }
    const prev = byRef.get(ref);
    if (!prev) {
      byRef.set(ref, item);
      continue;
    }
    // Same Ref No. on different ids — keep the newer edit, drop the older id.
    const winner = pickNewer(prev, item);
    const loser = winner === prev ? item : prev;
    deleted.add(loser.id);
    byRef.set(ref, {
      ...winner,
      createdAt: olderCreatedAt(prev, item),
      updatedAt: winner.updatedAt || winner.createdAt,
    });
  }

  const transactions = [...byRef.values(), ...noRef]
    .filter((item) => !deleted.has(item.id))
    .sort((a, b) => {
      const aTime = Date.parse(a.occurredAt || a.createdAt) || 0;
      const bTime = Date.parse(b.occurredAt || b.createdAt) || 0;
      return bTime - aTime;
    });

  return { transactions, deletedIds: [...deleted] };
}
