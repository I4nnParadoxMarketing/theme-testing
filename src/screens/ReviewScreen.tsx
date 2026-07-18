import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import {
  TransactionForm,
  type TransactionDraft,
  draftFromTransaction,
} from '../components/TransactionForm';
import { useAuth } from '../context/AuthContext';
import { useTransactions } from '../context/TransactionsContext';
import type { ScanResult } from './ScanScreen';
import type { Transaction } from '../types';
import { colors } from '../theme';
import {
  assertCanMarkCashInCompleted,
  isReceiptScanSource,
  shouldAutoCompleteCashInFromScan,
} from '../utils/cashInComplete';
import { calculateCashOutFee, normalizeReference, parseAmountInput } from '../utils/fee';
import { createId } from '../utils/id';

interface Props {
  mode: 'create' | 'edit' | 'from-scan';
  scanResult?: ScanResult | null;
  transaction?: Transaction | null;
  lockedType?: Transaction['type'];
  onScan?: () => void;
  onDone: () => void;
  onCancel: () => void;
}

function mergeScanIntoDraft(base: TransactionDraft, scan: ScanResult): TransactionDraft {
  const fromScan = draftFromScan(scan);
  const reference = fromScan.reference || base.reference;
  return {
    ...base,
    type: fromScan.type,
    amount: fromScan.amount || base.amount,
    fee: fromScan.fee || base.fee,
    reference,
    counterparty: fromScan.counterparty || base.counterparty,
    occurredAt: fromScan.occurredAt || base.occurredAt,
    source: fromScan.source,
    rawText: fromScan.rawText ?? base.rawText,
    imageUri: fromScan.imageUri || base.imageUri,
    completed:
      fromScan.type === 'cash_in'
        ? shouldAutoCompleteCashInFromScan({ type: 'cash_in', reference }) ||
          Boolean(base.completed)
        : false,
  };
}

function draftFromScan(scan: ScanResult): TransactionDraft {
  const type = scan.parsed.type ?? 'cash_out';
  const amount = scan.parsed.amount != null ? String(scan.parsed.amount) : '';
  const amountNum = scan.parsed.amount ?? 0;
  const autoFee = type === 'cash_out' ? calculateCashOutFee(amountNum) : scan.parsed.fee ?? 0;
  const reference = scan.parsed.reference ?? '';

  return {
    type,
    amount,
    fee: String(autoFee),
    reference,
    counterparty: scan.parsed.counterparty ?? '',
    note: '',
    occurredAt: scan.parsed.occurredAt ?? new Date().toISOString(),
    source: scan.source,
    claimed: false,
    completed: shouldAutoCompleteCashInFromScan({ type, reference }),
    rawText: scan.parsed.rawText,
    imageUri: scan.imageUri || undefined,
  };
}

function emptyDraft(lockedType?: Transaction['type']): TransactionDraft {
  return {
    type: lockedType ?? 'cash_in',
    amount: '',
    fee: '0',
    reference: '',
    counterparty: '',
    note: '',
    occurredAt: new Date().toISOString(),
    source: 'manual',
    claimed: false,
    completed: false,
  };
}

export function ReviewScreen({
  mode,
  scanResult,
  transaction,
  lockedType,
  onScan,
  onDone,
  onCancel,
}: Props) {
  const { isAdmin, session } = useAuth();
  const { addTransaction, updateTransaction, deleteTransaction, findByReference } =
    useTransactions();

  const initial =
    mode === 'from-scan' && scanResult
      ? {
          ...draftFromScan(scanResult),
          type: lockedType ?? scanResult.parsed.type ?? 'cash_out',
        }
      : mode === 'edit' && transaction
        ? scanResult
          ? {
              ...mergeScanIntoDraft(draftFromTransaction(transaction), scanResult),
              type: lockedType ?? transaction.type,
              claimed: Boolean(transaction.claimed),
            }
          : draftFromTransaction(transaction)
        : mode === 'create' && scanResult
          ? {
              ...draftFromScan(scanResult),
              type: lockedType ?? scanResult.parsed.type ?? 'cash_in',
            }
          : emptyDraft(lockedType);

  const handleSubmit = async (draft: TransactionDraft) => {
    const amount = parseAmountInput(draft.amount);
    const fee = parseAmountInput(draft.fee || '0');
    const occurredAt = draft.occurredAt || new Date().toISOString();
    const reference = draft.reference.trim();
    const fromReceiptScan =
      mode === 'from-scan' ||
      Boolean(scanResult) ||
      isReceiptScanSource(draft.source) ||
      Boolean(draft.rawText && draft.source !== 'manual');

    // Receipt scans auto-complete when a reference was read. Staff can save that
    // completed flag from a scan; otherwise only admin can toggle completed.
    const completed =
      draft.type !== 'cash_in'
        ? false
        : fromReceiptScan &&
            shouldAutoCompleteCashInFromScan({ type: 'cash_in', reference })
          ? true
          : isAdmin
            ? Boolean(draft.completed)
            : mode === 'edit'
              ? Boolean(transaction?.completed)
              : false;

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Enter a valid amount greater than zero.');
    }

    assertCanMarkCashInCompleted({
      role: session?.role,
      reference,
      completed,
      fromReceiptScan,
    });

    if (normalizeReference(reference)) {
      const duplicate = findByReference(
        reference,
        mode === 'edit' && transaction ? transaction.id : undefined,
      );
      if (duplicate) {
        throw new Error(
          `Reference ${reference} is already saved. Duplicate not allowed.`,
        );
      }
    }

    if (mode === 'edit' && transaction) {
      await updateTransaction(transaction.id, {
        type: draft.type,
        amount,
        fee: Number.isFinite(fee) ? fee : 0,
        reference: reference || undefined,
        counterparty: draft.counterparty.trim() || undefined,
        note: draft.note.trim() || undefined,
        occurredAt,
        claimed: draft.type === 'cash_out' ? Boolean(draft.claimed) : false,
        completed,
        rawText: draft.rawText,
        imageUri: draft.imageUri || undefined,
      });
    } else {
      const next: Transaction = {
        id: createId(),
        type: draft.type,
        amount,
        fee: Number.isFinite(fee) ? fee : 0,
        reference: reference || undefined,
        counterparty: draft.counterparty.trim() || undefined,
        note: draft.note.trim() || undefined,
        occurredAt,
        createdAt: new Date().toISOString(),
        source: draft.source || 'manual',
        claimed: draft.type === 'cash_out' ? Boolean(draft.claimed) : false,
        completed,
        rawText: draft.rawText,
        imageUri: draft.imageUri || undefined,
      };
      await addTransaction(next);
    }

    onDone();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <TransactionForm
        initial={initial}
        lockType={Boolean(lockedType)}
        canMarkCompleted={isAdmin}
        onScan={
          // Available to admin and staff when working on a cash-in entry.
          onScan && (lockedType ?? initial.type) === 'cash_in' ? onScan : undefined
        }
        submitLabel={mode === 'edit' ? 'Save changes' : 'Save transaction'}
        onSubmit={handleSubmit}
        onCancel={onCancel}
        onDelete={
          mode === 'edit' && transaction
            ? async () => {
                await deleteTransaction(transaction.id);
                onDone();
              }
            : undefined
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.paper,
  },
});
