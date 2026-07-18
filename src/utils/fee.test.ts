import assert from 'node:assert/strict';
import { calculateCashOutFee, normalizeReference } from './fee';

assert.equal(calculateCashOutFee(1), 5);
assert.equal(calculateCashOutFee(99), 5);
assert.equal(calculateCashOutFee(100), 10);
assert.equal(calculateCashOutFee(200), 10);
assert.equal(calculateCashOutFee(500), 10);
assert.equal(calculateCashOutFee(501), 15);
assert.equal(calculateCashOutFee(1000), 15);
assert.equal(calculateCashOutFee(1001), 20); // 15 + 5
assert.equal(calculateCashOutFee(1050), 20); // 15 + 5
assert.equal(calculateCashOutFee(1200), 25); // 15 + 10
assert.equal(calculateCashOutFee(1500), 25); // 15 + 10
assert.equal(calculateCashOutFee(1600), 30); // 15 + 15
assert.equal(calculateCashOutFee(2000), 30); // 15 + 15
assert.equal(calculateCashOutFee(2500), 40); // 30 + 10
assert.equal(calculateCashOutFee(2501), 45); // 30 + 15
assert.equal(calculateCashOutFee(0), 0);

assert.equal(normalizeReference('0042 920 599051'), '0042920599051');
assert.equal(normalizeReference('  ab c '), 'ABC');

console.log('fee tests passed');
