import { useState, type ReactNode } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, radii, spacing } from '../theme';
import type { Transaction, TransactionSource, TransactionType } from '../types';
import { PrimaryButton } from './PrimaryButton';

export interface TransactionDraft {
  type: TransactionType;
  amount: string;
  fee: string;
  reference: string;
  counterparty: string;
  note: string;
  occurredAt: string;
  source: TransactionSource;
  rawText?: string;
  imageUri?: string;
}

interface Props {
  initial: TransactionDraft;
  submitLabel: string;
  onSubmit: (draft: TransactionDraft) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

function toLocalInputValue(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function draftFromTransaction(transaction: Transaction): TransactionDraft {
  return {
    type: transaction.type,
    amount: String(transaction.amount),
    fee: String(transaction.fee ?? 0),
    reference: transaction.reference ?? '',
    counterparty: transaction.counterparty ?? '',
    note: transaction.note ?? '',
    occurredAt: transaction.occurredAt,
    source: transaction.source,
    rawText: transaction.rawText,
    imageUri: transaction.imageUri,
  };
}

export function TransactionForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  onDelete,
}: Props) {
  const [draft, setDraft] = useState<TransactionDraft>(initial);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof TransactionDraft>(key: K, value: TransactionDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    const amount = Number(draft.amount.replace(/,/g, ''));
    const fee = Number(draft.fee.replace(/,/g, '') || '0');

    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter a valid amount greater than zero.');
      return;
    }
    if (!Number.isFinite(fee) || fee < 0) {
      setError('Fee must be zero or a positive number.');
      return;
    }

    setError(null);
    onSubmit({
      ...draft,
      amount: String(amount),
      fee: String(fee),
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {draft.imageUri ? (
        <Image source={{ uri: draft.imageUri }} style={styles.preview} resizeMode="cover" />
      ) : null}

      <Text style={styles.heading}>Transaction details</Text>
      <Text style={styles.support}>Confirm what was read from the receipt, then save.</Text>

      <View style={styles.typeRow}>
        {(['cash_in', 'cash_out'] as TransactionType[]).map((type) => {
          const active = draft.type === type;
          return (
            <Pressable
              key={type}
              onPress={() => update('type', type)}
              style={[
                styles.typeChip,
                active && (type === 'cash_in' ? styles.typeIn : styles.typeOut),
              ]}
            >
              <Text style={[styles.typeLabel, active && styles.typeLabelActive]}>
                {type === 'cash_in' ? 'Cash In' : 'Cash Out'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Field label="Amount (₱)">
        <TextInput
          value={draft.amount}
          onChangeText={(v) => update('amount', v)}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor={colors.inkSoft}
          style={styles.input}
        />
      </Field>

      <Field label="Fee (₱)">
        <TextInput
          value={draft.fee}
          onChangeText={(v) => update('fee', v)}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor={colors.inkSoft}
          style={styles.input}
        />
      </Field>

      <Field label="Reference">
        <TextInput
          value={draft.reference}
          onChangeText={(v) => update('reference', v)}
          placeholder="Ref No."
          placeholderTextColor={colors.inkSoft}
          style={styles.input}
        />
      </Field>

      <Field label="From / To">
        <TextInput
          value={draft.counterparty}
          onChangeText={(v) => update('counterparty', v)}
          placeholder="Name or number"
          placeholderTextColor={colors.inkSoft}
          style={styles.input}
        />
      </Field>

      <Field label="When">
        <TextInput
          value={toLocalInputValue(draft.occurredAt)}
          onChangeText={(v) => {
            const parsed = Date.parse(v);
            update('occurredAt', Number.isNaN(parsed) ? draft.occurredAt : new Date(parsed).toISOString());
          }}
          placeholder="YYYY-MM-DDTHH:mm"
          placeholderTextColor={colors.inkSoft}
          style={styles.input}
          autoCapitalize="none"
        />
      </Field>

      <Field label="Note">
        <TextInput
          value={draft.note}
          onChangeText={(v) => update('note', v)}
          placeholder="Optional note"
          placeholderTextColor={colors.inkSoft}
          style={[styles.input, styles.multiline]}
          multiline
        />
      </Field>

      {draft.rawText ? (
        <View style={styles.rawBox}>
          <Text style={styles.rawLabel}>OCR text</Text>
          <Text style={styles.rawText}>{draft.rawText}</Text>
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <PrimaryButton label={submitLabel} onPress={handleSubmit} style={styles.action} />
      <PrimaryButton label="Cancel" onPress={onCancel} variant="secondary" style={styles.action} />
      {onDelete ? (
        <PrimaryButton label="Delete" onPress={onDelete} variant="danger" style={styles.action} />
      ) : null}
    </ScrollView>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  preview: {
    width: '100%',
    height: 180,
    borderRadius: radii.md,
    marginBottom: spacing.lg,
    backgroundColor: colors.mist,
  },
  heading: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 28,
    color: colors.ink,
  },
  support: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: colors.inkSoft,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  typeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  typeChip: {
    flex: 1,
    minHeight: 48,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.mist,
  },
  typeIn: {
    backgroundColor: colors.cashIn,
  },
  typeOut: {
    backgroundColor: colors.cashOut,
  },
  typeLabel: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
    color: colors.ink,
  },
  typeLabelActive: {
    color: colors.white,
  },
  field: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: colors.inkSoft,
    marginBottom: spacing.xs,
  },
  input: {
    minHeight: 48,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
    color: colors.ink,
  },
  multiline: {
    minHeight: 88,
    paddingTop: spacing.sm,
    textAlignVertical: 'top',
  },
  rawBox: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radii.sm,
    backgroundColor: colors.mist,
  },
  rawLabel: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 12,
    color: colors.inkSoft,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  rawText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    lineHeight: 20,
    color: colors.ink,
  },
  error: {
    fontFamily: 'DMSans_500Medium',
    color: colors.cashOut,
    marginBottom: spacing.sm,
  },
  action: {
    marginTop: spacing.sm,
  },
});
