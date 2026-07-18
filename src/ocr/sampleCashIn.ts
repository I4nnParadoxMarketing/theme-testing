import type { ParsedReceipt } from '../types';

/** OCR-style text from a GCash Cash In receipt sample. */
export const SAMPLE_CASH_IN_TEXT = `
GCash
Cash In Successful
Amount
PHP 1,000.00
Fee
PHP 15.00
Ref No.
5521 8840 1203
From
Juan Dela Cruz
18 Jul 2026 3:15 PM
`.trim();

export const SAMPLE_CASH_IN_PARSED: ParsedReceipt = {
  type: 'cash_in',
  amount: 1000,
  fee: 15,
  reference: '5521 8840 1203',
  counterparty: 'Juan Dela Cruz',
  occurredAt: new Date('2026-07-18T15:15:00').toISOString(),
  confidence: 'high',
  rawText: SAMPLE_CASH_IN_TEXT,
};
