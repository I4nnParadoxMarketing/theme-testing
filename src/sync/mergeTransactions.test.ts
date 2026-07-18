import assert from 'node:assert/strict';
import type { Transaction } from '../types';
import { mergeTransactions } from './mergeTransactions';

function tx(partial: Partial<Transaction> & Pick<Transaction, 'id'>): Transaction {
  return {
    type: 'cash_in',
    amount: 100,
    fee: 0,
    occurredAt: '2026-07-18T10:00:00.000Z',
    createdAt: '2026-07-18T10:00:00.000Z',
    source: 'manual',
    ...partial,
  };
}

const localNewer = tx({
  id: 'a',
  amount: 200,
  updatedAt: '2026-07-18T12:00:00.000Z',
  note: 'local',
});
const remoteOlder = tx({
  id: 'a',
  amount: 100,
  updatedAt: '2026-07-18T11:00:00.000Z',
  note: 'remote',
});

const merged = mergeTransactions([localNewer], [remoteOlder]);
assert.equal(merged.transactions.length, 1);
assert.equal(merged.transactions[0]?.amount, 200);
assert.equal(merged.transactions[0]?.note, 'local');

const unclaimLocal = tx({
  id: 'b',
  type: 'cash_out',
  claimed: false,
  updatedAt: '2026-07-18T13:00:00.000Z',
});
const claimRemote = tx({
  id: 'b',
  type: 'cash_out',
  claimed: true,
  updatedAt: '2026-07-18T12:00:00.000Z',
});
const flags = mergeTransactions([unclaimLocal], [claimRemote]);
assert.equal(flags.transactions[0]?.claimed, false);

const deletedRemote = mergeTransactions(
  [tx({ id: 'c', amount: 50 })],
  [],
  ['c'],
);
assert.equal(deletedRemote.transactions.length, 0);
assert.ok(deletedRemote.deletedIds.includes('c'));

const sameRef = mergeTransactions(
  [
    tx({
      id: 'd1',
      reference: '111',
      amount: 10,
      updatedAt: '2026-07-18T10:00:00.000Z',
    }),
  ],
  [
    tx({
      id: 'd2',
      reference: '111',
      amount: 20,
      updatedAt: '2026-07-18T11:00:00.000Z',
    }),
  ],
);
assert.equal(sameRef.transactions.length, 1);
assert.equal(sameRef.transactions[0]?.amount, 20);
assert.ok(sameRef.deletedIds.includes('d1'));

console.log('mergeTransactions tests passed');
