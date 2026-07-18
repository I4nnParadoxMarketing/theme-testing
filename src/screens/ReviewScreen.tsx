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
import { createId } from '../utils/id';

interface Props {
  mode: 'create' | 'edit' | 'from-scan';
  scanResult?: ScanResult | null;
  transaction?: Transaction | null;
  onDone: () => void;
  onCancel: () => void;
}

function draftFromScan(scan: ScanResult): TransactionDraft {
  return {
    type: scan.parsed.type ?? 'cash_out',
    amount: scan.parsed.amount != null ? String(scan.parsed.amount) : '',
    fee: scan.parsed.fee != null ? String(scan.parsed.fee) : '0',
    reference: scan.parsed.reference ?? '',
    counterparty: scan.parsed.counterparty ?? '',
    note: '',
    occurredAt: scan.parsed.occurredAt ?? new Date().toISOString(),
    source: scan.source,
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
  };
}

export function ReviewScreen({ mode, scanResult, transaction, onDone, onCancel }: Props) {
  const { addTransaction, updateTransaction, deleteTransaction } = useTransactions();

  const initial =
    mode === 'from-scan' && scanResult
      ? draftFromScan(scanResult)
      : mode === 'edit' && transaction
        ? draftFromTransaction(transaction)
        : emptyDraft();

  const handleSubmit = async (draft: TransactionDraft) => {
    const amount = Number(draft.amount);
    const fee = Number(draft.fee || 0);
    const occurredAt = draft.occurredAt || new Date().toISOString();

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Enter a valid amount greater than zero.');
    }

    if (mode === 'edit' && transaction) {
      await updateTransaction(transaction.id, {
        type: draft.type,
        amount,
        fee: Number.isFinite(fee) ? fee : 0,
        reference: draft.reference.trim() || undefined,
        counterparty: draft.counterparty.trim() || undefined,
        note: draft.note.trim() || undefined,
        occurredAt,
        rawText: draft.rawText,
        imageUri: draft.imageUri || undefined,
      });
    } else {
      const next: Transaction = {
        id: createId(),
        type: draft.type,
        amount,
        fee: Number.isFinite(fee) ? fee : 0,
        reference: draft.reference.trim() || undefined,
        counterparty: draft.counterparty.trim() || undefined,
        note: draft.note.trim() || undefined,
        occurredAt,
        createdAt: new Date().toISOString(),
        source: draft.source || 'manual',
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
