
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useMiningAccess } from '@/contexts/MiningAccessContext';
import { useBinance } from '@/contexts/BinanceContext';
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

export default function MiningAccessPurchaseScreen() {
  const { user } = useAuth();
  const { purchaseMiningAccess, renewMiningAccess, getMiningAccessCost } = useMiningAccess();
  const { mxiPrice } = useBinance();
  const params = useLocalSearchParams();
  const isRenewal = params.renewal === 'true';
  
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [processing, setProcessing] = useState(false);

  const accessCost = getMiningAccessCost();
  const mxiEquivalent = mxiPrice > 0 ? accessCost / mxiPrice : 0;

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

  const handlePurchase = async () => {
    if (!selectedMethod) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setProcessing(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      let result;
      if (isRenewal) {
        result = await renewMiningAccess(user.id);
      } else {
        result = await purchaseMiningAccess(user.id, selectedMethod);
      }

      if (result.success) {
        Alert.alert(
          'Success',
          isRenewal 
            ? 'Mining access renewed successfully! Your access has been extended for 30 days.'
            : 'Mining access purchased successfully! You can now start mining MXI.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/mining-panel'),
            },
          ]
        );
      } else {
        Alert.alert('Error', result.message || 'Purchase failed');
      }
    } catch (error) {
      console.error('Error purchasing mining access:', error);
      Alert.alert('Error', 'Failed to process payment');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {isRenewal ? 'Renew Mining Access' : 'Purchase Mining Access'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Purchase Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>
            {isRenewal ? 'Renewal Summary' : 'Purchase Summary'}
          </Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Duration:</Text>
            <Text style={styles.summaryValue}>30 Days</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Cost (USDT):</Text>
            <Text style={styles.summaryValue}>{accessCost} USDT</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Cost (MXI):</Text>
            <Text style={styles.summaryValue}>≈ {mxiEquivalent.toFixed(2)} MXI</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.benefitsBox}>
            <Text style={styles.benefitsTitle}>Benefits:</Text>
            <Text style={styles.benefitText}>✓ Earn MXI through mining</Text>
            <Text style={styles.benefitText}>✓ Increase mining power with purchases</Text>
            <Text style={styles.benefitText}>✓ Earn referral commissions</Text>
            <Text style={styles.benefitText}>✓ Access to withdrawal system</Text>
          </View>
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
              onPress={() => method.available && setSelectedMethod(method.id)}
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
            • Mining access is valid for 30 days from purchase date
          </Text>
          <Text style={styles.noteText}>
            • You can renew your access before it expires
          </Text>
          <Text style={styles.noteText}>
            • Commissions are paid at MXI/USDT exchange rate
          </Text>
          <Text style={styles.noteText}>
            • Only Binance integration is currently available
          </Text>
          <Text style={styles.noteText}>
            • Initial package cost is 100 USDT
          </Text>
        </View>

        {/* Purchase Button */}
        <Pressable
          style={[
            styles.purchaseButton,
            (!selectedMethod || processing) && styles.purchaseButtonDisabled,
          ]}
          onPress={handlePurchase}
          disabled={!selectedMethod || processing}
        >
          {processing ? (
            <Text style={styles.purchaseButtonText}>Processing...</Text>
          ) : (
            <>
              <IconSymbol name="lock.shield.fill" size={20} color={colors.background} />
              <Text style={styles.purchaseButtonText}>
                {isRenewal ? 'Renew Access' : 'Purchase Access'}
              </Text>
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
    fontSize: 18,
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
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  benefitsBox: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
  },
  benefitsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
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
  purchaseButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  purchaseButtonDisabled: {
    backgroundColor: colors.textSecondary,
    opacity: 0.5,
  },
  purchaseButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});
