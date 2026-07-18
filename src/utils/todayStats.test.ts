import assert from 'node:assert/strict';
import { computeTodayStats } from './todayStats';
import type { Transaction } from '../types';

const sample: Transaction[] = [
  {
    id: '1',
    type: 'cash_in',
    amount: 1000,
    fee: 0,
    occurredAt: '2026-07-18T08:00:00.000Z',
    createdAt: '2026-07-18T08:00:00.000Z',
    source: 'manual',
  },
  {
    id: '2',
    type: 'cash_out',
    amount: 200,
    fee: 10,
    occurredAt: '2026-07-18T09:00:00.000Z',
    createdAt: '2026-07-18T09:00:00.000Z',
    source: 'manual',
    claimed: false,
  },
  {
    id: '3',
    type: 'cash_out',
    amount: 50,
    fee: 5,
    occurredAt: '2026-07-17T09:00:00.000Z',
    createdAt: '2026-07-17T09:00:00.000Z',
    source: 'manual',
    claimed: true,
  },
];

const now = new Date('2026-07-18T12:00:00.000Z');
const stats = computeTodayStats(sample, 5000, now);

assert.equal(stats.cashIn, 1000);
assert.equal(stats.cashOut, 200);
assert.equal(stats.fees, 10);
assert.equal(stats.remaining, 5000 + 1000 - 200);
assert.equal(stats.count, 2);

console.log('todayStats tests passed');
