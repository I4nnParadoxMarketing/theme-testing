import assert from 'node:assert/strict';
import { buildReport, reportToCsv } from './buildReport';
import type { Transaction } from '../types';

const now = new Date('2026-07-18T12:00:00.000Z');
const sample: Transaction[] = [
  {
    id: '1',
    type: 'cash_out',
    amount: 200,
    fee: 10,
    reference: '0042920599051',
    occurredAt: '2026-07-18T10:00:00.000Z',
    createdAt: '2026-07-18T10:00:00.000Z',
    source: 'upload',
    claimed: false,
  },
  {
    id: '2',
    type: 'cash_in',
    amount: 500,
    fee: 0,
    occurredAt: '2026-07-01T10:00:00.000Z',
    createdAt: '2026-07-01T10:00:00.000Z',
    source: 'manual',
    completed: false,
  },
  {
    id: '3',
    type: 'cash_in',
    amount: 1000,
    fee: 0,
    occurredAt: '2026-07-10T08:00:00.000Z',
    createdAt: '2026-07-10T08:00:00.000Z',
    source: 'manual',
    completed: true,
  },
];

const today = buildReport(sample, 'today', now);
assert.equal(today.transactions.length, 1);
assert.equal(today.summary.find((s) => s.label === 'Cash out')?.value.includes('200'), true);

const month = buildReport(sample, 'month', now);
assert.equal(month.transactions.length, 3);

const custom = buildReport(sample, 'custom', now, { from: '2026-07-01', to: '2026-07-10' });
assert.equal(custom.transactions.length, 2);
assert.equal(custom.title, 'Custom range');

const incomplete = buildReport(sample, 'incomplete', now);
assert.equal(incomplete.transactions.length, 1);
assert.equal(incomplete.transactions[0]?.id, '2');
assert.equal(incomplete.summary.find((s) => s.label === 'Incomplete ins')?.value, '1');

const csv = reportToCsv(today);
assert.match(csv, /Cash Out/);
assert.match(csv, /0042920599051/);
assert.match(csv, /Completed/);
console.log('report tests passed');
