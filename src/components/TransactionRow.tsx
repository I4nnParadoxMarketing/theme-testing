import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../theme';
import type { Transaction } from '../types';
import { formatDateTime, formatPeso, formatType } from '../utils/format';

interface Props {
  transaction: Transaction;
  onPress: (transaction: Transaction) => void;
  onToggleClaimed?: (transaction: Transaction) => void;
}

export function TransactionRow({ transaction, onPress, onToggleClaimed }: Props) {
  const isIn = transaction.type === 'cash_in';
  const isClaimed = Boolean(transaction.claimed);

  return (
    <Pressable
      onPress={() => onPress(transaction)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={[styles.badge, isIn ? styles.badgeIn : styles.badgeOut]}>
        <Text style={[styles.badgeText, isIn ? styles.textIn : styles.textOut]}>
          {isIn ? 'IN' : 'OUT'}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{formatType(transaction.type)}</Text>
          {!isIn ? (
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                onToggleClaimed?.(transaction);
              }}
              hitSlop={8}
              style={[styles.claimPill, isClaimed ? styles.claimPillOn : styles.claimPillOff]}
            >
              <Text style={[styles.claimPillText, isClaimed ? styles.claimOnText : styles.claimOffText]}>
                {isClaimed ? 'Claimed' : 'Unclaimed'}
              </Text>
            </Pressable>
          ) : null}
        </View>
        <Text style={styles.meta} numberOfLines={1}>
          {transaction.counterparty || transaction.reference || 'No reference'}
        </Text>
        <Text style={styles.date}>{formatDateTime(transaction.occurredAt)}</Text>
      </View>

      <View style={styles.amountWrap}>
        <Text style={[styles.amount, isIn ? styles.textIn : styles.textOut]}>
          {isIn ? '+' : '-'}
          {formatPeso(transaction.amount)}
        </Text>
        {transaction.fee > 0 ? (
          <Text style={styles.fee}>Fee {formatPeso(transaction.fee)}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  pressed: {
    opacity: 0.7,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  badgeIn: {
    backgroundColor: colors.cashInSoft,
  },
  badgeOut: {
    backgroundColor: colors.cashOutSoft,
  },
  badgeText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 12,
    letterSpacing: 0.6,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  title: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
    color: colors.ink,
  },
  claimPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.sm,
  },
  claimPillOn: {
    backgroundColor: colors.cashInSoft,
  },
  claimPillOff: {
    backgroundColor: '#F3E7C8',
  },
  claimPillText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 11,
  },
  claimOnText: {
    color: colors.cashIn,
  },
  claimOffText: {
    color: '#8A6A1D',
  },
  meta: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: 2,
  },
  date: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: colors.inkSoft,
    marginTop: 2,
  },
  amountWrap: {
    alignItems: 'flex-end',
    marginLeft: spacing.sm,
  },
  amount: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
  },
  fee: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: colors.inkSoft,
    marginTop: 2,
  },
  textIn: {
    color: colors.cashIn,
  },
  textOut: {
    color: colors.cashOut,
  },
});
