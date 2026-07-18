import { useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii } from '../theme';

interface Props {
  count: number;
  onPress: () => void;
}

const useNativeDriver = Platform.OS !== 'web';

export function NotificationBell({ count, onPress }: Props) {
  const shake = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const hasAlerts = count > 0;

  useEffect(() => {
    if (!hasAlerts) {
      shake.setValue(0);
      pulse.setValue(1);
      return;
    }
    const shakeLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shake, { toValue: 1, duration: 70, useNativeDriver }),
        Animated.timing(shake, { toValue: -1, duration: 70, useNativeDriver }),
        Animated.timing(shake, { toValue: 1, duration: 70, useNativeDriver }),
        Animated.timing(shake, { toValue: 0, duration: 70, useNativeDriver }),
        Animated.delay(2400),
      ]),
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 700, useNativeDriver }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver }),
      ]),
    );
    shakeLoop.start();
    pulseLoop.start();
    return () => {
      shakeLoop.stop();
      pulseLoop.stop();
    };
  }, [hasAlerts, pulse, shake]);

  const rotate = shake.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-12deg', '12deg'],
  });

  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={styles.wrap}
      accessibilityRole="button"
      accessibilityLabel={
        hasAlerts ? `${count} pending notifications` : 'Notifications, all clear'
      }
    >
      <Animated.View style={{ transform: [{ rotate }, { scale: pulse }] }}>
        <View style={styles.bell}>
          <View style={[styles.dome, hasAlerts && styles.domeActive]} />
          <View style={[styles.body, hasAlerts && styles.bodyActive]} />
          <View style={[styles.rim, hasAlerts && styles.rimActive]} />
          <View style={[styles.clapper, hasAlerts && styles.clapperActive]} />
        </View>
      </Animated.View>
      {hasAlerts ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 99 ? '99+' : String(count)}</Text>
        </View>
      ) : null}
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
  bell: {
    width: 22,
    height: 24,
    alignItems: 'center',
  },
  dome: {
    width: 14,
    height: 10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: colors.inkSoft,
    opacity: 0.55,
  },
  domeActive: {
    backgroundColor: colors.ocean,
    opacity: 1,
  },
  body: {
    width: 18,
    height: 10,
    marginTop: -1,
    backgroundColor: colors.inkSoft,
    opacity: 0.55,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  bodyActive: {
    backgroundColor: colors.ocean,
    opacity: 1,
  },
  rim: {
    width: 22,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.inkSoft,
    opacity: 0.55,
    marginTop: -1,
  },
  rimActive: {
    backgroundColor: colors.ocean,
    opacity: 1,
  },
  clapper: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.inkSoft,
    opacity: 0.55,
    marginTop: 1,
  },
  clapperActive: {
    backgroundColor: colors.cashOut,
    opacity: 1,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 0,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.cashOut,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.paper,
  },
  badgeText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 10,
    color: colors.white,
    lineHeight: 12,
  },
});
