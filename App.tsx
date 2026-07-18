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
import { ReportsScreen } from './src/screens/ReportsScreen';
import { ReviewScreen } from './src/screens/ReviewScreen';
import { ScanScreen, type ScanResult } from './src/screens/ScanScreen';
import { SyncScreen } from './src/screens/SyncScreen';
import { colors } from './src/theme';
import type { Transaction, TransactionType } from './src/types';

type Screen =
  | { name: 'home' }
  | { name: 'scan'; scanType: TransactionType }
  | { name: 'sync' }
  | { name: 'reports' }
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
            onScanCashIn={() => setScreen({ name: 'scan', scanType: 'cash_in' })}
            onScanCashOut={() => setScreen({ name: 'scan', scanType: 'cash_out' })}
            onManual={() => setScreen({ name: 'review', mode: 'create' })}
            onOpenTransaction={(transaction) =>
              setScreen({ name: 'review', mode: 'edit', transaction })
            }
            onOpenSync={() => setScreen({ name: 'sync' })}
            onOpenReports={() => setScreen({ name: 'reports' })}
          />
        ) : null}

        {screen.name === 'scan' ? (
          <ScanScreen
            scanType={screen.scanType}
            onCancel={() => setScreen({ name: 'home' })}
            onParsed={(scan) => setScreen({ name: 'review', mode: 'from-scan', scan })}
          />
        ) : null}

        {screen.name === 'sync' ? (
          <SyncScreen onBack={() => setScreen({ name: 'home' })} />
        ) : null}

        {screen.name === 'reports' ? (
          <ReportsScreen onBack={() => setScreen({ name: 'home' })} />
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
