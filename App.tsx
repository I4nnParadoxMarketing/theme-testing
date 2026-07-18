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
import { SettingsScreen } from './src/screens/SettingsScreen';
import { SyncScreen } from './src/screens/SyncScreen';
import { TypeHubScreen } from './src/screens/TypeHubScreen';
import { colors } from './src/theme';
import type { Transaction, TransactionType } from './src/types';

type ReturnTarget =
  | { name: 'home' }
  | { name: 'typeHub'; type: TransactionType }
  | { name: 'settings' };

type Screen =
  | { name: 'home' }
  | { name: 'settings' }
  | { name: 'typeHub'; type: TransactionType }
  | { name: 'scan'; scanType: TransactionType; returnTo: ReturnTarget }
  | { name: 'sync'; returnTo: ReturnTarget }
  | { name: 'reports'; returnTo: ReturnTarget }
  | {
      name: 'review';
      mode: 'create' | 'edit' | 'from-scan';
      scan?: ScanResult;
      transaction?: Transaction;
      lockedType?: TransactionType;
      returnTo: ReturnTarget;
    };

export default function App() {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
    Fraunces_700Bold,
  });
  const [screen, setScreen] = useState<Screen>({ name: 'home' });

  const go = (target: ReturnTarget) => setScreen(target);

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
            onOpenCashIn={() => setScreen({ name: 'typeHub', type: 'cash_in' })}
            onOpenCashOut={() => setScreen({ name: 'typeHub', type: 'cash_out' })}
            onOpenTransaction={(transaction) =>
              setScreen({
                name: 'review',
                mode: 'edit',
                transaction,
                returnTo: { name: 'home' },
              })
            }
            onOpenSettings={() => setScreen({ name: 'settings' })}
          />
        ) : null}

        {screen.name === 'settings' ? (
          <SettingsScreen
            onBack={() => setScreen({ name: 'home' })}
            onOpenSync={() =>
              setScreen({ name: 'sync', returnTo: { name: 'settings' } })
            }
            onOpenReports={() =>
              setScreen({ name: 'reports', returnTo: { name: 'settings' } })
            }
          />
        ) : null}

        {screen.name === 'typeHub' ? (
          <TypeHubScreen
            type={screen.type}
            onBack={() => setScreen({ name: 'home' })}
            onScan={() =>
              setScreen({
                name: 'scan',
                scanType: screen.type,
                returnTo: { name: 'typeHub', type: screen.type },
              })
            }
            onManual={() =>
              setScreen({
                name: 'review',
                mode: 'create',
                lockedType: screen.type,
                returnTo: { name: 'typeHub', type: screen.type },
              })
            }
            onOpenTransaction={(transaction) =>
              setScreen({
                name: 'review',
                mode: 'edit',
                transaction,
                lockedType: screen.type,
                returnTo: { name: 'typeHub', type: screen.type },
              })
            }
          />
        ) : null}

        {screen.name === 'scan' ? (
          <ScanScreen
            scanType={screen.scanType}
            onCancel={() => go(screen.returnTo)}
            onParsed={(scan) =>
              setScreen({
                name: 'review',
                mode: 'from-scan',
                scan,
                lockedType: screen.scanType,
                returnTo: screen.returnTo,
              })
            }
          />
        ) : null}

        {screen.name === 'sync' ? (
          <SyncScreen onBack={() => go(screen.returnTo)} />
        ) : null}

        {screen.name === 'reports' ? (
          <ReportsScreen onBack={() => go(screen.returnTo)} />
        ) : null}

        {screen.name === 'review' ? (
          <ReviewScreen
            mode={screen.mode}
            scanResult={screen.scan}
            transaction={screen.transaction}
            lockedType={screen.lockedType}
            onDone={() => go(screen.returnTo)}
            onCancel={() => go(screen.returnTo)}
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
