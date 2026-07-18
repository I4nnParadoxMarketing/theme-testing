import assert from 'node:assert/strict';
import { assertCanMarkCashInCompleted } from './cashInComplete';

assert.doesNotThrow(() =>
  assertCanMarkCashInCompleted({ role: 'staff', reference: '', completed: false }),
);

assert.throws(
  () => assertCanMarkCashInCompleted({ role: 'staff', reference: 'ABC', completed: true }),
  /Only admin/,
);

assert.throws(
  () => assertCanMarkCashInCompleted({ role: 'admin', reference: '', completed: true }),
  /Reference is required/,
);

assert.doesNotThrow(() =>
  assertCanMarkCashInCompleted({ role: 'admin', reference: '0042920599051', completed: true }),
);

console.log('cashInComplete tests passed');
