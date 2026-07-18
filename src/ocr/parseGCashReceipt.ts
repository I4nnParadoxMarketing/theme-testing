import type { ParsedReceipt, TransactionType } from '../types';

function normalizeText(text: string): string {
  return text
    .replace(/\u00a0/g, ' ')
    .replace(/[|]/g, 'I')
    .replace(/\r/g, '\n')
    .trim();
}

function parseMoney(value: string): number | null {
  const cleaned = value
    .replace(/[₱PhpPHP]/gi, '')
    .replace(/,/g, '')
    .replace(/\s+/g, '')
    .trim();
  const match = cleaned.match(/-?\d+(?:\.\d{1,2})?/);
  if (!match) return null;
  const amount = Number(match[0]);
  return Number.isFinite(amount) ? amount : null;
}

function detectType(text: string): TransactionType | null {
  const lower = text.toLowerCase();

  if (
    /\bcash[\s-]?in\b/.test(lower) ||
    /\breceived\b/.test(lower) ||
    /\bmoney received\b/.test(lower) ||
    /\bincoming\b/.test(lower)
  ) {
    return 'cash_in';
  }

  if (
    /\bcash[\s-]?out\b/.test(lower) ||
    /\bexpress\s*send\b/.test(lower) ||
    /\bsent via gcash\b/.test(lower) ||
    /\btotal amount sent\b/.test(lower) ||
    /\bsend money\b/.test(lower) ||
    /\btransfer(?:red)? to\b/.test(lower) ||
    /\bwithdrawal\b/.test(lower) ||
    /\bpaid\b/.test(lower) ||
    /\byou sent\b/.test(lower)
  ) {
    return 'cash_out';
  }

  return null;
}

function extractAmount(text: string): number | null {
  const patterns = [
    /total amount sent[:\s]*[₱PhpPHP\s]*([\d,]+\.\d{2})/i,
    /(?:amount|you sent|you received|transfer amount|cash in|cash out)[:\s]*[₱PhpPHP\s]*([\d,]+\.\d{2})/i,
    /[₱]\s*([\d,]+\.\d{2})/,
    /Php\s*([\d,]+\.\d{2})/i,
    /PHP\s*([\d,]+\.\d{2})/,
    /\b([\d,]+\.\d{2})\b/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const amount = parseMoney(match[1]);
      if (amount !== null && amount > 0) return amount;
    }
  }

  return null;
}

function extractFee(text: string): number | null {
  const patterns = [
    /(?:fee|service fee|convenience fee|charge)[:\s]*[₱PhpPHP\s]*([\d,]+\.\d{2})/i,
    /(?:fee|service fee)[:\s]*[₱PhpPHP\s]*(0)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const fee = parseMoney(match[1]);
      if (fee !== null && fee >= 0) return fee;
    }
  }

  return 0;
}

function extractReference(text: string): string | null {
  const patterns = [
    /Ref\.?\s*No\.?\s*([0-9]{3,}(?:\s+[0-9]{2,})+)/i,
    /(?:ref(?:erence)?(?:\s*no\.?|#)?|transaction\s*(?:id|no\.?))[:\s#-]*([A-Z0-9][A-Z0-9\s-]{6,})/i,
    /\b(\d{4}\s+\d{3}\s+\d{6})\b/,
    /\b(\d{4}\s?\d{4}\s?\d{4})\b/,
    /\b([0-9]{10,})\b/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1].replace(/\s+/g, ' ').trim();
    }
  }

  return null;
}

function extractPhone(text: string): string | null {
  const match = text.match(/(\+63\s?\d{3}\s?\d{3}\s?\d{4}|\b09\d{2}\s?\d{3}\s?\d{4}\b)/);
  return match?.[1]?.replace(/\s+/g, ' ').trim() ?? null;
}

function extractCounterparty(text: string): string | null {
  const phone = extractPhone(text);

  // Masked GCash name like HA•••E U. above the phone number
  const maskedName = text.match(
    /([A-Z]{1,3}[•·*.]{2,}[A-Z0-9 .,'-]{1,20})\s*(?:\n|\r)?\s*(?:\+63|09\d)/i,
  );
  if (maskedName?.[1]) {
    const name = maskedName[1].trim();
    return phone ? `${name} · ${phone}` : name;
  }

  const patterns = [
    /(?:to|from|sent to|received from|recipient|sender)[:\s]+([A-Za-z0-9 .,'•*-]{3,40})/i,
    /(?:name)[:\s]+([A-Za-z .,'•*-]{3,40})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const value = match[1].split('\n')[0].trim();
      if (value && !/php|amount|fee|gcash|sent via/i.test(value)) {
        return phone ? `${value} · ${phone}` : value;
      }
    }
  }

  return phone;
}

function extractDate(text: string): string | null {
  const patterns = [
    /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}(?:\s+\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)?)/i,
    /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}(?:\s+\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)?)/i,
    /(\d{4}[-/]\d{1,2}[-/]\d{1,2}(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?)/,
    /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}(?:\s+\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)?)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match?.[1]) continue;

    const parsed = Date.parse(match[1]);
    if (!Number.isNaN(parsed)) {
      return new Date(parsed).toISOString();
    }
  }

  return null;
}

function scoreConfidence(parsed: Omit<ParsedReceipt, 'confidence' | 'rawText'>): ParsedReceipt['confidence'] {
  let score = 0;
  if (parsed.type) score += 1;
  if (parsed.amount) score += 2;
  if (parsed.reference) score += 1;
  if (parsed.occurredAt) score += 1;

  if (score >= 4) return 'high';
  if (score >= 2) return 'medium';
  return 'low';
}

export function parseGCashReceipt(rawText: string): ParsedReceipt {
  const text = normalizeText(rawText);
  const type = detectType(text);
  const amount = extractAmount(text);
  const fee = extractFee(text);
  const reference = extractReference(text);
  const counterparty = extractCounterparty(text);
  const occurredAt = extractDate(text);

  const base = { type, amount, fee, reference, counterparty, occurredAt };

  return {
    ...base,
    confidence: scoreConfidence(base),
    rawText: text,
  };
}
