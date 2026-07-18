import assert from 'node:assert/strict';
import {
  assertCanMarkCashInCompleted,
  shouldAutoCompleteCashInFromScan,
} from './cashInComplete';

assert.equal(
  shouldAutoCompleteCashInFromScan({ type: 'cash_in', reference: '0042920599051' }),
  true,
);
assert.equal(shouldAutoCompleteCashInFromScan({ type: 'cash_in', reference: '' }), false);
assert.equal(
  shouldAutoCompleteCashInFromScan({ type: 'cash_out', reference: '0042920599051' }),
  false,
);

assert.doesNotThrow(() =>
  assertCanMarkCashInCompleted({ role: 'staff', reference: '', completed: false }),
);

assert.throws(
  () => assertCanMarkCashInCompleted({ role: 'staff', reference: 'ABC', completed: true }),
  /Only admin/,
);

assert.doesNotThrow(() =>
  assertCanMarkCashInCompleted({
    role: 'staff',
    reference: '0042920599051',
    completed: true,
    fromReceiptScan: true,
  }),
);

assert.throws(
  () => assertCanMarkCashInCompleted({ role: 'admin', reference: '', completed: true }),
  /Reference is required/,
);

assert.doesNotThrow(() =>
  assertCanMarkCashInCompleted({ role: 'admin', reference: '0042920599051', completed: true }),
);

console.log('cashInComplete tests passed');
