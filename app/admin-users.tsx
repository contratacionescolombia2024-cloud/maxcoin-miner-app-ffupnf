
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth, User } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AdminUsersScreen() {
  const { user: currentUser } = useAuth();
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [balanceChange, setBalanceChange] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const ADMIN_PASSWORD = 'admin123';

  useEffect(() => {
    if (isAuthenticated) {
      loadUsers();
    }
  }, [isAuthenticated]);

  const loadUsers = async () => {
    try {
      const usersData = await AsyncStorage.getItem('@maxcoin_users');
      if (usersData) {
        const parsedUsers: User[] = JSON.parse(usersData);
        setUsers(parsedUsers);
        console.log(`Loaded ${parsedUsers.length} users`);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleAuthenticate = () => {
    if (adminPassword === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      Alert.alert('Success', 'Admin access granted');
    } else {
      Alert.alert('Error', 'Invalid admin password');
    }
  };

  const handleTransferBalance = async () => {
    if (!selectedUser || !balanceChange) {
      Alert.alert('Error', 'Please select a user and enter an amount');
      return;
    }

    const amount = parseFloat(balanceChange);
    if (isNaN(amount)) {
      Alert.alert('Error', 'Invalid amount');
      return;
    }

    Alert.alert(
      'Confirm Transfer',
      `${amount > 0 ? 'Add' : 'Remove'} ${Math.abs(amount).toFixed(6)} MXI ${amount > 0 ? 'to' : 'from'} ${selectedUser.username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              const usersData = await AsyncStorage.getItem('@maxcoin_users');
              if (usersData) {
                const parsedUsers: User[] = JSON.parse(usersData);
                const userIndex = parsedUsers.findIndex(u => u.id === selectedUser.id);
                
                if (userIndex !== -1) {
                  parsedUsers[userIndex].balance += amount;
                  
                  // Add transaction record
                  const transaction = {
                    id: `ADM-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
                    type: 'transfer' as const,
                    amount: amount,
                    description: `Admin ${amount > 0 ? 'credit' : 'debit'} by ${currentUser?.username || 'Admin'}`,
                    timestamp: new Date().toISOString(),
                    status: 'completed' as const,
                  };
                  
                  if (!parsedUsers[userIndex].transactions) {
                    parsedUsers[userIndex].transactions = [];
                  }
                  parsedUsers[userIndex].transactions.unshift(transaction);
                  
                  await AsyncStorage.setItem('@maxcoin_users', JSON.stringify(parsedUsers));
                  setUsers(parsedUsers);
                  setSelectedUser(parsedUsers[userIndex]);
                  setBalanceChange('');
                  
                  Alert.alert('Success', `Balance updated for ${selectedUser.username}`);
                  console.log(`Admin transfer: ${amount} MXI to ${selectedUser.username}`);
                }
              }
            } catch (error) {
              console.error('Error transferring balance:', error);
              Alert.alert('Error', 'Failed to transfer balance');
            }
          },
        },
      ]
    );
  };

  const handleBlockUser = async (userId: string, username: string) => {
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${username}? This will prevent them from logging in.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              const blockedUsersData = await AsyncStorage.getItem('@maxcoin_blocked_users');
              const blockedUsers = blockedUsersData ? JSON.parse(blockedUsersData) : [];
              
              if (!blockedUsers.includes(userId)) {
                blockedUsers.push(userId);
                await AsyncStorage.setItem('@maxcoin_blocked_users', JSON.stringify(blockedUsers));
                Alert.alert('Success', `${username} has been blocked`);
                console.log(`User blocked: ${username} (${userId})`);
              }
            } catch (error) {
              console.error('Error blocking user:', error);
              Alert.alert('Error', 'Failed to block user');
            }
          },
        },
      ]
    );
  };

  const handleUnblockUser = async (userId: string, username: string) => {
    try {
      const blockedUsersData = await AsyncStorage.getItem('@maxcoin_blocked_users');
      const blockedUsers = blockedUsersData ? JSON.parse(blockedUsersData) : [];
      
      const updatedBlockedUsers = blockedUsers.filter((id: string) => id !== userId);
      await AsyncStorage.setItem('@maxcoin_blocked_users', JSON.stringify(updatedBlockedUsers));
      Alert.alert('Success', `${username} has been unblocked`);
      console.log(`User unblocked: ${username} (${userId})`);
    } catch (error) {
      console.error('Error unblocking user:', error);
      Alert.alert('Error', 'Failed to unblock user');
    }
  };

  const getReferralMetrics = (user: User) => {
    const directReferrals = users.filter(u => u.referredBy === user.id);
    const activeReferrals = directReferrals.filter(u => u.totalPurchases > 0);
    return {
      total: directReferrals.length,
      active: activeReferrals.length,
      totalPurchases: directReferrals.reduce((sum, u) => sum + u.totalPurchases, 0),
    };
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.referralCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.uniqueIdentifier.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.authContent}>
          <View style={styles.authHeader}>
            <IconSymbol name="person.2.badge.key.fill" size={80} color={colors.primary} />
            <Text style={styles.title}>Admin User Management</Text>
            <Text style={styles.subtitle}>Enter admin password to access user database</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Admin Password</Text>
              <View style={styles.inputContainer}>
                <IconSymbol name="key.fill" size={20} color={colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  value={adminPassword}
                  onChangeText={setAdminPassword}
                  placeholder="Enter admin password"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
            </View>

            <Pressable style={styles.primaryButton} onPress={handleAuthenticate}>
              <IconSymbol name="checkmark.circle.fill" size={20} color="#ffffff" />
              <Text style={styles.buttonText}>Authenticate</Text>
            </Pressable>

            <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
              <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <IconSymbol name="person.2.badge.key.fill" size={60} color={colors.primary} />
          <Text style={styles.title}>User Management</Text>
          <Text style={styles.subtitle}>Total Users: {users.length}</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.card}>
          <View style={styles.inputContainer}>
            <IconSymbol name="magnifyingglass" size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.input}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by username, code, or ID..."
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>

        {/* User Management Section */}
        {selectedUser && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <IconSymbol name="person.crop.circle.fill" size={32} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{selectedUser.username}</Text>
                <Text style={styles.cardSubtitle}>{selectedUser.uniqueIdentifier}</Text>
              </View>
              <Pressable onPress={() => setSelectedUser(null)}>
                <IconSymbol name="xmark.circle.fill" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.userDetailRow}>
              <Text style={styles.detailLabel}>Balance:</Text>
              <Text style={styles.detailValue}>{selectedUser.balance.toFixed(6)} MXI</Text>
            </View>

            <View style={styles.userDetailRow}>
              <Text style={styles.detailLabel}>Mining Power:</Text>
              <Text style={styles.detailValue}>{selectedUser.miningPower.toFixed(2)}x</Text>
            </View>

            <View style={styles.userDetailRow}>
              <Text style={styles.detailLabel}>Total Purchases:</Text>
              <Text style={styles.detailValue}>{selectedUser.totalPurchases.toFixed(6)} MXI</Text>
            </View>

            <View style={styles.userDetailRow}>
              <Text style={styles.detailLabel}>Referral Earnings:</Text>
              <Text style={styles.detailValue}>{selectedUser.referralEarnings.toFixed(6)} MXI</Text>
            </View>

            <View style={styles.userDetailRow}>
              <Text style={styles.detailLabel}>Referrals:</Text>
              <Text style={styles.detailValue}>{selectedUser.referrals.length}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Transfer Balance (+ to add, - to remove)</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={balanceChange}
                  onChangeText={setBalanceChange}
                  placeholder="e.g., 100 or -50"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                />
                <Text style={styles.inputSuffix}>MXI</Text>
              </View>
            </View>

            <View style={styles.buttonGroup}>
              <Pressable style={styles.primaryButton} onPress={handleTransferBalance}>
                <IconSymbol name="arrow.left.arrow.right.circle.fill" size={20} color="#ffffff" />
                <Text style={styles.buttonText}>Transfer Balance</Text>
              </Pressable>

              <Pressable 
                style={styles.dangerButton} 
                onPress={() => handleBlockUser(selectedUser.id, selectedUser.username)}
              >
                <IconSymbol name="hand.raised.fill" size={20} color="#ffffff" />
                <Text style={styles.buttonText}>Block User</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Users List */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>All Users ({filteredUsers.length})</Text>
          
          {filteredUsers.map((user) => {
            const metrics = getReferralMetrics(user);
            return (
              <Pressable
                key={user.id}
                style={[
                  styles.userCard,
                  selectedUser?.id === user.id && styles.userCardSelected
                ]}
                onPress={() => setSelectedUser(user)}
              >
                <View style={styles.userCardHeader}>
                  <IconSymbol name="person.circle.fill" size={24} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.userName}>{user.username}</Text>
                    <Text style={styles.userCode}>{user.referralCode}</Text>
                  </View>
                  <Text style={styles.userBalance}>{user.balance.toFixed(4)} MXI</Text>
                </View>

                <View style={styles.userMetrics}>
                  <View style={styles.metricItem}>
                    <IconSymbol name="chart.bar.fill" size={16} color={colors.textSecondary} />
                    <Text style={styles.metricText}>Power: {user.miningPower.toFixed(2)}x</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <IconSymbol name="person.2.fill" size={16} color={colors.textSecondary} />
                    <Text style={styles.metricText}>Refs: {metrics.total} ({metrics.active} active)</Text>
                  </View>
                </View>

                <View style={styles.userMetrics}>
                  <View style={styles.metricItem}>
                    <IconSymbol name="cart.fill" size={16} color={colors.textSecondary} />
                    <Text style={styles.metricText}>Purchases: {user.totalPurchases.toFixed(2)} MXI</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <IconSymbol name="dollarsign.circle.fill" size={16} color={colors.textSecondary} />
                    <Text style={styles.metricText}>Earnings: {user.referralEarnings.toFixed(4)} MXI</Text>
                  </View>
                </View>

                <Text style={styles.userTimestamp}>
                  Joined: {new Date(user.createdAt).toLocaleDateString()}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={[styles.buttonText, { color: colors.text }]}>Back to Admin Panel</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  authContent: {
    padding: 20,
    justifyContent: 'center',
    minHeight: '100%',
  },
  authHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginTop: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  cardSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  inputSuffix: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  userDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.background,
    marginVertical: 16,
  },
  buttonGroup: {
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    gap: 8,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  userCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.background,
  },
  userCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  userCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  userCode: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  userBalance: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  userMetrics: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  userTimestamp: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
