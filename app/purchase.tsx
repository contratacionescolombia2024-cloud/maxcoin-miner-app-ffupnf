
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ScrollView,
  TextInput,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useMiningConfig } from '@/contexts/MiningConfigContext';
import { useLocalization } from '@/contexts/LocalizationContext';

export default function PurchaseScreen() {
  const { amount: paramAmount } = useLocalSearchParams<{ amount: string }>();
  const { user } = useAuth();
  const { config } = useMiningConfig();
  const { t } = useLocalization();
  const [customAmount, setCustomAmount] = useState(paramAmount || '1');
  const [error, setError] = useState('');

  const purchaseAmount = parseFloat(customAmount || '1');
  const minAmount = 1;
  const maxAmount = 10000;
  const isValidAmount = purchaseAmount >= minAmount && purchaseAmount <= maxAmount;
  
  // Calculate mining power increase: 1% per 10 USDT
  const miningPowerIncrease = (purchaseAmount / 10) * 0.01;
  const newMiningPower = (user?.miningPower || 1) + miningPowerIncrease;

  const handleAmountChange = (text: string) => {
    setCustomAmount(text);
    const amount = parseFloat(text);
    
    if (isNaN(amount)) {
      setError(`Please enter a valid amount between ${minAmount} and ${maxAmount} USDT`);
    } else if (amount < minAmount) {
      setError(`Minimum purchase is ${minAmount} USDT`);
    } else if (amount > maxAmount) {
      setError(`Maximum purchase is ${maxAmount} USDT`);
    } else {
      setError('');
    }
  };

  const handleProceedToPayment = () => {
    if (!isValidAmount) {
      Alert.alert('Invalid Amount', error || `Please enter an amount between ${minAmount} and ${maxAmount} USDT`);
      return;
    }

    console.log('Proceeding to payment with amount:', purchaseAmount);

    // Navigate to payment methods screen with both amount and usdValue
    router.push({
      pathname: '/payment-methods',
      params: { 
        amount: purchaseAmount.toString(),
        usdValue: purchaseAmount.toString() // Pass USDT value
      },
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <IconSymbol name="cart.fill" size={80} color={colors.primary} />
          <Text style={styles.title}>Purchase Mining Power</Text>
          <Text style={styles.subtitle}>Boost your mining rate for 30 days</Text>
        </View>

        {/* Custom Amount Input */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Enter Amount in USDT</Text>
          <Text style={styles.cardSubtitle}>
            Minimum: {minAmount} USDT • Maximum: {maxAmount} USDT
          </Text>

          <View style={styles.inputContainer}>
            <IconSymbol name="dollarsign.circle.fill" size={24} color={colors.primary} />
            <TextInput
              style={styles.input}
              value={customAmount}
              onChangeText={handleAmountChange}
              placeholder={`Enter amount (${minAmount}-${maxAmount} USDT)`}
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />
            <Text style={styles.inputSuffix}>USDT</Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <IconSymbol name="exclamationmark.triangle.fill" size={20} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Quick Amount Buttons - Updated to USDT values */}
          <View style={styles.quickAmountContainer}>
            <Text style={styles.quickAmountLabel}>Quick Select (USDT)</Text>
            <View style={styles.quickAmountButtons}>
              <Pressable
                style={styles.quickAmountButton}
                onPress={() => handleAmountChange('1')}
              >
                <Text style={styles.quickAmountText}>1</Text>
              </Pressable>
              <Pressable
                style={styles.quickAmountButton}
                onPress={() => handleAmountChange('5')}
              >
                <Text style={styles.quickAmountText}>5</Text>
              </Pressable>
              <Pressable
                style={styles.quickAmountButton}
                onPress={() => handleAmountChange('10')}
              >
                <Text style={styles.quickAmountText}>10</Text>
              </Pressable>
              <Pressable
                style={styles.quickAmountButton}
                onPress={() => handleAmountChange('100')}
              >
                <Text style={styles.quickAmountText}>100</Text>
              </Pressable>
              <Pressable
                style={styles.quickAmountButton}
                onPress={() => handleAmountChange('1000')}
              >
                <Text style={styles.quickAmountText}>1000</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Purchase Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Purchase Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount:</Text>
            <Text style={styles.detailValue}>{purchaseAmount.toFixed(2)} USDT</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Current Mining Power:</Text>
            <Text style={styles.detailValue}>{(user?.miningPower || 1).toFixed(4)}x</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Power Increase:</Text>
            <Text style={[styles.detailValue, { color: colors.success }]}>
              +{miningPowerIncrease.toFixed(4)}x
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabelBold}>New Mining Power:</Text>
            <Text style={styles.detailValueBold}>{newMiningPower.toFixed(4)}x</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Valid For:</Text>
            <Text style={[styles.detailValue, { color: colors.primary }]}>30 Days</Text>
          </View>

          <View style={styles.infoBox}>
            <IconSymbol name="info.circle.fill" size={20} color={colors.primary} />
            <Text style={styles.infoText}>
              Mining power increases by 1% for every 10 USDT spent. This boost is valid for 30 days from purchase date.
            </Text>
          </View>
        </View>

        {/* Referral Bonuses */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Referral Bonuses</Text>
          <Text style={styles.cardSubtitle}>
            Your referrers will receive these commissions in MXI
          </Text>

          <View style={styles.bonusItem}>
            <IconSymbol name="person.fill" size={24} color={colors.primary} />
            <View style={styles.bonusInfo}>
              <Text style={styles.bonusLabel}>Level 1 Referrer (Direct)</Text>
              <Text style={styles.bonusValue}>
                {config.level1Commission}% commission
              </Text>
            </View>
          </View>

          <View style={styles.bonusItem}>
            <IconSymbol name="person.2.fill" size={24} color={colors.secondary} />
            <View style={styles.bonusInfo}>
              <Text style={styles.bonusLabel}>Level 2 Referrer</Text>
              <Text style={styles.bonusValue}>
                {config.level2Commission}% commission
              </Text>
            </View>
          </View>

          <View style={styles.bonusItem}>
            <IconSymbol name="person.3.fill" size={24} color={colors.accent} />
            <View style={styles.bonusInfo}>
              <Text style={styles.bonusLabel}>Level 3 Referrer</Text>
              <Text style={styles.bonusValue}>
                {config.level3Commission}% commission
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.paymentMethodsCard}>
          <IconSymbol name="creditcard.fill" size={24} color={colors.primary} />
          <View style={styles.paymentMethodsInfo}>
            <Text style={styles.paymentMethodsTitle}>Payment via Binance Pay</Text>
            <Text style={styles.paymentMethodsText}>
              Secure USDT payment through Binance Pay. Your mining power boost will be active for 30 days.
            </Text>
          </View>
        </View>

        {!user?.unlockPaymentMade && (
          <View style={styles.unlockWarning}>
            <IconSymbol name="lock.fill" size={20} color={colors.warning} />
            <Text style={styles.unlockWarningText}>
              Note: This purchase boosts mining power, but you need to make the 100 USDT unlock payment separately to access Mining and Lottery features.
            </Text>
          </View>
        )}

        <View style={styles.durationWarning}>
          <IconSymbol name="clock.fill" size={20} color={colors.warning} />
          <Text style={styles.durationWarningText}>
            Important: Mining power purchases are valid for 30 days. After 30 days, you can renew or purchase additional power.
          </Text>
        </View>

        <View style={styles.buttonGroup}>
          <Pressable
            style={[styles.button, styles.primaryButton, !isValidAmount && styles.buttonDisabled]}
            onPress={handleProceedToPayment}
            disabled={!isValidAmount}
          >
            <IconSymbol name="arrow.right.circle.fill" size={20} color="#ffffff" />
            <Text style={styles.buttonText}>
              Proceed to Payment
            </Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.secondaryButton]}
            onPress={() => router.back()}
          >
            <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 8,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  inputSuffix: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffe6e6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: colors.danger,
    fontWeight: '500',
  },
  quickAmountContainer: {
    marginTop: 8,
  },
  quickAmountLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  quickAmountButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickAmountButton: {
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  detailLabelBold: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  detailValueBold: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.background,
    marginVertical: 8,
  },
  bonusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  bonusInfo: {
    flex: 1,
  },
  bonusLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  bonusValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.success,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.highlight,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  paymentMethodsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.highlight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  paymentMethodsInfo: {
    flex: 1,
  },
  paymentMethodsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  paymentMethodsText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  unlockWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  unlockWarningText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    fontWeight: '500',
  },
  durationWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
    borderWidth: 2,
    borderColor: colors.warning,
  },
  durationWarningText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    fontWeight: '500',
  },
  buttonGroup: {
    gap: 12,
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
    borderColor: colors.textSecondary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
