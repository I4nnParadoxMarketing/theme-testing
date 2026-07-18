import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { colors, radii, spacing } from '../theme';

interface Props {
  onBack: () => void;
}

export function AccountScreen({ onBack }: Props) {
  const { currentUser, isAdmin, users, changeOwnPassword, addStaff, updateStaff, logout } =
    useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [nextPassword, setNextPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [staffUsername, setStaffUsername] = useState('');
  const [staffPassword, setStaffPassword] = useState('1234');
  const [staffName, setStaffName] = useState('');
  const [staffStatus, setStaffStatus] = useState<string | null>(null);
  const [staffError, setStaffError] = useState<string | null>(null);

  const [editPasswords, setEditPasswords] = useState<Record<string, string>>({});
  const staffUsers = useMemo(() => users.filter((u) => u.role === 'staff'), [users]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Pressable onPress={onBack} hitSlop={10}>
          <Text style={styles.back}>← Settings</Text>
        </Pressable>

        <Text style={styles.brand}>Account</Text>
        <Text style={styles.support}>
          Signed in as {currentUser?.displayName || currentUser?.username} (
          {currentUser?.role}).
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Change my password</Text>
          <Text style={styles.label}>Current password</Text>
          <TextInput
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            style={styles.input}
            placeholder="Current password"
            placeholderTextColor={colors.inkSoft}
          />
          <Text style={styles.label}>New password</Text>
          <TextInput
            value={nextPassword}
            onChangeText={setNextPassword}
            secureTextEntry
            style={styles.input}
            placeholder="At least 4 characters"
            placeholderTextColor={colors.inkSoft}
          />
          {passwordError ? <Text style={styles.error}>{passwordError}</Text> : null}
          {passwordStatus ? <Text style={styles.status}>{passwordStatus}</Text> : null}
          <PrimaryButton
            label="Update password"
            onPress={() => {
              void (async () => {
                setPasswordError(null);
                setPasswordStatus(null);
                try {
                  await changeOwnPassword(currentPassword, nextPassword);
                  setCurrentPassword('');
                  setNextPassword('');
                  setPasswordStatus('Password updated.');
                } catch (err) {
                  setPasswordError(err instanceof Error ? err.message : 'Could not update password.');
                }
              })();
            }}
            style={styles.gap}
          />
        </View>

        {isAdmin ? (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Add staff</Text>
              <Text style={styles.cardBody}>
                New staff can sign in on any phone after Cloud sync pushes the account online.
              </Text>
              <Text style={styles.label}>Username</Text>
              <TextInput
                value={staffUsername}
                onChangeText={setStaffUsername}
                autoCapitalize="none"
                style={styles.input}
                placeholder="e.g. juan"
                placeholderTextColor={colors.inkSoft}
              />
              <Text style={styles.label}>Display name</Text>
              <TextInput
                value={staffName}
                onChangeText={setStaffName}
                style={styles.input}
                placeholder="Optional"
                placeholderTextColor={colors.inkSoft}
              />
              <Text style={styles.label}>Password</Text>
              <TextInput
                value={staffPassword}
                onChangeText={setStaffPassword}
                secureTextEntry
                style={styles.input}
                placeholder="1234"
                placeholderTextColor={colors.inkSoft}
              />
              {staffError ? <Text style={styles.error}>{staffError}</Text> : null}
              {staffStatus ? <Text style={styles.status}>{staffStatus}</Text> : null}
              <PrimaryButton
                label="Add staff account"
                onPress={() => {
                  void (async () => {
                    setStaffError(null);
                    setStaffStatus(null);
                    try {
                      await addStaff({
                        username: staffUsername,
                        password: staffPassword,
                        displayName: staffName,
                      });
                      setStaffUsername('');
                      setStaffName('');
                      setStaffPassword('1234');
                      setStaffStatus('Staff account added and synced when online.');
                    } catch (err) {
                      setStaffError(err instanceof Error ? err.message : 'Could not add staff.');
                    }
                  })();
                }}
                style={styles.gap}
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Staff accounts</Text>
              {staffUsers.length === 0 ? (
                <Text style={styles.cardBody}>No staff accounts yet.</Text>
              ) : (
                staffUsers.map((user) => (
                  <View key={user.id} style={styles.staffRow}>
                    <View style={styles.staffHead}>
                      <Text style={styles.staffName}>
                        {user.displayName || user.username}
                        {!user.active ? ' (inactive)' : ''}
                      </Text>
                      <Text style={styles.staffMeta}>@{user.username}</Text>
                    </View>
                    <TextInput
                      value={editPasswords[user.id] || ''}
                      onChangeText={(value) =>
                        setEditPasswords((prev) => ({ ...prev, [user.id]: value }))
                      }
                      secureTextEntry
                      style={styles.input}
                      placeholder="New password"
                      placeholderTextColor={colors.inkSoft}
                    />
                    <View style={styles.staffActions}>
                      <PrimaryButton
                        label="Reset password"
                        variant="secondary"
                        style={styles.actionFlex}
                        onPress={() => {
                          void (async () => {
                            const password = editPasswords[user.id];
                            if (!password) {
                              setStaffError('Enter a new password for that staff account.');
                              return;
                            }
                            setStaffError(null);
                            try {
                              await updateStaff(user.id, { password });
                              setEditPasswords((prev) => ({ ...prev, [user.id]: '' }));
                              setStaffStatus(`Password updated for @${user.username}.`);
                            } catch (err) {
                              setStaffError(
                                err instanceof Error ? err.message : 'Could not update staff.',
                              );
                            }
                          })();
                        }}
                      />
                      <PrimaryButton
                        label={user.active ? 'Deactivate' : 'Activate'}
                        variant="ghost"
                        style={styles.actionFlex}
                        onPress={() => {
                          void (async () => {
                            setStaffError(null);
                            try {
                              await updateStaff(user.id, { active: !user.active });
                              setStaffStatus(
                                user.active
                                  ? `@${user.username} deactivated.`
                                  : `@${user.username} activated.`,
                              );
                            } catch (err) {
                              setStaffError(
                                err instanceof Error ? err.message : 'Could not update staff.',
                              );
                            }
                          })();
                        }}
                      />
                    </View>
                  </View>
                ))
              )}
            </View>
          </>
        ) : null}

        <PrimaryButton label="Sign out" variant="secondary" onPress={() => void logout()} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  back: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
    color: colors.ocean,
    marginBottom: spacing.md,
  },
  brand: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 34,
    color: colors.ink,
  },
  support: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: colors.inkSoft,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 17,
    color: colors.ink,
  },
  cardBody: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.inkSoft,
    marginTop: 4,
  },
  label: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: spacing.md,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontFamily: 'DMSans_500Medium',
    fontSize: 16,
    color: colors.ink,
    backgroundColor: colors.paper,
  },
  gap: { marginTop: spacing.md },
  error: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: colors.cashOut,
    marginTop: spacing.sm,
  },
  status: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: colors.ocean,
    marginTop: spacing.sm,
  },
  staffRow: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  staffHead: { marginBottom: spacing.sm },
  staffName: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
    color: colors.ink,
  },
  staffMeta: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: 2,
  },
  staffActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionFlex: { flex: 1 },
});
