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
  },
];

const today = buildReport(sample, 'today', now);
assert.equal(today.transactions.length, 1);
assert.equal(today.summary.find((s) => s.label === 'Cash out')?.value.includes('200'), true);

const month = buildReport(sample, 'month', now);
assert.equal(month.transactions.length, 2);

const csv = reportToCsv(today);
assert.match(csv, /Cash Out/);
assert.match(csv, /0042920599051/);
console.log('report tests passed');
