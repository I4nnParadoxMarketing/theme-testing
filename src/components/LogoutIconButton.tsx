import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../theme';

interface Props {
  onPress: () => void;
}

/** Door/exit style logout icon button. */
export function LogoutIconButton({ onPress }: Props) {
  const confirm = () => {
    Alert.alert('Sign out', 'Sign out of GCashFlow on this phone?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress },
    ]);
  };

  return (
    <Pressable
      onPress={confirm}
      hitSlop={10}
      style={styles.wrap}
      accessibilityRole="button"
      accessibilityLabel="Sign out"
    >
      <View style={styles.icon}>
        <View style={styles.door} />
        <View style={styles.arrowStem} />
        <View style={styles.arrowHead} />
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
  icon: {
    width: 22,
    height: 18,
    justifyContent: 'center',
  },
  door: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 10,
    height: 18,
    borderWidth: 2,
    borderColor: colors.ocean,
    borderRightWidth: 0,
    borderTopLeftRadius: 3,
    borderBottomLeftRadius: 3,
  },
  arrowStem: {
    position: 'absolute',
    left: 8,
    top: 8,
    width: 12,
    height: 2,
    backgroundColor: colors.ocean,
    borderRadius: 1,
  },
  arrowHead: {
    position: 'absolute',
    right: 0,
    top: 5,
    width: 0,
    height: 0,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderLeftWidth: 6,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: colors.ocean,
  },
});
