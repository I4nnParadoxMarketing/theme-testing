import assert from 'node:assert/strict';
import { buildGreeting, formatGreetingName, getTimeGreeting } from './greeting';

assert.equal(getTimeGreeting(new Date('2026-07-18T08:00:00')), 'Good morning');
assert.equal(getTimeGreeting(new Date('2026-07-18T14:00:00')), 'Good afternoon');
assert.equal(getTimeGreeting(new Date('2026-07-18T20:00:00')), 'Good evening');
assert.equal(formatGreetingName('juan', 'staff'), 'Juan');
assert.equal(formatGreetingName(undefined, 'admin'), 'Admin');
assert.equal(
  buildGreeting('Admin', 'admin', new Date('2026-07-18T09:00:00')),
  'Good morning, Admin',
);

console.log('greeting tests passed');
