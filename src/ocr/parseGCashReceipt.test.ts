import assert from 'node:assert/strict';
import { parseGCashReceipt } from './parseGCashReceipt';

const sampleCashIn = `
GCash
Cash In Successful
Amount
PHP 1,500.00
Fee
PHP 15.00
Ref No.
9031 5521 8840
From
Juan Dela Cruz
15 Jul 2026 2:45 PM
`;

const sampleCashOut = `
GCash
Cash Out
You sent
₱850.00
Service Fee: PHP 10.00
Reference No: 771029384455
To: Maria Santos
2026-07-15 14:12:00
`;

const cashIn = parseGCashReceipt(sampleCashIn);
assert.equal(cashIn.type, 'cash_in');
assert.equal(cashIn.amount, 1500);
assert.equal(cashIn.fee, 15);
assert.ok(cashIn.reference?.includes('9031'));
assert.equal(cashIn.confidence, 'high');

const cashOut = parseGCashReceipt(sampleCashOut);
assert.equal(cashOut.type, 'cash_out');
assert.equal(cashOut.amount, 850);
assert.equal(cashOut.fee, 10);
assert.ok(cashOut.reference?.includes('7710'));
assert.equal(cashOut.confidence, 'high');

console.log('parseGCashReceipt tests passed');
