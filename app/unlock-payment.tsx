
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useBinance } from '@/contexts/BinanceContext';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

const UNLOCK_COST_USDT = 100;

export default function UnlockPaymentScreen() {
  const { user, recordUnlockPayment, purchaseMaxcoin } = useAuth();
  const { mxiPrice } = useBinance();
  const [processing, setProcessing] = useState(false);

  const mxiAmount = UNLOCK_COST_USDT / mxiPrice;

  const handlePurchase = async () => {
    if (!user) {
      Alert.alert('Error', 'Please log in to continue');
      return;
    }

    Alert.alert(
      'Confirm Unlock Payment',
      `You are about to pay ${UNLOCK_COST_USDT} USDT (${mxiAmount.toFixed(6)} MXI) to unlock Mining and Lottery features.\n\nThis is a one-time payment that unlocks all features permanently.\n\nProceed with payment?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            await processUnlockPayment();
          },
        },
      ]
    );
  };

  const processUnlockPayment = async () => {
    setProcessing(true);
    
    try {
      // Simulate Binance payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Add MXI to user balance
      await purchaseMaxcoin(mxiAmount);
      
      // Record the unlock payment
      await recordUnlockPayment();
      
      Alert.alert(
        'Success!',
        `Congratulations! You have successfully unlocked Mining and Lottery features!\n\nYou received ${mxiAmount.toFixed(6)} MXI in your account.\n\nYou can now:\n- Access the Mining Panel\n- Purchase lottery tickets\n- Start earning MXI through mining`,
        [
          {
            text: 'Go to Mining Panel',
            onPress: () => router.replace('/mining-panel'),
          },
        ]
      );
    } catch (error) {
      console.error('Error processing unlock payment:', error);
      Alert.alert('Error', 'Payment processing failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // If already unlocked, redirect
  if (user?.unlockPaymentMade) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Unlock Features</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.alreadyUnlockedCard}>
            <IconSymbol name="checkmark.circle.fill" size={80} color={colors.success} />
            <Text style={styles.alreadyUnlockedTitle}>Already Unlocked!</Text>
            <Text style={styles.alreadyUnlockedDescription}>
              You have already made the unlock payment. All features are available to you.
            </Text>
            
            <Pressable 
              style={styles.goToMiningButton} 
              onPress={() => router.push('/mining-panel')}
            >
              <IconSymbol name="arrow.right.circle.fill" size={20} color={colors.background} />
              <Text style={styles.goToMiningButtonText}>Go to Mining Panel</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Unlock Features</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.iconContainer}>
            <IconSymbol name="lock.open.fill" size={80} color="#FFD700" />
          </View>
          
          <Text style={styles.heroTitle}>Unlock All Features</Text>
          <Text style={styles.heroSubtitle}>One-time payment of 100 USDT</Text>
          
          <View style={styles.priceDisplay}>
            <Text style={styles.priceUSDT}>{UNLOCK_COST_USDT} USDT</Text>
            <Text style={styles.priceMXI}>≈ {mxiAmount.toFixed(6)} MXI</Text>
          </View>
        </View>

        {/* What You Get Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <IconSymbol name="star.fill" size={32} color="#FFD700" />
            <Text style={styles.cardTitle}>What You Get</Text>
          </View>
          
          <View style={styles.featureItem}>
            <IconSymbol name="checkmark.circle.fill" size={24} color={colors.success} />
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Mining Access</Text>
              <Text style={styles.featureDescription}>
                Start earning MXI through automated mining
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <IconSymbol name="checkmark.circle.fill" size={24} color={colors.success} />
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Lottery Access</Text>
              <Text style={styles.featureDescription}>
                Purchase lottery tickets and win prizes
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <IconSymbol name="checkmark.circle.fill" size={24} color={colors.success} />
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>MXI Balance</Text>
              <Text style={styles.featureDescription}>
                Receive {mxiAmount.toFixed(6)} MXI immediately
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <IconSymbol name="checkmark.circle.fill" size={24} color={colors.success} />
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Referral Commissions</Text>
              <Text style={styles.featureDescription}>
                Earn from your referrals&apos; activities
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <IconSymbol name="checkmark.circle.fill" size={24} color={colors.success} />
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Permanent Access</Text>
              <Text style={styles.featureDescription}>
                One-time payment, lifetime access
              </Text>
            </View>
          </View>
        </View>

        {/* How It Works Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <IconSymbol name="info.circle.fill" size={32} color={colors.primary} />
            <Text style={styles.cardTitle}>How It Works</Text>
          </View>
          
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepTextContainer}>
              <Text style={styles.stepTitle}>Make Payment</Text>
              <Text style={styles.stepDescription}>
                Pay 100 USDT via Binance Pay
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepTextContainer}>
              <Text style={styles.stepTitle}>Receive MXI</Text>
              <Text style={styles.stepDescription}>
                Get {mxiAmount.toFixed(6)} MXI in your account
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepTextContainer}>
              <Text style={styles.stepTitle}>Features Unlocked</Text>
              <Text style={styles.stepDescription}>
                Access Mining and Lottery immediately
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <View style={styles.stepTextContainer}>
              <Text style={styles.stepTitle}>Start Earning</Text>
              <Text style={styles.stepDescription}>
                Begin mining and participating in lottery
              </Text>
            </View>
          </View>
        </View>

        {/* Important Notes Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <IconSymbol name="exclamationmark.triangle.fill" size={32} color={colors.warning} />
            <Text style={styles.cardTitle}>Important Information</Text>
          </View>
          
          <Text style={styles.noteText}>
            - This is a one-time unlock payment of 100 USDT
          </Text>
          <Text style={styles.noteText}>
            - Separate from mining power purchases
          </Text>
          <Text style={styles.noteText}>
            - You receive MXI equivalent to your payment
          </Text>
          <Text style={styles.noteText}>
            - Mining requires additional 100 USDT package (30 days)
          </Text>
          <Text style={styles.noteText}>
            - Mining power can be boosted with USDT purchases
          </Text>
          <Text style={styles.noteText}>
            - All payments are processed via Binance Pay
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
              <IconSymbol name="hourglass" size={24} color={colors.background} />
              <Text style={styles.purchaseButtonText}>Processing Payment...</Text>
            </>
          ) : (
            <>
              <IconSymbol name="lock.open.fill" size={24} color={colors.background} />
              <Text style={styles.purchaseButtonText}>Unlock for {UNLOCK_COST_USDT} USDT</Text>
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
  heroCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 24,
    padding: 32,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#FFD700',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  priceDisplay: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 20,
    width: '100%',
  },
  priceUSDT: {
    fontSize: 36,
    fontWeight: '900',
    color: colors.primary,
    marginBottom: 8,
  },
  priceMXI: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  featureTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.background,
  },
  stepTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
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
    marginLeft: 12,
  },
  alreadyUnlockedCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.success,
  },
  alreadyUnlockedTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  alreadyUnlockedDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  goToMiningButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  goToMiningButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});
