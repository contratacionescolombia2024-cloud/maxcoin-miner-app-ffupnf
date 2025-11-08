
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
  const [customAmount, setCustomAmount] = useState(paramAmount || '10');
  const [error, setError] = useState('');

  const purchaseAmount = parseFloat(customAmount || '10');
  const isValidAmount = purchaseAmount >= config.minPurchase && purchaseAmount <= config.maxPurchase;
  
  // Calculate mining power increase based on config
  const miningPowerIncrease = (purchaseAmount / config.powerIncreaseThreshold) * (config.powerIncreasePercent / 100);
  const newMiningPower = (user?.miningPower || 1) + miningPowerIncrease;

  const handleAmountChange = (text: string) => {
    setCustomAmount(text);
    const amount = parseFloat(text);
    
    if (isNaN(amount)) {
      setError(t('purchase.invalidAmountMessage', { min: config.minPurchase, max: config.maxPurchase }));
    } else if (amount < config.minPurchase) {
      setError(t('purchase.minimumPurchaseError', { min: config.minPurchase }));
    } else if (amount > config.maxPurchase) {
      setError(t('purchase.maximumPurchaseError', { max: config.maxPurchase }));
    } else {
      setError('');
    }
  };

  const handleProceedToPayment = () => {
    if (!isValidAmount) {
      Alert.alert(t('purchase.invalidAmount'), error || t('purchase.invalidAmountMessage', { min: config.minPurchase, max: config.maxPurchase }));
      return;
    }

    // Navigate to payment methods screen
    router.push({
      pathname: '/payment-methods',
      params: { amount: purchaseAmount.toString() },
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <IconSymbol name="cart.fill" size={80} color={colors.primary} />
          <Text style={styles.title}>{t('purchase.title')}</Text>
        </View>

        {/* Custom Amount Input */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('purchase.enterAmount')}</Text>
          <Text style={styles.cardSubtitle}>
            {t('purchase.minMaxInfo', { min: config.minPurchase, max: config.maxPurchase })}
          </Text>

          <View style={styles.inputContainer}>
            <IconSymbol name="bitcoinsign.circle.fill" size={24} color={colors.primary} />
            <TextInput
              style={styles.input}
              value={customAmount}
              onChangeText={handleAmountChange}
              placeholder={t('purchase.enterAmountPlaceholder', { min: config.minPurchase, max: config.maxPurchase })}
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />
            <Text style={styles.inputSuffix}>MXI</Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <IconSymbol name="exclamationmark.triangle.fill" size={20} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Quick Amount Buttons */}
          <View style={styles.quickAmountContainer}>
            <Text style={styles.quickAmountLabel}>{t('purchase.quickSelect')}</Text>
            <View style={styles.quickAmountButtons}>
              <Pressable
                style={styles.quickAmountButton}
                onPress={() => handleAmountChange('10')}
              >
                <Text style={styles.quickAmountText}>10</Text>
              </Pressable>
              <Pressable
                style={styles.quickAmountButton}
                onPress={() => handleAmountChange('50')}
              >
                <Text style={styles.quickAmountText}>50</Text>
              </Pressable>
              <Pressable
                style={styles.quickAmountButton}
                onPress={() => handleAmountChange('100')}
              >
                <Text style={styles.quickAmountText}>100</Text>
              </Pressable>
              <Pressable
                style={styles.quickAmountButton}
                onPress={() => handleAmountChange('500')}
              >
                <Text style={styles.quickAmountText}>500</Text>
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
          <Text style={styles.cardTitle}>{t('purchase.purchaseDetails')}</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('purchase.amount')}</Text>
            <Text style={styles.detailValue}>{purchaseAmount.toFixed(2)} MXI</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('purchase.currentPower')}</Text>
            <Text style={styles.detailValue}>{(user?.miningPower || 1).toFixed(2)}x</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('purchase.powerIncrease')}</Text>
            <Text style={[styles.detailValue, { color: colors.success }]}>
              +{miningPowerIncrease.toFixed(2)}x
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabelBold}>{t('purchase.newPower')}</Text>
            <Text style={styles.detailValueBold}>{newMiningPower.toFixed(2)}x</Text>
          </View>

          <View style={styles.infoBox}>
            <IconSymbol name="info.circle.fill" size={20} color={colors.primary} />
            <Text style={styles.infoText}>
              {t('purchase.powerIncreaseInfo', { percent: config.powerIncreasePercent, threshold: config.powerIncreaseThreshold })}
            </Text>
          </View>
        </View>

        {/* Referral Bonuses */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('purchase.referralBonuses')}</Text>
          <Text style={styles.cardSubtitle}>
            {t('purchase.referralBonusesInfo')}
          </Text>

          <View style={styles.bonusItem}>
            <IconSymbol name="person.fill" size={24} color={colors.primary} />
            <View style={styles.bonusInfo}>
              <Text style={styles.bonusLabel}>{t('purchase.level1Referrer')}</Text>
              <Text style={styles.bonusValue}>
                +{(purchaseAmount * (config.level1Commission / 100)).toFixed(4)} MXI ({config.level1Commission}%)
              </Text>
            </View>
          </View>

          <View style={styles.bonusItem}>
            <IconSymbol name="person.2.fill" size={24} color={colors.secondary} />
            <View style={styles.bonusInfo}>
              <Text style={styles.bonusLabel}>{t('purchase.level2Referrer')}</Text>
              <Text style={styles.bonusValue}>
                +{(purchaseAmount * (config.level2Commission / 100)).toFixed(4)} MXI ({config.level2Commission}%)
              </Text>
            </View>
          </View>

          <View style={styles.bonusItem}>
            <IconSymbol name="person.3.fill" size={24} color={colors.accent} />
            <View style={styles.bonusInfo}>
              <Text style={styles.bonusLabel}>{t('purchase.level3Referrer')}</Text>
              <Text style={styles.bonusValue}>
                +{(purchaseAmount * (config.level3Commission / 100)).toFixed(4)} MXI ({config.level3Commission}%)
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.paymentMethodsCard}>
          <IconSymbol name="creditcard.fill" size={24} color={colors.primary} />
          <View style={styles.paymentMethodsInfo}>
            <Text style={styles.paymentMethodsTitle}>{t('purchase.multiplePaymentMethods')}</Text>
            <Text style={styles.paymentMethodsText}>
              {t('purchase.paymentMethodsDescription')}
            </Text>
          </View>
        </View>

        <View style={styles.buttonGroup}>
          <Pressable
            style={[styles.button, styles.primaryButton, !isValidAmount && styles.buttonDisabled]}
            onPress={handleProceedToPayment}
            disabled={!isValidAmount}
          >
            <IconSymbol name="arrow.right.circle.fill" size={20} color="#ffffff" />
            <Text style={styles.buttonText}>
              {t('purchase.proceedToPayment')}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.secondaryButton]}
            onPress={() => router.back()}
          >
            <Text style={[styles.buttonText, { color: colors.text }]}>{t('common.cancel')}</Text>
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
    paddingHorizontal: 16,
    paddingVertical: 10,
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
    marginBottom: 24,
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
