/**
 * Cash-out fee schedule:
 * - 99 and below → ₱5
 * - 100–500 → ₱10
 * - 501–1000 → ₱15
 * - For every full ₱1,000 → ₱15, then apply the brackets above to any excess
 *
 * Examples:
 * - ₱200 → ₱10
 * - ₱1,000 → ₱15
 * - ₱1,050 → ₱15 + ₱5 = ₱20
 * - ₱1,200 → ₱15 + ₱10 = ₱25
 * - ₱1,600 → ₱15 + ₱15 = ₱30
 * - ₱2,500 → ₱30 + ₱10 = ₱40
 */
function feeForBracket(amount: number): number {
  if (amount <= 0) return 0;
  if (amount <= 99) return 5;
  if (amount <= 500) return 10;
  return 15; // 501–1000
}

export function calculateCashOutFee(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;

  const thousands = Math.floor(amount / 1000);
  const excess = amount % 1000;

  return thousands * 15 + feeForBracket(excess);
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
