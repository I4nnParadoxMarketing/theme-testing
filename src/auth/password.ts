/** Lightweight hash for local/cloud storage (not bank-grade crypto). */
export function hashPassword(password: string): string {
  const input = `gcashflow-v1:${password}`;
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `v1:${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

export function verifyPassword(password: string, passwordHash: string): boolean {
  if (!passwordHash) return false;
  return hashPassword(password) === passwordHash;
}
