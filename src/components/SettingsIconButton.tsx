import { Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../theme';

interface Props {
  onPress: () => void;
}

/** Simple gear icon button (no emoji). */
export function SettingsIconButton({ onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={styles.wrap}
      accessibilityRole="button"
      accessibilityLabel="Settings"
    >
      <View style={styles.gear}>
        <View style={styles.toothTop} />
        <View style={styles.toothRight} />
        <View style={styles.toothBottom} />
        <View style={styles.toothLeft} />
        <View style={styles.ring} />
        <View style={styles.hub} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gear: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toothTop: {
    position: 'absolute',
    top: 0,
    width: 6,
    height: 5,
    borderRadius: 1,
    backgroundColor: colors.ocean,
  },
  toothBottom: {
    position: 'absolute',
    bottom: 0,
    width: 6,
    height: 5,
    borderRadius: 1,
    backgroundColor: colors.ocean,
  },
  toothLeft: {
    position: 'absolute',
    left: 0,
    width: 5,
    height: 6,
    borderRadius: 1,
    backgroundColor: colors.ocean,
  },
  toothRight: {
    position: 'absolute',
    right: 0,
    width: 5,
    height: 6,
    borderRadius: 1,
    backgroundColor: colors.ocean,
  },
  ring: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 3,
    borderColor: colors.ocean,
    backgroundColor: 'transparent',
  },
  hub: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.ocean,
  },
});
