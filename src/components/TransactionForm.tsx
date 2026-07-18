import { useEffect, useRef, useState, type ReactNode } from 'react';
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
import { assertCanMarkCashInCompleted } from '../utils/cashInComplete';
import { calculateCashOutFee, parseAmountInput } from '../utils/fee';
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
  claimed: boolean;
  completed: boolean;
  rawText?: string;
  imageUri?: string;
}

interface Props {
  initial: TransactionDraft;
  /** When true, hide the Cash In / Cash Out type switcher. */
  lockType?: boolean;
  /** Staff cannot mark cash in completed. Admin can when reference is set. */
  canMarkCompleted?: boolean;
  submitLabel: string;
  onSubmit: (draft: TransactionDraft) => void | Promise<void>;
  onCancel: () => void;
  onDelete?: () => void | Promise<void>;
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
    claimed: Boolean(transaction.claimed),
    completed: Boolean(transaction.completed),
    rawText: transaction.rawText,
    imageUri: transaction.imageUri,
  };
}

function withAutoFee(draft: TransactionDraft, force = false): TransactionDraft {
  if (draft.type !== 'cash_out') {
    return draft;
  }
  const amount = parseAmountInput(draft.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return force ? { ...draft, fee: '0' } : draft;
  }
  return { ...draft, fee: String(calculateCashOutFee(amount)) };
}

export function TransactionForm({
  initial,
  lockType = false,
  canMarkCompleted = false,
  submitLabel,
  onSubmit,
  onCancel,
  onDelete,
}: Props) {
  const [draft, setDraft] = useState<TransactionDraft>(() =>
    withAutoFee(
      {
        ...initial,
        claimed: initial.type === 'cash_out' ? Boolean(initial.claimed) : false,
        completed: initial.type === 'cash_in' ? Boolean(initial.completed) : false,
      },
      initial.type === 'cash_out' && (!initial.fee || initial.fee === '0'),
    ),
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const feeManualRef = useRef(false);

  useEffect(() => {
    // When opening a cash-out with no useful fee, apply schedule once.
    if (
      initial.type === 'cash_out' &&
      (!initial.fee || initial.fee === '0') &&
      parseAmountInput(initial.amount) > 0
    ) {
      feeManualRef.current = false;
      setDraft((prev) => withAutoFee(prev, true));
    }
  }, [initial.amount, initial.fee, initial.type]);

  const update = <K extends keyof TransactionDraft>(key: K, value: TransactionDraft[K]) => {
    setDraft((prev) => {
      const next = { ...prev, [key]: value };

      if (key === 'fee') {
        feeManualRef.current = true;
        return next;
      }

      if (key === 'type') {
        if (value === 'cash_in') {
          feeManualRef.current = false;
          return {
            ...next,
            claimed: false,
            completed: Boolean(prev.completed),
            fee: prev.fee,
          };
        }
        feeManualRef.current = false;
        return withAutoFee(
          { ...next, claimed: Boolean(prev.claimed), completed: false },
          true,
        );
      }

      if (key === 'amount' && next.type === 'cash_out' && !feeManualRef.current) {
        return withAutoFee(next, true);
      }

      return next;
    });
  };

  const handleSubmit = async () => {
    const amount = parseAmountInput(draft.amount);
    const fee = parseAmountInput(draft.fee || '0');
    // Staff never changes completed here; ReviewScreen preserves existing value.
    const completed =
      draft.type === 'cash_in' && canMarkCompleted ? Boolean(draft.completed) : false;

    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter a valid amount greater than zero.');
      return;
    }
    if (!Number.isFinite(fee) || fee < 0) {
      setError('Fee must be zero or a positive number.');
      return;
    }

    if (canMarkCompleted) {
      try {
        assertCanMarkCashInCompleted({
          role: 'admin',
          reference: draft.reference,
          completed,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Cannot mark completed.');
        return;
      }
    }

    setError(null);
    setSaving(true);
    try {
      await onSubmit({
        ...draft,
        amount: String(amount),
        fee: String(fee),
        claimed: draft.type === 'cash_out' ? Boolean(draft.claimed) : false,
        completed,
        occurredAt: draft.occurredAt || new Date().toISOString(),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not save transaction.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const suggestedFee =
    draft.type === 'cash_out' ? calculateCashOutFee(parseAmountInput(draft.amount) || 0) : null;

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {draft.imageUri ? (
        <Image source={{ uri: draft.imageUri }} style={styles.preview} resizeMode="cover" />
      ) : null}

      <Text style={styles.heading}>Transaction details</Text>
      <Text style={styles.support}>Confirm what was read from the receipt, then save.</Text>

      {lockType ? (
        <View
          style={[
            styles.typeChip,
            styles.lockedType,
            draft.type === 'cash_in' ? styles.typeIn : styles.typeOut,
          ]}
        >
          <Text style={[styles.typeLabel, styles.typeLabelActive]}>
            {draft.type === 'cash_in' ? 'Cash In' : 'Cash Out'}
          </Text>
        </View>
      ) : (
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
      )}

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
        {draft.type === 'cash_out' ? (
          <View style={styles.feeHelpRow}>
            <Text style={styles.feeHelp}>
              Auto: ≤99→₱5 · 100–500→₱10 · 501–1000→₱15 · each ₱1,000→₱15 + same brackets on excess
            </Text>
            <Pressable
              onPress={() => {
                feeManualRef.current = false;
                setDraft((prev) => withAutoFee(prev, true));
              }}
            >
              <Text style={styles.feeReset}>Use ₱{suggestedFee ?? 0}</Text>
            </Pressable>
          </View>
        ) : null}
      </Field>

      {draft.type === 'cash_out' ? (
        <Pressable
          onPress={() => update('claimed', !draft.claimed)}
          style={[styles.claimedToggle, draft.claimed && styles.claimedToggleOn]}
        >
          <View style={[styles.checkbox, draft.claimed && styles.checkboxOn]}>
            {draft.claimed ? <Text style={styles.checkboxMark}>✓</Text> : null}
          </View>
          <View style={styles.claimedCopy}>
            <Text style={styles.claimedTitle}>
              {draft.claimed ? 'Claimed' : 'Not claimed'}
            </Text>
            <Text style={styles.claimedBody}>
              Mark when this cash out has already been claimed.
            </Text>
          </View>
        </Pressable>
      ) : null}

      <Field label="Reference">
        <TextInput
          value={draft.reference}
          onChangeText={(v) => update('reference', v)}
          placeholder="Ref No."
          placeholderTextColor={colors.inkSoft}
          style={styles.input}
          autoCapitalize="characters"
        />
        {draft.type === 'cash_in' && canMarkCompleted ? (
          <Text style={styles.feeHelp}>Required to mark this cash in as completed.</Text>
        ) : null}
      </Field>

      {draft.type === 'cash_in' ? (
        canMarkCompleted ? (
          <Pressable
            onPress={() => update('completed', !draft.completed)}
            style={[styles.claimedToggle, draft.completed && styles.claimedToggleOn]}
          >
            <View style={[styles.checkbox, draft.completed && styles.checkboxOn]}>
              {draft.completed ? <Text style={styles.checkboxMark}>✓</Text> : null}
            </View>
            <View style={styles.claimedCopy}>
              <Text style={styles.claimedTitle}>
                {draft.completed ? 'Completed' : 'Not completed'}
              </Text>
              <Text style={styles.claimedBody}>
                Admin only. Enter a reference first, then mark completed.
              </Text>
            </View>
          </Pressable>
        ) : (
          <View style={[styles.claimedToggle, draft.completed && styles.claimedToggleOn]}>
            <View style={[styles.checkbox, draft.completed && styles.checkboxOn]}>
              {draft.completed ? <Text style={styles.checkboxMark}>✓</Text> : null}
            </View>
            <View style={styles.claimedCopy}>
              <Text style={styles.claimedTitle}>
                {draft.completed ? 'Completed' : 'Not completed'}
              </Text>
              <Text style={styles.claimedBody}>
                Staff can add cash in only. Admin marks it completed with a reference.
              </Text>
            </View>
          </View>
        )
      ) : null}

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

      <PrimaryButton
        label={submitLabel}
        onPress={handleSubmit}
        style={styles.action}
        loading={saving}
        disabled={saving}
      />
      <PrimaryButton
        label="Cancel"
        onPress={onCancel}
        variant="secondary"
        style={styles.action}
        disabled={saving}
      />
      {onDelete ? (
        <PrimaryButton
          label="Delete"
          onPress={async () => {
            setSaving(true);
            try {
              await onDelete();
            } catch (err) {
              const message = err instanceof Error ? err.message : 'Could not delete transaction.';
              setError(message);
              setSaving(false);
            }
          }}
          variant="danger"
          style={styles.action}
          disabled={saving}
        />
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
  lockedType: {
    marginBottom: spacing.md,
    alignSelf: 'stretch',
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
  feeHelpRow: {
    marginTop: spacing.xs,
    gap: 4,
  },
  feeHelp: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: colors.inkSoft,
    lineHeight: 17,
  },
  feeReset: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 13,
    color: colors.ocean,
    marginTop: 2,
  },
  claimedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.mist,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  claimedToggleOn: {
    backgroundColor: colors.cashInSoft,
    borderColor: 'rgba(15, 138, 95, 0.35)',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.inkSoft,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  checkboxOn: {
    borderColor: colors.cashIn,
    backgroundColor: colors.cashIn,
  },
  checkboxMark: {
    color: colors.white,
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
    lineHeight: 18,
  },
  claimedCopy: {
    flex: 1,
  },
  claimedTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
    color: colors.ink,
  },
  claimedBody: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: 2,
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
