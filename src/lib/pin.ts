/** Simple browser-safe PIN hash (not for high-security banking, fine for store PINs). */
export async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(`gaba-hardware:${pin.trim()}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  const next = await hashPin(pin);
  return next === hash;
}
