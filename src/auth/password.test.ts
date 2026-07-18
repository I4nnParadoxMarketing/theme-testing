import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from './password';
import { createDefaultUsers, mergeUsers } from './userStore';

const hash = hashPassword('1234');
assert.equal(verifyPassword('1234', hash), true);
assert.equal(verifyPassword('9999', hash), false);

const defaults = createDefaultUsers('2026-07-18T00:00:00.000Z');
assert.equal(defaults.length, 2);
assert.equal(defaults[0]?.username, 'admin');
assert.equal(defaults[1]?.username, 'staff');
assert.equal(verifyPassword('1234', defaults[0]!.passwordHash), true);

const remoteStaff = {
  ...defaults[1]!,
  passwordHash: hashPassword('5678'),
  updatedAt: '2026-07-18T12:00:00.000Z',
};
const merged = mergeUsers(defaults, [remoteStaff]);
const staff = merged.find((u) => u.username === 'staff');
assert.equal(verifyPassword('5678', staff!.passwordHash), true);

console.log('auth tests passed');
