import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../theme';
import type { BalanceSummary } from '../types';
import { formatPeso } from '../utils/format';

interface Props {
  summary: BalanceSummary;
}

export function BalanceHero({ summary }: Props) {
  return (
    <LinearGradient
      colors={[colors.oceanDeep, colors.ocean, '#0E7C8A']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.hero}
    >
      <Text style={styles.brand}>GCashFlow</Text>
      <Text style={styles.label}>Net movement</Text>
      <Text style={styles.net}>{formatPeso(summary.net)}</Text>
      <Text style={styles.support}>
        Scan a receipt or add cash in / cash out by hand.
      </Text>

      <View style={styles.row}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Cash in</Text>
          <Text style={styles.statValue}>{formatPeso(summary.cashIn)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Cash out</Text>
          <Text style={styles.statValue}>{formatPeso(summary.cashOut)}</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  brand: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 34,
    color: colors.white,
    letterSpacing: -0.5,
    marginBottom: spacing.lg,
  },
  label: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: 'rgba(255,255,255,0.72)',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  net: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 40,
    color: colors.white,
    marginTop: 4,
  },
  support: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.84)',
    marginTop: spacing.sm,
    maxWidth: 280,
  },
  row: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.25)',
  },
  stat: {
    flex: 1,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginHorizontal: spacing.md,
  },
  statLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  statValue: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 18,
    color: colors.white,
  },
});
