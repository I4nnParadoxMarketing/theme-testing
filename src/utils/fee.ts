/**
 * Cash-out fee schedule:
 * - 99 and below → ₱5
 * - 100–500 → ₱10
 * - 501–1000 → ₱15
 * - above 1000 → ₱15 for every thousand (rounded up)
 */
export function calculateCashOutFee(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  if (amount <= 99) return 5;
  if (amount <= 500) return 10;
  if (amount <= 1000) return 15;
  return 15 * Math.ceil(amount / 1000);
}

export function parseAmountInput(value: string): number {
  return Number(
    String(value)
      .replace(/[₱PhpPHP,\s]/gi, '')
      .trim(),
  );
}

export function normalizeReference(reference?: string | null): string {
  return String(reference ?? '')
    .replace(/\s+/g, '')
    .trim()
    .toUpperCase();
}
