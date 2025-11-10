
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

export default function MiningAccessPurchaseScreen() {
  const { user } = useAuth();
  const { purchaseMiningAccess, renewMiningAccess, getMiningAccessCost } = useMiningAccess();
  const { mxiPrice } = useBinance();
  const params = useLocalSearchParams();
  const isRenewal = params.renewal === 'true';
  
  const [processing, setProcessing] = useState(false);

  const accessCost = getMiningAccessCost();
  const mxiEquivalent = mxiPrice > 0 ? accessCost / mxiPrice : 0;

  const handlePurchase = async () => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    Alert.alert(
      'Confirm Purchase',
      `You are about to ${isRenewal ? 'renew' : 'purchase'} mining access for ${accessCost} USDT via Binance Pay.\n\nDuration: 30 days\n\nProceed with payment?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setProcessing(true);

            try {
              // Simulate Binance payment processing
              await new Promise(resolve => setTimeout(resolve, 2000));

              let result;
              if (isRenewal) {
                result = await renewMiningAccess(user.id);
              } else {
                result = await purchaseMiningAccess(user.id, 'binance');
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
          },
        },
      ]
    );
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
          <View style={styles.iconContainer}>
            <IconSymbol name="lock.shield.fill" size={64} color={colors.primary} />
          </View>
          
          <Text style={styles.summaryTitle}>
            {isRenewal ? 'Renewal Summary' : 'Initial Mining Package'}
          </Text>
          
          <View style={styles.costDisplay}>
            <Text style={styles.costAmount}>{accessCost} USDT</Text>
            <Text style={styles.costEquivalent}>≈ {mxiEquivalent.toFixed(2)} MXI</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <IconSymbol name="calendar" size={20} color={colors.accent} />
            <Text style={styles.detailLabel}>Duration:</Text>
            <Text style={styles.detailValue}>30 Days</Text>
          </View>

          <View style={styles.detailRow}>
            <IconSymbol name="bitcoinsign.circle.fill" size={20} color="#F3BA2F" />
            <Text style={styles.detailLabel}>Payment Method:</Text>
            <Text style={styles.detailValue}>Binance Pay</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.benefitsBox}>
            <Text style={styles.benefitsTitle}>Package Benefits:</Text>
            <View style={styles.benefitItem}>
              <IconSymbol name="checkmark.circle.fill" size={18} color={colors.success} />
              <Text style={styles.benefitText}>Earn MXI through mining (0.00002 MXI/min base rate)</Text>
            </View>
            <View style={styles.benefitItem}>
              <IconSymbol name="checkmark.circle.fill" size={18} color={colors.success} />
              <Text style={styles.benefitText}>Increase mining power with USDT purchases</Text>
            </View>
            <View style={styles.benefitItem}>
              <IconSymbol name="checkmark.circle.fill" size={18} color={colors.success} />
              <Text style={styles.benefitText}>Earn referral commissions (3-level system)</Text>
            </View>
            <View style={styles.benefitItem}>
              <IconSymbol name="checkmark.circle.fill" size={18} color={colors.success} />
              <Text style={styles.benefitText}>Access to withdrawal system</Text>
            </View>
            <View style={styles.benefitItem}>
              <IconSymbol name="checkmark.circle.fill" size={18} color={colors.success} />
              <Text style={styles.benefitText}>30-day mining power rental</Text>
            </View>
          </View>
        </View>

        {/* Payment Method Card */}
        <View style={styles.paymentCard}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          
          <View style={styles.methodCard}>
            <View style={styles.methodIcon}>
              <IconSymbol name="bitcoinsign.circle.fill" size={40} color="#F3BA2F" />
            </View>
            
            <View style={styles.methodInfo}>
              <Text style={styles.methodName}>Binance Pay</Text>
              <Text style={styles.methodDescription}>Secure cryptocurrency payment via Binance</Text>
              <View style={styles.recommendedBadge}>
                <Text style={styles.recommendedText}>ONLY AVAILABLE METHOD</Text>
              </View>
            </View>
            
            <IconSymbol name="checkmark.circle.fill" size={28} color={colors.success} />
          </View>
        </View>

        {/* Important Notes */}
        <View style={styles.notesCard}>
          <View style={styles.notesHeader}>
            <IconSymbol name="info.circle.fill" size={24} color={colors.warning} />
            <Text style={styles.notesTitle}>Important Information</Text>
          </View>
          
          <Text style={styles.noteText}>
            • Initial package cost is 100 USDT (paid via Binance)
          </Text>
          <Text style={styles.noteText}>
            • Mining access is valid for 30 days from purchase date
          </Text>
          <Text style={styles.noteText}>
            • You can renew your access before it expires
          </Text>
          <Text style={styles.noteText}>
            • Mining power increases with additional USDT purchases
          </Text>
          <Text style={styles.noteText}>
            • All payments are processed through Binance Pay
          </Text>
          <Text style={styles.noteText}>
            • Commissions are paid at current MXI/USDT exchange rate
          </Text>
        </View>

        {/* Purchase Button */}
        <Pressable
          style={[
            styles.purchaseButton,
            processing && styles.purchaseButtonDisabled,
          ]}
          onPress={handlePurchase}
          disabled={processing}
        >
          {processing ? (
            <>
              <IconSymbol name="hourglass" size={20} color={colors.background} />
              <Text style={styles.purchaseButtonText}>Processing Payment...</Text>
            </>
          ) : (
            <>
              <IconSymbol name="lock.shield.fill" size={20} color={colors.background} />
              <Text style={styles.purchaseButtonText}>
                {isRenewal ? `Renew for ${accessCost} USDT` : `Purchase for ${accessCost} USDT`}
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
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  costDisplay: {
    alignItems: 'center',
    marginBottom: 20,
  },
  costAmount: {
    fontSize: 48,
    fontWeight: '900',
    color: colors.primary,
    marginBottom: 8,
  },
  costEquivalent: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    width: '100%',
    marginVertical: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
    gap: 12,
  },
  detailLabel: {
    fontSize: 15,
    color: colors.textSecondary,
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  benefitsBox: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 20,
    width: '100%',
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  benefitText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
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
  },
  methodIcon: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
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
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  recommendedBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  recommendedText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.background,
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
  purchaseButton: {
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
  purchaseButtonDisabled: {
    backgroundColor: colors.textSecondary,
    opacity: 0.5,
  },
  purchaseButtonText: {
    color: colors.background,
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 10,
  },
});
