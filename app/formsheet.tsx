
import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Pressable,
  TextInput,
  Alert,
  ScrollView 
} from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useAuth } from '@/contexts/AuthContext';
import { useBinance } from '@/contexts/BinanceContext';

type Platform = 'binance' | 'coinbase' | 'skrill';

interface PlatformOption {
  id: Platform;
  name: string;
  icon: string;
  color: string;
}

const platforms: PlatformOption[] = [
  { id: 'binance', name: 'Binance', icon: 'bitcoinsign.circle.fill', color: '#F3BA2F' },
  { id: 'coinbase', name: 'Coinbase', icon: 'dollarsign.circle.fill', color: '#0052FF' },
  { id: 'skrill', name: 'Skrill', icon: 'creditcard.circle.fill', color: '#862165' },
];

export default function FormSheetModal() {
  const { user, withdrawMXI, updateWithdrawalAddress } = useAuth();
  const { convertMXIToUSD, mxiRate } = useBinance();
  
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('binance');
  const [withdrawalAddress, setWithdrawalAddress] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const amount = parseFloat(withdrawAmount) || 0;
  const networkFee = 0.0001;
  const finalAmount = amount - networkFee;
  const usdValue = convertMXIToUSD(amount);

  const handleWithdraw = async () => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    if (!withdrawAmount || isNaN(amount) || amount <= 0) {
      Alert.alert(
        'Invalid Amount',
        'Please enter a valid withdrawal amount',
        [{ text: 'OK' }]
      );
      return;
    }

    if (amount < 0.1) {
      Alert.alert(
        'Minimum Withdrawal',
        'Minimum withdrawal amount is 0.1 MXI',
        [{ text: 'OK' }]
      );
      return;
    }

    if (amount > user.balance) {
      Alert.alert(
        'Insufficient Balance',
        `You only have ${user.balance.toFixed(6)} MXI available`,
        [{ text: 'OK' }]
      );
      return;
    }

    if (!withdrawalAddress.trim()) {
      Alert.alert(
        'Missing Address',
        `Please enter your ${platforms.find(p => p.id === selectedPlatform)?.name} wallet address`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Only Binance is currently supported
    if (selectedPlatform !== 'binance') {
      Alert.alert(
        'Coming Soon',
        'Only Binance withdrawals are currently supported. Other platforms will be available soon.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsProcessing(true);
    
    try {
      // Save withdrawal address for future use
      await updateWithdrawalAddress(selectedPlatform, withdrawalAddress);

      // Execute withdrawal through Supabase Edge Function
      const result = await withdrawMXI(selectedPlatform, withdrawalAddress, amount);

      if (result.success) {
        Alert.alert(
          'Withdrawal Initiated',
          `Your withdrawal of ${amount.toFixed(6)} MXI has been initiated!\n\n` +
          `Platform: ${platforms.find(p => p.id === selectedPlatform)?.name}\n` +
          `Address: ${withdrawalAddress.substring(0, 20)}...\n` +
          `You will receive: ${finalAmount.toFixed(6)} MXI\n` +
          `Network fee: ${networkFee.toFixed(6)} MXI\n` +
          `USD Value: $${usdValue.toFixed(2)}\n\n` +
          `Processing time: 24-48 hours\n\n` +
          `Your unique identifier: ${user.uniqueIdentifier}\n\n` +
          `You will receive a confirmation email once the withdrawal is processed.`,
          [
            { 
              text: 'OK', 
              onPress: () => router.back() 
            }
          ]
        );
      } else {
        Alert.alert(
          'Withdrawal Failed',
          result.message || 'An error occurred during withdrawal',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
      Alert.alert(
        'Error',
        'Failed to process withdrawal. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.grabber} />
        <Text style={styles.title}>Withdraw MXI</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.identifierCard}>
          <View style={styles.identifierHeader}>
            <IconSymbol name="person.badge.key.fill" size={20} color={colors.primary} />
            <Text style={styles.identifierTitle}>Your Unique ID</Text>
          </View>
          <Text style={styles.identifierValue}>{user.uniqueIdentifier}</Text>
        </View>

        <View style={styles.infoCard}>
          <IconSymbol name="info.circle.fill" size={24} color={colors.primary} />
          <Text style={styles.infoText}>
            Withdraw your Maxcoin MXI to Binance. All withdrawals are processed through secure blockchain transactions.
          </Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Select Platform</Text>
          <View style={styles.platformGrid}>
            {platforms.map((platform) => (
              <Pressable
                key={platform.id}
                style={[
                  styles.platformCard,
                  selectedPlatform === platform.id && styles.platformCardSelected,
                  platform.id !== 'binance' && styles.platformCardDisabled,
                ]}
                onPress={() => {
                  if (platform.id === 'binance') {
                    setSelectedPlatform(platform.id);
                    if (user.withdrawalAddresses && user.withdrawalAddresses[platform.id]) {
                      setWithdrawalAddress(user.withdrawalAddresses[platform.id] || '');
                    } else {
                      setWithdrawalAddress('');
                    }
                  } else {
                    Alert.alert('Coming Soon', 'This platform will be available soon.');
                  }
                }}
              >
                <IconSymbol 
                  name={platform.icon} 
                  size={32} 
                  color={selectedPlatform === platform.id ? platform.color : colors.textSecondary} 
                />
                <Text style={[
                  styles.platformName,
                  selectedPlatform === platform.id && { color: platform.color }
                ]}>
                  {platform.name}
                </Text>
                {platform.id !== 'binance' && (
                  <Text style={styles.comingSoon}>Soon</Text>
                )}
                {selectedPlatform === platform.id && (
                  <View style={styles.selectedBadge}>
                    <IconSymbol name="checkmark.circle.fill" size={20} color={colors.success} />
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>{user.balance.toFixed(6)} MXI</Text>
          {mxiRate && (
            <Text style={styles.balanceUSD}>
              ≈ ${convertMXIToUSD(user.balance).toFixed(2)} USD
            </Text>
          )}
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Withdrawal Amount</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
              placeholder="0.000000"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
            />
            <Text style={styles.currency}>MXI</Text>
          </View>
          {amount > 0 && mxiRate && (
            <Text style={styles.helperText}>
              ≈ ${usdValue.toFixed(2)} USD at current rate
            </Text>
          )}
          <Text style={styles.helperText}>Minimum withdrawal: 0.1 MXI</Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>
            {platforms.find(p => p.id === selectedPlatform)?.name} Wallet Address (BSC Network)
          </Text>
          <TextInput
            style={[styles.input, styles.addressInput]}
            value={withdrawalAddress}
            onChangeText={setWithdrawalAddress}
            placeholder={`Enter your ${platforms.find(p => p.id === selectedPlatform)?.name} BSC wallet address`}
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={3}
          />
          <Text style={styles.helperText}>
            Make sure this address is correct. Transactions cannot be reversed.
          </Text>
        </View>

        {amount > 0 && (
          <View style={styles.feeCard}>
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Withdrawal Amount</Text>
              <Text style={styles.feeValue}>{amount.toFixed(6)} MXI</Text>
            </View>
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Network Fee</Text>
              <Text style={styles.feeValue}>{networkFee.toFixed(6)} MXI</Text>
            </View>
            {mxiRate && (
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>USD Value</Text>
                <Text style={styles.feeValue}>${usdValue.toFixed(2)}</Text>
              </View>
            )}
            <View style={styles.divider} />
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>You will receive</Text>
              <Text style={styles.feeValueBold}>
                {finalAmount.toFixed(6)} MXI
              </Text>
            </View>
            {mxiRate && (
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Final USD Value</Text>
                <Text style={styles.feeValueBold}>
                  ${convertMXIToUSD(finalAmount).toFixed(2)}
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.buttonGroup}>
          <Pressable 
            style={[
              styles.button, 
              styles.primaryButton,
              (isProcessing || amount <= 0 || !withdrawalAddress.trim() || selectedPlatform !== 'binance') && styles.buttonDisabled
            ]}
            onPress={handleWithdraw}
            disabled={isProcessing || amount <= 0 || !withdrawalAddress.trim() || selectedPlatform !== 'binance'}
          >
            {isProcessing ? (
              <Text style={styles.buttonText}>Processing...</Text>
            ) : (
              <>
                <IconSymbol name="arrow.up.circle.fill" size={20} color="#ffffff" />
                <Text style={styles.buttonText}>Confirm Withdrawal</Text>
              </>
            )}
          </Pressable>

          <Pressable 
            style={[styles.button, styles.secondaryButton]}
            onPress={() => router.back()}
            disabled={isProcessing}
          >
            <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
          </Pressable>
        </View>

        <View style={styles.securityNotice}>
          <IconSymbol name="lock.shield.fill" size={20} color={colors.success} />
          <Text style={styles.securityText}>
            Your transaction is secured with blockchain technology. All withdrawals are processed within 24-48 hours.
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
  header: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.highlight,
  },
  grabber: {
    width: 40,
    height: 4,
    backgroundColor: colors.textSecondary,
    borderRadius: 2,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  identifierCard: {
    backgroundColor: colors.highlight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.primary + '30',
  },
  identifierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  identifierTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  identifierValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
    fontFamily: 'monospace',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.highlight,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  formSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  platformGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  platformCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.highlight,
    position: 'relative',
  },
  platformCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  platformCardDisabled: {
    opacity: 0.5,
  },
  platformName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginTop: 8,
  },
  comingSoon: {
    fontSize: 10,
    color: colors.warning,
    fontWeight: '600',
    marginTop: 4,
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  balanceCard: {
    backgroundColor: colors.highlight,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 4,
  },
  balanceUSD: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.highlight,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: colors.text,
    paddingVertical: 14,
  },
  addressInput: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.highlight,
    padding: 14,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  currency: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
  },
  helperText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
  },
  feeCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  feeLabel: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  feeValue: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  feeValueBold: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: colors.background,
    marginVertical: 12,
  },
  buttonGroup: {
    gap: 12,
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.highlight,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
  },
  securityText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
