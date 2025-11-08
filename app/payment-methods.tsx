
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Linking,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalization } from '@/contexts/LocalizationContext';

type PaymentMethod = 'binance' | 'coinbase' | 'skrill' | 'paypal';

interface PaymentMethodOption {
  id: PaymentMethod;
  name: string;
  icon: string;
  description: string;
  color: string;
  available: boolean;
}

export default function PaymentMethodsScreen() {
  const { amount } = useLocalSearchParams<{ amount: string }>();
  const { user, purchaseMaxcoin } = useAuth();
  const { t } = useLocalization();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const purchaseAmount = parseFloat(amount || '10');

  const paymentMethods: PaymentMethodOption[] = [
    {
      id: 'binance',
      name: 'Binance Pay',
      icon: 'bitcoinsign.circle.fill',
      description: t('payment.binanceDescription'),
      color: '#F3BA2F',
      available: true,
    },
    {
      id: 'coinbase',
      name: 'Coinbase Commerce',
      icon: 'dollarsign.circle.fill',
      description: t('payment.coinbaseDescription'),
      color: '#0052FF',
      available: true,
    },
    {
      id: 'skrill',
      name: 'Skrill',
      icon: 'creditcard.fill',
      description: t('payment.skrillDescription'),
      color: '#862165',
      available: true,
    },
    {
      id: 'paypal',
      name: 'PayPal',
      icon: 'dollarsign.square.fill',
      description: t('payment.paypalDescription'),
      color: '#0070BA',
      available: true,
    },
  ];

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
  };

  const handleProceedToPayment = async () => {
    if (!selectedMethod) {
      Alert.alert(t('common.error'), t('payment.selectMethodError'));
      return;
    }

    setIsProcessing(true);

    // Simulate payment processing based on selected method
    switch (selectedMethod) {
      case 'binance':
        await processBinancePayment();
        break;
      case 'coinbase':
        await processCoinbasePayment();
        break;
      case 'skrill':
        await processSkrillPayment();
        break;
      case 'paypal':
        await processPayPalPayment();
        break;
    }
  };

  const processBinancePayment = async () => {
    // In production, this would:
    // 1. Create a Binance Pay order via API
    // 2. Get the payment URL
    // 3. Open the URL in browser or WebView
    // 4. Handle the callback/webhook
    
    console.log('Processing Binance Pay payment for', purchaseAmount, 'MXI');
    
    // Simulate API call
    setTimeout(async () => {
      // Simulate successful payment
      await purchaseMaxcoin(purchaseAmount);
      setIsProcessing(false);
      
      Alert.alert(
        t('payment.paymentSuccess'),
        t('payment.binanceSuccessMessage', { amount: purchaseAmount.toFixed(2) }),
        [
          {
            text: t('common.ok'),
            onPress: () => router.replace('/(tabs)/(home)'),
          },
        ]
      );
    }, 2000);
  };

  const processCoinbasePayment = async () => {
    // In production, this would:
    // 1. Create a Coinbase Commerce charge via API
    // 2. Get the hosted checkout URL
    // 3. Open the URL in browser
    // 4. Handle the webhook notification
    
    console.log('Processing Coinbase Commerce payment for', purchaseAmount, 'MXI');
    
    // Simulate API call
    setTimeout(async () => {
      // Simulate successful payment
      await purchaseMaxcoin(purchaseAmount);
      setIsProcessing(false);
      
      Alert.alert(
        t('payment.paymentSuccess'),
        t('payment.coinbaseSuccessMessage', { amount: purchaseAmount.toFixed(2) }),
        [
          {
            text: t('common.ok'),
            onPress: () => router.replace('/(tabs)/(home)'),
          },
        ]
      );
    }, 2000);
  };

  const processSkrillPayment = async () => {
    // In production, this would:
    // 1. Create a Skrill payment session via API
    // 2. Get the payment URL
    // 3. Open the URL in browser or WebView
    // 4. Handle the callback
    
    console.log('Processing Skrill payment for', purchaseAmount, 'MXI');
    
    // Simulate API call
    setTimeout(async () => {
      // Simulate successful payment
      await purchaseMaxcoin(purchaseAmount);
      setIsProcessing(false);
      
      Alert.alert(
        t('payment.paymentSuccess'),
        t('payment.skrillSuccessMessage', { amount: purchaseAmount.toFixed(2) }),
        [
          {
            text: t('common.ok'),
            onPress: () => router.replace('/(tabs)/(home)'),
          },
        ]
      );
    }, 2000);
  };

  const processPayPalPayment = async () => {
    // In production, this would:
    // 1. Create a PayPal order via your backend API
    // 2. Get the approval URL from PayPal
    // 3. Open the URL in browser or WebView using expo-web-browser
    // 4. Handle the return URL callback
    // 5. Capture the payment on your backend
    // 6. Update user balance
    
    console.log('Processing PayPal payment for', purchaseAmount, 'MXI');
    
    // Simulate API call
    setTimeout(async () => {
      // Simulate successful payment
      await purchaseMaxcoin(purchaseAmount);
      setIsProcessing(false);
      
      Alert.alert(
        t('payment.paymentSuccess'),
        t('payment.paypalSuccessMessage', { amount: purchaseAmount.toFixed(2) }),
        [
          {
            text: t('common.ok'),
            onPress: () => router.replace('/(tabs)/(home)'),
          },
        ]
      );
    }, 2000);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <IconSymbol name="creditcard.fill" size={80} color={colors.primary} />
          <Text style={styles.title}>{t('payment.selectPaymentMethod')}</Text>
          <Text style={styles.subtitle}>
            {t('payment.purchasingAmount', { amount: purchaseAmount.toFixed(2) })}
          </Text>
        </View>

        <View style={styles.methodsContainer}>
          <Text style={styles.sectionTitle}>{t('payment.availableMethods')}</Text>
          
          {paymentMethods.map((method) => (
            <Pressable
              key={method.id}
              style={[
                styles.methodCard,
                selectedMethod === method.id && styles.methodCardSelected,
                !method.available && styles.methodCardDisabled,
              ]}
              onPress={() => method.available && handlePaymentMethodSelect(method.id)}
              disabled={!method.available}
            >
              <View style={styles.methodHeader}>
                <View style={[styles.iconContainer, { backgroundColor: method.color + '20' }]}>
                  <IconSymbol name={method.icon} size={32} color={method.color} />
                </View>
                <View style={styles.methodInfo}>
                  <Text style={styles.methodName}>{method.name}</Text>
                  <Text style={styles.methodDescription}>{method.description}</Text>
                </View>
                {selectedMethod === method.id && (
                  <View style={styles.checkmark}>
                    <IconSymbol name="checkmark.circle.fill" size={28} color={colors.success} />
                  </View>
                )}
              </View>
              
              {!method.available && (
                <View style={styles.unavailableBadge}>
                  <Text style={styles.unavailableText}>{t('payment.comingSoon')}</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>

        <View style={styles.infoCard}>
          <IconSymbol name="info.circle.fill" size={24} color={colors.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>{t('payment.securePayment')}</Text>
            <Text style={styles.infoText}>{t('payment.securePaymentDescription')}</Text>
          </View>
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>{t('payment.orderSummary')}</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('payment.amount')}</Text>
            <Text style={styles.detailValue}>{purchaseAmount.toFixed(2)} MXI</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('payment.processingFee')}</Text>
            <Text style={styles.detailValue}>{t('payment.free')}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabelBold}>{t('payment.total')}</Text>
            <Text style={styles.detailValueBold}>{purchaseAmount.toFixed(2)} MXI</Text>
          </View>
        </View>

        <View style={styles.buttonGroup}>
          <Pressable
            style={[
              styles.button,
              styles.primaryButton,
              (!selectedMethod || isProcessing) && styles.buttonDisabled,
            ]}
            onPress={handleProceedToPayment}
            disabled={!selectedMethod || isProcessing}
          >
            <IconSymbol name="checkmark.circle.fill" size={20} color="#ffffff" />
            <Text style={styles.buttonText}>
              {isProcessing ? t('payment.processing') : t('payment.proceedToPayment')}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.secondaryButton]}
            onPress={() => router.back()}
            disabled={isProcessing}
          >
            <Text style={[styles.buttonText, { color: colors.text }]}>
              {t('common.cancel')}
            </Text>
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
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  methodsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  methodCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  methodCardSelected: {
    borderColor: colors.success,
    backgroundColor: colors.highlight,
  },
  methodCardDisabled: {
    opacity: 0.5,
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  methodDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  checkmark: {
    marginLeft: 8,
  },
  unavailableBadge: {
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.textSecondary + '20',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  unavailableText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.highlight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  detailsCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
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
    marginVertical: 12,
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
