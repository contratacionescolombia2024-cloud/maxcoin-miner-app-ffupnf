
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
import { useAuth } from '@/contexts/AuthContext';
import { useLocalization } from '@/contexts/LocalizationContext';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

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
  const { purchaseMaxcoin, recordFirstPurchase } = useAuth();
  const { t } = useLocalization();
  const params = useLocalSearchParams();
  const amount = parseFloat(params.amount as string) || 0;
  const usdValue = parseFloat(params.usdValue as string) || 0;
  
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [processing, setProcessing] = useState(false);

  const paymentMethods: PaymentMethodOption[] = [
    {
      id: 'binance',
      name: 'Binance Pay',
      icon: 'bitcoinsign.circle.fill',
      description: 'Pay with Binance (Recommended)',
      color: '#F3BA2F',
      available: true,
    },
    {
      id: 'coinbase',
      name: 'Coinbase',
      icon: 'dollarsign.circle.fill',
      description: 'Pay with Coinbase',
      color: '#0052FF',
      available: false,
    },
    {
      id: 'skrill',
      name: 'Skrill',
      icon: 'creditcard.fill',
      description: 'Pay with Skrill',
      color: '#862165',
      available: false,
    },
    {
      id: 'paypal',
      name: 'PayPal',
      icon: 'p.circle.fill',
      description: 'Pay with PayPal',
      color: '#003087',
      available: false,
    },
  ];

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    if (!paymentMethods.find(m => m.id === method)?.available) {
      Alert.alert('Coming Soon', 'This payment method will be available soon.');
      return;
    }
    setSelectedMethod(method);
  };

  const handleProceedToPayment = async () => {
    if (!selectedMethod) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

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
    setProcessing(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Complete the purchase
      await purchaseMaxcoin(amount);
      
      // Record first purchase if it's at least 100 USDT
      await recordFirstPurchase(usdValue);
      
      Alert.alert(
        'Success',
        `Successfully purchased ${amount.toFixed(6)} MXI!${usdValue >= 100 ? '\n\nCongratulations! You have unlocked Mining and Lottery features!' : ''}`,
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)/(home)'),
          },
        ]
      );
    } catch (error) {
      console.error('Error processing payment:', error);
      Alert.alert('Error', 'Payment processing failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const processCoinbasePayment = async () => {
    Alert.alert('Coming Soon', 'Coinbase integration will be available soon.');
  };

  const processSkrillPayment = async () => {
    Alert.alert('Coming Soon', 'Skrill integration will be available soon.');
  };

  const processPayPalPayment = async () => {
    Alert.alert('Coming Soon', 'PayPal integration will be available soon.');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Payment Method</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Purchase Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Purchase Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Amount (MXI):</Text>
            <Text style={styles.summaryValue}>{amount.toFixed(6)} MXI</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total (USD):</Text>
            <Text style={styles.summaryValue}>${usdValue.toFixed(2)}</Text>
          </View>
          
          {usdValue >= 100 && (
            <View style={styles.unlockNotice}>
              <IconSymbol name="star.fill" size={20} color="#FFD700" />
              <Text style={styles.unlockNoticeText}>
                This purchase will unlock Mining and Lottery features!
              </Text>
            </View>
          )}
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Payment Method</Text>
          
          {paymentMethods.map((method) => (
            <Pressable
              key={method.id}
              style={[
                styles.methodCard,
                selectedMethod === method.id && styles.methodCardSelected,
                !method.available && styles.methodCardDisabled,
              ]}
              onPress={() => handlePaymentMethodSelect(method.id)}
              disabled={!method.available}
            >
              <View style={styles.methodIcon}>
                <IconSymbol name={method.icon} size={32} color={method.color} />
              </View>
              
              <View style={styles.methodInfo}>
                <Text style={styles.methodName}>{method.name}</Text>
                <Text style={styles.methodDescription}>{method.description}</Text>
                {!method.available && (
                  <Text style={styles.comingSoon}>Coming Soon</Text>
                )}
              </View>
              
              {selectedMethod === method.id && (
                <IconSymbol name="checkmark.circle.fill" size={24} color={colors.success} />
              )}
            </Pressable>
          ))}
        </View>

        {/* Important Notes */}
        <View style={styles.notesCard}>
          <Text style={styles.notesTitle}>Important Notes:</Text>
          <Text style={styles.noteText}>
            • Only Binance integration is currently available
          </Text>
          <Text style={styles.noteText}>
            • Purchased MXI can be withdrawn immediately
          </Text>
          <Text style={styles.noteText}>
            • Referral commissions are distributed automatically
          </Text>
          <Text style={styles.noteText}>
            • First purchase of 100 USDT unlocks Mining and Lottery
          </Text>
        </View>

        {/* Proceed Button */}
        <Pressable
          style={[
            styles.proceedButton,
            (!selectedMethod || processing) && styles.proceedButtonDisabled,
          ]}
          onPress={handleProceedToPayment}
          disabled={!selectedMethod || processing}
        >
          {processing ? (
            <Text style={styles.proceedButtonText}>Processing...</Text>
          ) : (
            <>
              <IconSymbol name="arrow.right.circle.fill" size={20} color={colors.background} />
              <Text style={styles.proceedButtonText}>Proceed to Payment</Text>
            </>
          )}
        </Pressable>

        <View style={{ height: 100 }} />
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
  backButton: {
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
  summaryCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  unlockNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  unlockNoticeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 12,
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  methodCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  methodCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.background,
  },
  methodCardDisabled: {
    opacity: 0.5,
  },
  methodIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  methodDescription: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  comingSoon: {
    fontSize: 12,
    color: colors.warning,
    fontWeight: '600',
    marginTop: 4,
  },
  notesCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notesTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  noteText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  proceedButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proceedButtonDisabled: {
    backgroundColor: colors.textSecondary,
    opacity: 0.5,
  },
  proceedButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});
