import assert from 'node:assert/strict';
import { mergeDailyBudget } from './budget';

const today = '2026-07-18';
const now = new Date('2026-07-18T15:00:00.000Z');

const winner = mergeDailyBudget(
  { date: today, startingAmount: 5000, updatedAt: '2026-07-18T10:00:00.000Z' },
  { date: today, startingAmount: 8000, updatedAt: '2026-07-18T12:00:00.000Z' },
  now,
);
assert.equal(winner.startingAmount, 8000);

const ignoreYesterday = mergeDailyBudget(
  { date: '2026-07-17', startingAmount: 9999, updatedAt: '2026-07-17T12:00:00.000Z' },
  { date: today, startingAmount: 1000, updatedAt: '2026-07-18T09:00:00.000Z' },
  now,
);
assert.equal(ignoreYesterday.startingAmount, 1000);

const empty = mergeDailyBudget(null, null, now);
assert.equal(empty.date, today);
assert.equal(empty.startingAmount, 0);

console.log('budget tests passed');
