
import React, { useState } from 'react';
import { colors } from '@/styles/commonStyles';
import { useBinance } from '@/contexts/BinanceContext';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { 
  StyleSheet, 
  Text, 
  View, 
  Pressable,
  TextInput,
  Alert,
  ScrollView 
} from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';

export default function FormSheetModal() {
  const { user, withdrawMXI, updateWithdrawalAddress, canWithdrawAmount, getActiveReferralsCount } = useAuth();
  const { mxiRate, isConnected, convertMXIToUSD } = useBinance();
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleWithdraw = async () => {
    if (!user) {
      Alert.alert('Error', 'Please log in to withdraw');
      return;
    }

    if (!address.trim()) {
      Alert.alert('Error', 'Please enter a withdrawal address');
      return;
    }

    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    // Check withdrawal eligibility
    const eligibility = canWithdrawAmount(withdrawAmount);
    if (!eligibility.canWithdraw) {
      Alert.alert('Withdrawal Restricted', eligibility.message || 'You cannot withdraw this amount');
      return;
    }

    // Check if mining earnings withdrawal requires referrals
    const activeReferrals = await getActiveReferralsCount();
    const miningEarnings = user.withdrawalRestrictions?.miningEarnings || 0;
    
    if (miningEarnings > 0 && activeReferrals < 10 && user.withdrawalRestrictions?.withdrawalCount < 5) {
      Alert.alert(
        'Mining Withdrawal Restricted',
        `You need 10 active referrals with purchases to withdraw mining earnings. Current: ${activeReferrals}/10\n\nNote: This requirement applies to your first 5 withdrawals.`,
        [{ text: 'OK' }]
      );
      return;
    }

    const usdValue = mxiRate ? convertMXIToUSD(withdrawAmount) : 0;

    Alert.alert(
      'Confirm Withdrawal',
      `Withdraw ${withdrawAmount.toFixed(6)} MXI via Binance?\n\nWallet Address: ${address}\n\nEstimated value: $${usdValue.toFixed(2)} USD\n\nNetwork: BSC (Binance Smart Chain)`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setIsProcessing(true);
            try {
              // Save withdrawal address
              await updateWithdrawalAddress('binance', address);

              // Process withdrawal
              const result = await withdrawMXI('binance', address, withdrawAmount);

              if (result.success) {
                Alert.alert(
                  'Success',
                  'Withdrawal request submitted successfully! Your MXI will be sent to your wallet within 1-24 hours via Binance.',
                  [{ text: 'OK', onPress: () => router.back() }]
                );
              } else {
                Alert.alert('Error', result.message || 'Withdrawal failed');
              }
            } catch (error) {
              console.error('Withdrawal error:', error);
              Alert.alert('Error', 'An error occurred during withdrawal');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  if (!user) {
    return null;
  }

  const eligibility = canWithdrawAmount(parseFloat(amount) || 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <IconSymbol name="xmark" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Withdraw MXI</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Binance Integration Notice */}
        <View style={styles.noticeCard}>
          <IconSymbol name="bitcoinsign.circle.fill" size={28} color="#F3BA2F" />
          <View style={{ flex: 1 }}>
            <Text style={styles.noticeTitle}>Binance Withdrawal</Text>
            <Text style={styles.noticeText}>
              Withdrawals are processed securely through Binance. You can send MXI to any wallet that accepts MXI tokens on the BSC network.
            </Text>
          </View>
        </View>

        {/* Balance Info */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>{user.balance.toFixed(6)} MXI</Text>
          {mxiRate && (
            <Text style={styles.balanceUsd}>
              ≈ ${convertMXIToUSD(user.balance).toFixed(2)} USD
            </Text>
          )}
          
          <View style={styles.divider} />
          
          <Text style={styles.withdrawableLabel}>Available for Withdrawal</Text>
          <Text style={styles.withdrawableAmount}>
            {eligibility.availableForWithdrawal.toFixed(6)} MXI
          </Text>
          <View style={styles.breakdownContainer}>
            <View style={styles.breakdownRow}>
              <View style={[styles.breakdownDot, { backgroundColor: colors.success }]} />
              <Text style={styles.withdrawableNote}>
                Purchased: {user.withdrawalRestrictions?.purchasedAmount.toFixed(6)} MXI
              </Text>
            </View>
            <View style={styles.breakdownRow}>
              <View style={[styles.breakdownDot, { backgroundColor: colors.primary }]} />
              <Text style={styles.withdrawableNote}>
                Commissions: {user.withdrawalRestrictions?.commissionEarnings.toFixed(6)} MXI (immediate)
              </Text>
            </View>
            <View style={styles.breakdownRow}>
              <View style={[styles.breakdownDot, { backgroundColor: user.withdrawalRestrictions?.canWithdrawEarnings ? colors.success : colors.warning }]} />
              <Text style={styles.withdrawableNote}>
                Mining: {user.withdrawalRestrictions?.miningEarnings.toFixed(6)} MXI{' '}
                {user.withdrawalRestrictions?.canWithdrawEarnings ? '(available)' : '(requires 10 referrals)'}
              </Text>
            </View>
          </View>
        </View>

        {/* Withdrawal Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MXI Wallet Address (BSC Network)</Text>
          <Text style={styles.sectionSubtitle}>
            Enter any wallet address that accepts MXI tokens on Binance Smart Chain
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your MXI wallet address"
            placeholderTextColor={colors.textSecondary}
            value={address}
            onChangeText={setAddress}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {user.withdrawalAddresses?.binance && (
            <Pressable 
              style={styles.savedAddressButton}
              onPress={() => setAddress(user.withdrawalAddresses.binance || '')}
            >
              <IconSymbol name="clock.arrow.circlepath" size={16} color={colors.primary} />
              <Text style={styles.savedAddressText}>
                Use saved: {user.withdrawalAddresses.binance?.substring(0, 20)}...
              </Text>
            </Pressable>
          )}
        </View>

        {/* Amount */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Amount (MXI)</Text>
          <TextInput
            style={styles.input}
            placeholder="0.000000"
            placeholderTextColor={colors.textSecondary}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />
          <Pressable 
            style={styles.maxButton}
            onPress={() => setAmount(eligibility.availableForWithdrawal.toString())}
          >
            <Text style={styles.maxButtonText}>Max: {eligibility.availableForWithdrawal.toFixed(6)}</Text>
          </Pressable>
          {amount && mxiRate && (
            <Text style={styles.amountUsd}>
              ≈ ${convertMXIToUSD(parseFloat(amount)).toFixed(2)} USD
            </Text>
          )}
        </View>

        {/* Withdrawal Info */}
        <View style={styles.infoCard}>
          <IconSymbol name="info.circle.fill" size={20} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Withdrawal Information</Text>
            <Text style={styles.infoText}>
              - Withdrawals are processed through Binance
            </Text>
            <Text style={styles.infoText}>
              - You can send MXI to any wallet that accepts MXI tokens
            </Text>
            <Text style={styles.infoText}>
              - Network: BSC (Binance Smart Chain)
            </Text>
            <Text style={styles.infoText}>
              - Processing time: 1-24 hours
            </Text>
            <Text style={styles.infoText}>
              - Commissions are available for immediate withdrawal
            </Text>
            <Text style={styles.infoText}>
              - Mining earnings require 10 active referrals (first 5 withdrawals)
            </Text>
            <Text style={styles.infoText}>
              - Purchased MXI is always available for withdrawal
            </Text>
          </View>
        </View>

        {/* Withdraw Button */}
        <Pressable
          style={[
            styles.withdrawButton,
            (isProcessing || !address || !amount || !eligibility.canWithdraw) && styles.withdrawButtonDisabled,
          ]}
          onPress={handleWithdraw}
          disabled={isProcessing || !address || !amount || !eligibility.canWithdraw}
        >
          <IconSymbol 
            name="arrow.up.circle.fill" 
            size={20} 
            color={colors.background} 
          />
          <Text style={styles.withdrawButtonText}>
            {isProcessing ? 'Processing...' : 'Withdraw via Binance'}
          </Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F3BA2F' + '15',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: '#F3BA2F' + '30',
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  noticeText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  balanceCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 4,
  },
  balanceUsd: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: colors.background,
    marginVertical: 16,
  },
  withdrawableLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  withdrawableAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.success,
    marginBottom: 12,
  },
  breakdownContainer: {
    width: '100%',
    gap: 6,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  breakdownDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  withdrawableNote: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  savedAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  savedAddressText: {
    fontSize: 13,
    color: colors.primary,
  },
  maxButton: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  maxButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  amountUsd: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.highlight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 4,
  },
  withdrawButton: {
    backgroundColor: '#F3BA2F',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  withdrawButtonDisabled: {
    backgroundColor: colors.textSecondary,
    opacity: 0.5,
  },
  withdrawButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.background,
  },
});
