import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import {
  TransactionForm,
  type TransactionDraft,
  draftFromTransaction,
} from '../components/TransactionForm';
import { useTransactions } from '../context/TransactionsContext';
import type { ScanResult } from './ScanScreen';
import type { Transaction } from '../types';
import { colors } from '../theme';
import { calculateCashOutFee, normalizeReference, parseAmountInput } from '../utils/fee';
import { createId } from '../utils/id';

interface Props {
  mode: 'create' | 'edit' | 'from-scan';
  scanResult?: ScanResult | null;
  transaction?: Transaction | null;
  onDone: () => void;
  onCancel: () => void;
}

function draftFromScan(scan: ScanResult): TransactionDraft {
  const type = scan.parsed.type ?? 'cash_out';
  const amount = scan.parsed.amount != null ? String(scan.parsed.amount) : '';
  const amountNum = scan.parsed.amount ?? 0;
  const autoFee = type === 'cash_out' ? calculateCashOutFee(amountNum) : scan.parsed.fee ?? 0;

  return {
    type,
    amount,
    fee: String(autoFee),
    reference: scan.parsed.reference ?? '',
    counterparty: scan.parsed.counterparty ?? '',
    note: '',
    occurredAt: scan.parsed.occurredAt ?? new Date().toISOString(),
    source: scan.source,
    claimed: false,
    completed: false,
    rawText: scan.parsed.rawText,
    imageUri: scan.imageUri || undefined,
  };
}

function emptyDraft(): TransactionDraft {
  return {
    type: 'cash_in',
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

export function ReviewScreen({ mode, scanResult, transaction, onDone, onCancel }: Props) {
  const { addTransaction, updateTransaction, deleteTransaction, findByReference } =
    useTransactions();

  const initial =
    mode === 'from-scan' && scanResult
      ? draftFromScan(scanResult)
      : mode === 'edit' && transaction
        ? draftFromTransaction(transaction)
        : emptyDraft();

  const handleSubmit = async (draft: TransactionDraft) => {
    const amount = parseAmountInput(draft.amount);
    const fee = parseAmountInput(draft.fee || '0');
    const occurredAt = draft.occurredAt || new Date().toISOString();
    const reference = draft.reference.trim();

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Enter a valid amount greater than zero.');
    }

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
        completed: draft.type === 'cash_in' ? Boolean(draft.completed) : false,
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
        completed: draft.type === 'cash_in' ? Boolean(draft.completed) : false,
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
