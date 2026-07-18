export type TransactionType = 'cash_in' | 'cash_out';

export type TransactionSource = 'manual' | 'camera' | 'upload';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  fee: number;
  reference?: string;
  counterparty?: string;
  note?: string;
  occurredAt: string;
  createdAt: string;
  source: TransactionSource;
  /** Cash-out only: whether the payout has been claimed. */
  claimed?: boolean;
  /** Cash-in only: whether the cash in is completed. */
  completed?: boolean;
  rawText?: string;
  imageUri?: string;
}

export interface ParsedReceipt {
  type: TransactionType | null;
  amount: number | null;
  fee: number | null;
  reference: string | null;
  counterparty: string | null;
  occurredAt: string | null;
  confidence: 'low' | 'medium' | 'high';
  rawText: string;
}

export interface BalanceSummary {
  cashIn: number;
  cashOut: number;
  fees: number;
  net: number;
  count: number;
  claimedCount: number;
  unclaimedCount: number;
  completedCount: number;
  incompleteCount: number;
}
