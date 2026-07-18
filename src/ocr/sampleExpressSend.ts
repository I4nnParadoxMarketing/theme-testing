import type { ParsedReceipt } from '../types';

/** OCR-style text from a real GCash Express Send receipt sample. */
export const SAMPLE_EXPRESS_SEND_TEXT = `
Express Send
HA•••E U.
+63 999 987 3253
Sent via GCash
Amount
200.00
Total Amount Sent
₱200.00
Ref No. 0042 920 599051
Jul 15, 2026 6:37 PM
`.trim();

export const SAMPLE_EXPRESS_SEND_PARSED: ParsedReceipt = {
  type: 'cash_out',
  amount: 200,
  fee: 0,
  reference: '0042 920 599051',
  counterparty: 'HA•••E U. · +63 999 987 3253',
  occurredAt: new Date('2026-07-15T18:37:00').toISOString(),
  confidence: 'high',
  rawText: SAMPLE_EXPRESS_SEND_TEXT,
};
