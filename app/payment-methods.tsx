
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
import { useLocalization } from '@/contexts/LocalizationContext';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

export default function PaymentMethodsScreen() {
  const { purchaseMaxcoin, recordFirstPurchase, user } = useAuth();
  const { t } = useLocalization();
  const params = useLocalSearchParams();
  const amount = parseFloat(params.amount as string) || 0;
  const usdValue = parseFloat(params.usdValue as string) || 0;
  
  const [processing, setProcessing] = useState(false);

  const handleProceedToPayment = async () => {
    Alert.alert(
      'Confirm Purchase',
      `You are about to purchase ${amount.toFixed(6)} MXI for $${usdValue.toFixed(2)} USDT via Binance Pay.\n\nProceed with payment?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            await processBinancePayment();
          },
        },
      ]
    );
  };

  const processBinancePayment = async () => {
    setProcessing(true);
    
    try {
      // Simulate Binance payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Complete the purchase
      await purchaseMaxcoin(amount);
      
      // Record first purchase for referral tracking
      await recordFirstPurchase(usdValue);
      
      let successMessage = `Successfully purchased ${amount.toFixed(6)} MXI!`;
      
      // Check if user still needs to make unlock payment
      if (!user?.unlockPaymentMade) {
        successMessage += '\n\nNote: To access Mining and Lottery features, you need to make the 100 USDT unlock payment separately.';
      }
      
      Alert.alert(
        'Success',
        successMessage,
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
          <View style={styles.iconContainer}>
            <IconSymbol name="cart.fill" size={64} color={colors.accent} />
          </View>
          
          <Text style={styles.summaryTitle}>Purchase Summary</Text>
          
          <View style={styles.amountDisplay}>
            <Text style={styles.amountMXI}>{amount.toFixed(6)} MXI</Text>
            <Text style={styles.amountUSD}>${usdValue.toFixed(2)} USDT</Text>
          </View>
          
          {!user?.unlockPaymentMade && (
            <View style={styles.unlockNotice}>
              <IconSymbol name="info.circle.fill" size={24} color={colors.primary} />
              <Text style={styles.unlockNoticeText}>
                This is a mining power purchase. To unlock Mining and Lottery features, make the 100 USDT unlock payment separately.
              </Text>
            </View>
          )}
        </View>

        {/* Payment Method Card */}
        <View style={styles.paymentCard}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          
          <View style={styles.methodCard}>
            <View style={styles.methodIcon}>
              <IconSymbol name="bitcoinsign.circle.fill" size={48} color="#F3BA2F" />
            </View>
            
            <View style={styles.methodInfo}>
              <Text style={styles.methodName}>Binance Pay</Text>
              <Text style={styles.methodDescription}>
                Secure cryptocurrency payment via Binance
              </Text>
              <View style={styles.onlyMethodBadge}>
                <Text style={styles.onlyMethodText}>ONLY PAYMENT METHOD</Text>
              </View>
            </View>
            
            <IconSymbol name="checkmark.circle.fill" size={32} color={colors.success} />
          </View>

          <View style={styles.infoBox}>
            <IconSymbol name="info.circle.fill" size={20} color={colors.primary} />
            <Text style={styles.infoBoxText}>
              All payments are processed securely through Binance Pay using USDT. This is the only payment method available.
            </Text>
          </View>
        </View>

        {/* Important Notes */}
        <View style={styles.notesCard}>
          <View style={styles.notesHeader}>
            <IconSymbol name="exclamationmark.triangle.fill" size={24} color={colors.warning} />
            <Text style={styles.notesTitle}>Important Information</Text>
          </View>
          
          <Text style={styles.noteText}>
            - Only Binance Pay (USDT) is available for payments
          </Text>
          <Text style={styles.noteText}>
            - Purchased MXI can be withdrawn immediately
          </Text>
          <Text style={styles.noteText}>
            - Referral commissions are distributed automatically
          </Text>
          <Text style={styles.noteText}>
            - This is for mining power purchases only
          </Text>
          <Text style={styles.noteText}>
            - Mining power increases with USDT purchases (1% per 10 USDT)
          </Text>
          <Text style={styles.noteText}>
            - Unlock payment (100 USDT) is separate and required for Mining/Lottery
          </Text>
          <Text style={styles.noteText}>
            - All transactions are recorded in your history
          </Text>
        </View>

        {/* Proceed Button */}
        <Pressable
          style={[
            styles.proceedButton,
            processing && styles.proceedButtonDisabled,
          ]}
          onPress={handleProceedToPayment}
          disabled={processing}
        >
          {processing ? (
            <>
              <IconSymbol name="hourglass" size={20} color={colors.background} />
              <Text style={styles.proceedButtonText}>Processing Payment...</Text>
            </>
          ) : (
            <>
              <IconSymbol name="arrow.right.circle.fill" size={20} color={colors.background} />
              <Text style={styles.proceedButtonText}>Pay ${usdValue.toFixed(2)} USDT</Text>
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
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: colors.accent,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 20,
  },
  amountDisplay: {
    alignItems: 'center',
    marginBottom: 20,
  },
  amountMXI: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 8,
  },
  amountUSD: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
  },
  unlockNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 2,
    borderColor: '#FFD700',
    gap: 12,
  },
  unlockNoticeText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  paymentCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  methodCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.success,
    marginBottom: 16,
  },
  methodIcon: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  methodDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  onlyMethodBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  onlyMethodText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.background,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.highlight,
    borderRadius: 10,
    padding: 14,
    gap: 12,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    lineHeight: 19,
  },
  notesCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  noteText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 8,
  },
  proceedButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  proceedButtonDisabled: {
    backgroundColor: colors.textSecondary,
    opacity: 0.5,
  },
  proceedButtonText: {
    color: colors.background,
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 10,
  },
});
