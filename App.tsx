import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import { Fraunces_700Bold, useFonts } from '@expo-google-fonts/fraunces';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { TransactionsProvider } from './src/context/TransactionsContext';
import { AccountScreen } from './src/screens/AccountScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { NotificationsScreen } from './src/screens/NotificationsScreen';
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
  | { name: 'settings' }
  | { name: 'account' }
  | { name: 'notifications' };

type ReviewResume = {
  mode: 'create' | 'edit' | 'from-scan';
  transaction?: Transaction;
  lockedType?: TransactionType;
  returnTo: ReturnTarget;
  scan?: ScanResult;
};

type Screen =
  | { name: 'home' }
  | { name: 'settings' }
  | { name: 'account' }
  | { name: 'notifications' }
  | { name: 'typeHub'; type: TransactionType }
  | {
      name: 'scan';
      scanType: TransactionType;
      returnTo: ReturnTarget;
      /** When set, cancel/success returns into this review form instead of the hub. */
      resumeReview?: ReviewResume;
    }
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

function AppShell() {
  const { ready: authReady, session } = useAuth();
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  const go = (target: ReturnTarget) => setScreen(target);

  useEffect(() => {
    // Always land on dashboard after a fresh login / logout cycle.
    if (session) setScreen({ name: 'home' });
  }, [session?.userId]);

  if (!authReady) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color={colors.ocean} />
      </View>
    );
  }

  if (!session) {
    return <LoginScreen />;
  }

  return (
    <>
      {screen.name === 'home' ? (
        <HomeScreen
          onOpenCashIn={() => setScreen({ name: 'typeHub', type: 'cash_in' })}
          onOpenCashOut={() => setScreen({ name: 'typeHub', type: 'cash_out' })}
          onOpenTransaction={(transaction) =>
            setScreen({
              name: 'review',
              mode: 'edit',
              transaction,
              lockedType: transaction.type,
              returnTo: { name: 'home' },
            })
          }
          onOpenSettings={() => setScreen({ name: 'settings' })}
          onOpenNotifications={() => setScreen({ name: 'notifications' })}
        />
      ) : null}

      {screen.name === 'notifications' ? (
        <NotificationsScreen
          onBack={() => setScreen({ name: 'home' })}
          onOpenTransaction={(transaction) =>
            setScreen({
              name: 'review',
              mode: 'edit',
              transaction,
              lockedType: transaction.type,
              returnTo: { name: 'notifications' },
            })
          }
        />
      ) : null}

      {screen.name === 'settings' ? (
        <SettingsScreen
          onBack={() => setScreen({ name: 'home' })}
          onOpenSync={() => setScreen({ name: 'sync', returnTo: { name: 'settings' } })}
          onOpenReports={() =>
            setScreen({ name: 'reports', returnTo: { name: 'settings' } })
          }
          onOpenAccount={() => setScreen({ name: 'account' })}
        />
      ) : null}

      {screen.name === 'account' ? (
        <AccountScreen onBack={() => setScreen({ name: 'settings' })} />
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
          onCancel={() => {
            if (screen.resumeReview) {
              setScreen({
                name: 'review',
                mode: screen.resumeReview.mode,
                scan: screen.resumeReview.scan,
                transaction: screen.resumeReview.transaction,
                lockedType: screen.resumeReview.lockedType,
                returnTo: screen.resumeReview.returnTo,
              });
              return;
            }
            go(screen.returnTo);
          }}
          onParsed={(scan) => {
            if (screen.resumeReview) {
              setScreen({
                name: 'review',
                mode: screen.resumeReview.mode === 'edit' ? 'edit' : 'from-scan',
                scan,
                transaction: screen.resumeReview.transaction,
                lockedType: screen.resumeReview.lockedType ?? screen.scanType,
                returnTo: screen.resumeReview.returnTo,
              });
              return;
            }
            setScreen({
              name: 'review',
              mode: 'from-scan',
              scan,
              lockedType: screen.scanType,
              returnTo: screen.returnTo,
            });
          }}
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
          onScan={
            (screen.lockedType ?? screen.transaction?.type) === 'cash_in'
              ? () =>
                  setScreen({
                    name: 'scan',
                    scanType: 'cash_in',
                    returnTo: screen.returnTo,
                    resumeReview: {
                      mode:
                        screen.mode === 'edit'
                          ? 'edit'
                          : screen.mode === 'from-scan'
                            ? 'from-scan'
                            : 'create',
                      scan: screen.scan,
                      transaction: screen.transaction,
                      lockedType: screen.lockedType ?? 'cash_in',
                      returnTo: screen.returnTo,
                    },
                  })
              : undefined
          }
          onDone={() => go(screen.returnTo)}
          onCancel={() => go(screen.returnTo)}
        />
      ) : null}
    </>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
    Fraunces_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color={colors.ocean} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <TransactionsProvider>
          <StatusBar style="dark" />
          <AppShell />
        </TransactionsProvider>
      </AuthProvider>
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
