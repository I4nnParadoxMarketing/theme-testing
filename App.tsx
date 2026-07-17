import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import { Fraunces_700Bold, useFonts } from '@expo-google-fonts/fraunces';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TransactionsProvider } from './src/context/TransactionsContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { ReviewScreen } from './src/screens/ReviewScreen';
import { ScanScreen, type ScanResult } from './src/screens/ScanScreen';
import { colors } from './src/theme';
import type { Transaction } from './src/types';

type Screen =
  | { name: 'home' }
  | { name: 'scan' }
  | { name: 'review'; mode: 'create' | 'edit' | 'from-scan'; scan?: ScanResult; transaction?: Transaction };

export default function App() {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
    Fraunces_700Bold,
  });
  const [screen, setScreen] = useState<Screen>({ name: 'home' });

  if (!fontsLoaded) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color={colors.ocean} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <TransactionsProvider>
        <StatusBar style="dark" />
        {screen.name === 'home' ? (
          <HomeScreen
            onScan={() => setScreen({ name: 'scan' })}
            onManual={() => setScreen({ name: 'review', mode: 'create' })}
            onOpenTransaction={(transaction) =>
              setScreen({ name: 'review', mode: 'edit', transaction })
            }
          />
        ) : null}

        {screen.name === 'scan' ? (
          <ScanScreen
            onCancel={() => setScreen({ name: 'home' })}
            onParsed={(scan) => setScreen({ name: 'review', mode: 'from-scan', scan })}
          />
        ) : null}

        {screen.name === 'review' ? (
          <ReviewScreen
            mode={screen.mode}
            scanResult={screen.scan}
            transaction={screen.transaction}
            onDone={() => setScreen({ name: 'home' })}
            onCancel={() => setScreen({ name: 'home' })}
          />
        ) : null}
      </TransactionsProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper,
  },
});
