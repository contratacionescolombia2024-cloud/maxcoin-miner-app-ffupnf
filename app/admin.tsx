
import React, { useState } from 'react';
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
import { useMiningConfig } from '@/contexts/MiningConfigContext';
import { useLottery } from '@/contexts/LotteryContext';
import { useAuth } from '@/contexts/AuthContext';

const ADMIN_EMAIL = 'contratacionescolombia2024@gmail.com';

export default function AdminScreen() {
  const { config, updateConfig, resetConfig } = useMiningConfig();
  const { config: lotteryConfig, updateConfig: updateLotteryConfig } = useLottery();
  const { user } = useAuth();
  
  const [miningRate, setMiningRate] = useState(config.miningRatePerMinute.toString());
  const [minPurchase, setMinPurchase] = useState(config.minPurchase.toString());
  const [maxPurchase, setMaxPurchase] = useState(config.maxPurchase.toString());
  const [powerPercent, setPowerPercent] = useState(config.powerIncreasePercent.toString());
  const [powerThreshold, setPowerThreshold] = useState(config.powerIncreaseThreshold.toString());
  const [level1Commission, setLevel1Commission] = useState(config.level1Commission.toString());
  const [level2Commission, setLevel2Commission] = useState(config.level2Commission.toString());
  const [level3Commission, setLevel3Commission] = useState(config.level3Commission.toString());

  // Lottery configuration states
  const [ticketPrice, setTicketPrice] = useState(lotteryConfig.ticketPrice.toString());
  const [minTickets, setMinTickets] = useState(lotteryConfig.minTicketsForDraw.toString());
  const [numWinners, setNumWinners] = useState(lotteryConfig.numberOfWinners.toString());
  const [prizePercent, setPrizePercent] = useState(lotteryConfig.prizePoolPercentage.toString());

  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const ADMIN_PASSWORD = 'admin123'; // In production, this should be securely stored

  // Check if user is admin
  const isAdmin = user?.email === ADMIN_EMAIL;

  const handleAuthenticate = () => {
    if (!isAdmin) {
      Alert.alert('Access Denied', 'Only administrators can access this panel.');
      return;
    }

    if (adminPassword === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      Alert.alert('Success', 'Admin access granted');
    } else {
      Alert.alert('Error', 'Invalid admin password');
    }
  };

  const handleSaveConfig = async () => {
    try {
      const newConfig = {
        miningRatePerMinute: parseFloat(miningRate),
        minPurchase: parseFloat(minPurchase),
        maxPurchase: parseFloat(maxPurchase),
        powerIncreasePercent: parseFloat(powerPercent),
        powerIncreaseThreshold: parseFloat(powerThreshold),
        level1Commission: parseFloat(level1Commission),
        level2Commission: parseFloat(level2Commission),
        level3Commission: parseFloat(level3Commission),
      };

      // Validation
      if (Object.values(newConfig).some(val => isNaN(val) || val < 0)) {
        Alert.alert('Error', 'All values must be valid positive numbers');
        return;
      }

      if (newConfig.minPurchase > newConfig.maxPurchase) {
        Alert.alert('Error', 'Minimum purchase cannot be greater than maximum purchase');
        return;
      }

      await updateConfig(newConfig);

      // Update lottery configuration
      const newLotteryConfig = {
        ticketPrice: parseFloat(ticketPrice),
        minTicketsForDraw: parseInt(minTickets),
        numberOfWinners: parseInt(numWinners),
        prizePoolPercentage: parseFloat(prizePercent),
      };

      if (Object.values(newLotteryConfig).some(val => isNaN(val) || val < 0)) {
        Alert.alert('Error', 'All lottery values must be valid positive numbers');
        return;
      }

      if (newLotteryConfig.prizePoolPercentage > 100) {
        Alert.alert('Error', 'Prize pool percentage cannot exceed 100%');
        return;
      }

      await updateLotteryConfig(newLotteryConfig);

      Alert.alert('Success', 'Configuration updated successfully!');
    } catch (error) {
      console.error('Error saving config:', error);
      Alert.alert('Error', 'Failed to save configuration');
    }
  };

  const handleResetConfig = () => {
    Alert.alert(
      'Reset Configuration',
      'Are you sure you want to reset all settings to default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetConfig();
            setMiningRate(config.miningRatePerMinute.toString());
            setMinPurchase(config.minPurchase.toString());
            setMaxPurchase(config.maxPurchase.toString());
            setPowerPercent(config.powerIncreasePercent.toString());
            setPowerThreshold(config.powerIncreaseThreshold.toString());
            setLevel1Commission(config.level1Commission.toString());
            setLevel2Commission(config.level2Commission.toString());
            setLevel3Commission(config.level3Commission.toString());
            Alert.alert('Success', 'Configuration reset to defaults');
          },
        },
      ]
    );
  };

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.authContent}>
          <View style={styles.authHeader}>
            <IconSymbol name="exclamationmark.triangle.fill" size={80} color={colors.error} />
            <Text style={styles.title}>Access Denied</Text>
            <Text style={styles.subtitle}>
              Only administrators can access this panel.
            </Text>
          </View>

          <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
            <Text style={[styles.buttonText, { color: colors.text }]}>Go Back</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.authContent}>
          <View style={styles.authHeader}>
            <IconSymbol name="lock.shield.fill" size={80} color={colors.primary} />
            <Text style={styles.title}>Admin Access</Text>
            <Text style={styles.subtitle}>Enter admin password to continue</Text>
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

          <View style={styles.infoCard}>
            <IconSymbol name="info.circle.fill" size={20} color={colors.primary} />
            <Text style={styles.infoText}>
              Default password: admin123 (Change this in production!)
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <IconSymbol name="gearshape.fill" size={60} color={colors.primary} />
          <Text style={styles.title}>Admin Panel</Text>
          <Text style={styles.subtitle}>Configure mining parameters and lottery settings</Text>
        </View>

        {/* Quick Access Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Access</Text>
          
          <Pressable 
            style={styles.quickAccessButton}
            onPress={() => router.push('/admin-users')}
          >
            <IconSymbol name="person.2.badge.key.fill" size={32} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.quickAccessTitle}>User Management</Text>
              <Text style={styles.quickAccessSubtitle}>
                View all users, transfer balances, block accounts
              </Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* Mining Rate Configuration */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <IconSymbol name="clock.fill" size={24} color={colors.primary} />
            <Text style={styles.cardTitle}>Mining Rate</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Base Mining Rate (MXI per minute)</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={miningRate}
                onChangeText={setMiningRate}
                placeholder="0.0002"
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
              />
              <Text style={styles.inputSuffix}>MXI/min</Text>
            </View>
            <Text style={styles.inputHint}>
              Current: {config.miningRatePerMinute} MXI per minute
            </Text>
          </View>
        </View>

        {/* Purchase Limits Configuration */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <IconSymbol name="cart.fill" size={24} color={colors.primary} />
            <Text style={styles.cardTitle}>Purchase Limits</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Minimum Purchase (MXI)</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={minPurchase}
                onChangeText={setMinPurchase}
                placeholder="0.02"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
              <Text style={styles.inputSuffix}>MXI</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Maximum Purchase (MXI per transaction)</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={maxPurchase}
                onChangeText={setMaxPurchase}
                placeholder="10000"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
              <Text style={styles.inputSuffix}>MXI</Text>
            </View>
          </View>

          <View style={styles.infoBox}>
            <IconSymbol name="info.circle.fill" size={16} color={colors.primary} />
            <Text style={styles.infoBoxText}>
              Current limits: {config.minPurchase} - {config.maxPurchase} MXI
            </Text>
          </View>
        </View>

        {/* Mining Power Configuration */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <IconSymbol name="bolt.fill" size={24} color={colors.accent} />
            <Text style={styles.cardTitle}>Mining Power Increase</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Power Increase Percentage (%)</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={powerPercent}
                onChangeText={setPowerPercent}
                placeholder="1"
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
              />
              <Text style={styles.inputSuffix}>%</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>MXI Threshold for Power Increase</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={powerThreshold}
                onChangeText={setPowerThreshold}
                placeholder="10"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
              <Text style={styles.inputSuffix}>MXI</Text>
            </View>
          </View>

          <View style={styles.infoBox}>
            <IconSymbol name="info.circle.fill" size={16} color={colors.primary} />
            <Text style={styles.infoBoxText}>
              Current: +{config.powerIncreasePercent}% power per {config.powerIncreaseThreshold} MXI purchased
            </Text>
          </View>
        </View>

        {/* Referral Commission Configuration */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <IconSymbol name="person.3.fill" size={24} color={colors.success} />
            <Text style={styles.cardTitle}>Referral Commissions</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Level 1 Commission (%)</Text>
            <View style={styles.inputContainer}>
              <IconSymbol name="person.fill" size={20} color={colors.primary} />
              <TextInput
                style={styles.input}
                value={level1Commission}
                onChangeText={setLevel1Commission}
                placeholder="5"
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
              />
              <Text style={styles.inputSuffix}>%</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Level 2 Commission (%)</Text>
            <View style={styles.inputContainer}>
              <IconSymbol name="person.2.fill" size={20} color={colors.secondary} />
              <TextInput
                style={styles.input}
                value={level2Commission}
                onChangeText={setLevel2Commission}
                placeholder="2"
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
              />
              <Text style={styles.inputSuffix}>%</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Level 3 Commission (%)</Text>
            <View style={styles.inputContainer}>
              <IconSymbol name="person.3.fill" size={20} color={colors.accent} />
              <TextInput
                style={styles.input}
                value={level3Commission}
                onChangeText={setLevel3Commission}
                placeholder="1"
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
              />
              <Text style={styles.inputSuffix}>%</Text>
            </View>
          </View>

          <View style={styles.infoBox}>
            <IconSymbol name="info.circle.fill" size={16} color={colors.primary} />
            <Text style={styles.infoBoxText}>
              Current: L1: {config.level1Commission}%, L2: {config.level2Commission}%, L3: {config.level3Commission}%
            </Text>
          </View>
        </View>

        {/* Lottery Configuration */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <IconSymbol name="trophy.fill" size={24} color="#FFD700" />
            <Text style={styles.cardTitle}>MXILUCKY Lottery Settings</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Ticket Price (MXI)</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={ticketPrice}
                onChangeText={setTicketPrice}
                placeholder="1"
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
              />
              <Text style={styles.inputSuffix}>MXI</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Minimum Tickets for Draw</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={minTickets}
                onChangeText={setMinTickets}
                placeholder="1000"
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
              />
              <Text style={styles.inputSuffix}>tickets</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Number of Winners</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={numWinners}
                onChangeText={setNumWinners}
                placeholder="4"
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
              />
              <Text style={styles.inputSuffix}>winners</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Prize Pool Percentage (%)</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={prizePercent}
                onChangeText={setPrizePercent}
                placeholder="90"
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
              />
              <Text style={styles.inputSuffix}>%</Text>
            </View>
            <Text style={styles.inputHint}>
              Remaining {100 - parseFloat(prizePercent || '0')}% goes to admin wallet
            </Text>
          </View>

          <View style={styles.infoBox}>
            <IconSymbol name="info.circle.fill" size={16} color={colors.primary} />
            <Text style={styles.infoBoxText}>
              Current: {lotteryConfig.ticketPrice} MXI per ticket, {lotteryConfig.numberOfWinners} winners, {lotteryConfig.prizePoolPercentage}% prize pool
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonGroup}>
          <Pressable style={styles.primaryButton} onPress={handleSaveConfig}>
            <IconSymbol name="checkmark.circle.fill" size={20} color="#ffffff" />
            <Text style={styles.buttonText}>Save Configuration</Text>
          </Pressable>

          <Pressable style={styles.warningButton} onPress={handleResetConfig}>
            <IconSymbol name="arrow.counterclockwise.circle.fill" size={20} color="#ffffff" />
            <Text style={styles.buttonText}>Reset to Defaults</Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
            <Text style={[styles.buttonText, { color: colors.text }]}>Back to Home</Text>
          </Pressable>
        </View>

        <View style={styles.warningCard}>
          <IconSymbol name="exclamationmark.triangle.fill" size={24} color={colors.warning} />
          <Text style={styles.warningText}>
            Warning: Changes to these settings will affect all users immediately. Make sure to test thoroughly before applying changes in production.
          </Text>
        </View>
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
  },
  quickAccessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  quickAccessTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  quickAccessSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
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
  inputHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    marginLeft: 4,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.highlight,
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.highlight,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    gap: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#856404',
    lineHeight: 18,
  },
  buttonGroup: {
    gap: 12,
    marginTop: 8,
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
  warningButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warning,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
