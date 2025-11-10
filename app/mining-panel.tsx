
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Share,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useMiningAccess } from '@/contexts/MiningAccessContext';
import { useBinance } from '@/contexts/BinanceContext';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

export default function MiningPanelScreen() {
  const { user, getReferralLink, getActiveReferralsCount, isUnlocked } = useAuth();
  const { getMiningAccess, checkAccessExpiry, getMiningAccessCost } = useMiningAccess();
  const { mxiPrice } = useBinance();
  const [miningAccess, setMiningAccess] = useState<any>(null);
  const [activeReferrals, setActiveReferrals] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMiningData();
  }, [user]);

  const loadMiningData = async () => {
    if (!user) return;

    setLoading(true);
    const access = await getMiningAccess(user.id);
    const hasValidAccess = await checkAccessExpiry(user.id);
    const referralsCount = await getActiveReferralsCount();

    setMiningAccess(access);
    setActiveReferrals(referralsCount);
    setLoading(false);
  };

  const handlePurchaseAccess = useCallback(() => {
    if (!user) return;

    // Check if features are unlocked (with bypass)
    if (!isUnlocked()) {
      Alert.alert(
        'Unlock Required',
        'You need to make the 100 USDT unlock payment before purchasing mining access.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Unlock Now', onPress: () => router.push('/unlock-payment') },
        ]
      );
      return;
    }

    router.push({
      pathname: '/mining-access-purchase',
      params: { isRenewal: 'false' },
    });
  }, [user, isUnlocked]);

  const handleRenewAccess = useCallback(() => {
    if (!user) return;

    router.push({
      pathname: '/mining-access-purchase',
      params: { isRenewal: 'true' },
    });
  }, [user]);

  const handleShareReferralLink = async () => {
    try {
      const link = getReferralLink();
      await Share.share({
        message: `Join me on Maxcoin MXI and start mining cryptocurrency! Use my referral link: ${link}`,
      });
    } catch (error) {
      console.error('Error sharing referral link:', error);
    }
  };

  const getDaysRemaining = () => {
    if (!miningAccess?.expiryDate) return 0;
    const expiry = new Date(miningAccess.expiryDate);
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const getReferralMetrics = () => {
    return {
      total: user?.referrals.length || 0,
      active: activeReferrals,
      earnings: user?.referralEarnings || 0,
    };
  };

  const canWithdrawMiningEarnings = () => {
    const requiredReferrals = 10;
    const withdrawalsMade = user?.withdrawalRestrictions.withdrawalCount || 0;
    
    if (withdrawalsMade >= 5) return true;
    return activeReferrals >= requiredReferrals;
  };

  // Show unlock required message if not unlocked (and bypass is not active)
  if (!isUnlocked()) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Mining Panel</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.lockedCard}>
            <IconSymbol name="lock.fill" size={80} color={colors.textSecondary} />
            <Text style={styles.lockedTitle}>Mining Locked</Text>
            <Text style={styles.lockedDescription}>
              Make the 100 USDT unlock payment to access mining features and start earning MXI!
            </Text>
            
            <Pressable 
              style={styles.unlockButton} 
              onPress={() => router.push('/unlock-payment')}
            >
              <IconSymbol name="lock.open.fill" size={20} color={colors.background} />
              <Text style={styles.unlockButtonText}>Unlock Now</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  const hasAccess = miningAccess?.hasAccess && getDaysRemaining() > 0;
  const accessCost = getMiningAccessCost();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Mining Panel</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Mining Status Card */}
        <View style={[styles.statusCard, hasAccess ? styles.statusCardActive : styles.statusCardInactive]}>
          <View style={styles.statusIconContainer}>
            <IconSymbol 
              name={hasAccess ? "checkmark.circle.fill" : "xmark.circle.fill"} 
              size={60} 
              color={hasAccess ? colors.success : colors.error} 
            />
          </View>
          
          <Text style={styles.statusTitle}>
            {hasAccess ? 'Mining Active' : 'Mining Inactive'}
          </Text>
          
          {hasAccess ? (
            <>
              <Text style={styles.statusSubtitle}>
                {getDaysRemaining()} days remaining
              </Text>
              <View style={styles.statusMetrics}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Total Mined</Text>
                  <Text style={styles.metricValue}>
                    {miningAccess?.totalMined?.toFixed(6) || '0.000000'} MXI
                  </Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Mining Power</Text>
                  <Text style={styles.metricValue}>{user?.miningPower.toFixed(2)}x</Text>
                </View>
              </View>
            </>
          ) : (
            <Text style={styles.statusSubtitle}>
              Purchase mining access to start earning
            </Text>
          )}
        </View>

        {/* Action Buttons */}
        {!hasAccess ? (
          <Pressable style={styles.primaryButton} onPress={handlePurchaseAccess}>
            <IconSymbol name="bolt.fill" size={24} color={colors.background} />
            <Text style={styles.primaryButtonText}>
              Purchase Mining Access ({accessCost} USDT)
            </Text>
          </Pressable>
        ) : (
          <Pressable style={styles.secondaryButton} onPress={handleRenewAccess}>
            <IconSymbol name="arrow.clockwise" size={24} color={colors.primary} />
            <Text style={styles.secondaryButtonText}>
              Renew Access ({accessCost} USDT)
            </Text>
          </Pressable>
        )}

        {/* Mining Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <IconSymbol name="info.circle.fill" size={24} color={colors.primary} />
            <Text style={styles.cardTitle}>Mining Information</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Access Cost:</Text>
            <Text style={styles.infoValue}>{accessCost} USDT</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Duration:</Text>
            <Text style={styles.infoValue}>30 days</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Base Rate:</Text>
            <Text style={styles.infoValue}>0.1 MXI / 2 hours</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Your Power:</Text>
            <Text style={styles.infoValue}>{user?.miningPower.toFixed(2)}x</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Your Rate:</Text>
            <Text style={styles.infoValue}>
              {((0.1 * (user?.miningPower || 1)) / 2).toFixed(6)} MXI / hour
            </Text>
          </View>
        </View>

        {/* Referral Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <IconSymbol name="person.3.fill" size={24} color={colors.primary} />
            <Text style={styles.cardTitle}>Referral Program</Text>
          </View>
          
          <View style={styles.referralMetrics}>
            <View style={styles.referralMetricItem}>
              <Text style={styles.referralMetricValue}>{getReferralMetrics().total}</Text>
              <Text style={styles.referralMetricLabel}>Total Referrals</Text>
            </View>
            <View style={styles.referralMetricItem}>
              <Text style={styles.referralMetricValue}>{getReferralMetrics().active}</Text>
              <Text style={styles.referralMetricLabel}>Active Referrals</Text>
            </View>
            <View style={styles.referralMetricItem}>
              <Text style={styles.referralMetricValue}>
                {getReferralMetrics().earnings.toFixed(2)}
              </Text>
              <Text style={styles.referralMetricLabel}>MXI Earned</Text>
            </View>
          </View>

          <Pressable style={styles.shareButton} onPress={handleShareReferralLink}>
            <IconSymbol name="square.and.arrow.up" size={20} color={colors.primary} />
            <Text style={styles.shareButtonText}>Share Referral Link</Text>
          </Pressable>

          <View style={styles.commissionInfo}>
            <Text style={styles.commissionTitle}>Commission Structure:</Text>
            <Text style={styles.commissionText}>• Level 1: 5% of purchases</Text>
            <Text style={styles.commissionText}>• Level 2: 2% of purchases</Text>
            <Text style={styles.commissionText}>• Level 3: 1% of purchases</Text>
          </View>
        </View>

        {/* Withdrawal Requirements Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <IconSymbol name="exclamationmark.triangle.fill" size={24} color={colors.warning} />
            <Text style={styles.cardTitle}>Withdrawal Requirements</Text>
          </View>
          
          <Text style={styles.requirementText}>
            To withdraw mining earnings for your first 5 withdrawals, you need:
          </Text>
          
          <View style={styles.requirementItem}>
            <IconSymbol 
              name={canWithdrawMiningEarnings() ? "checkmark.circle.fill" : "xmark.circle.fill"} 
              size={24} 
              color={canWithdrawMiningEarnings() ? colors.success : colors.error} 
            />
            <Text style={styles.requirementItemText}>
              10 active referrals with purchases
            </Text>
          </View>
          
          <Text style={styles.requirementNote}>
            Current: {activeReferrals} / 10 active referrals
          </Text>
          
          <Text style={styles.requirementNote}>
            After 5 withdrawals, this requirement is removed.
          </Text>
        </View>

        {/* Boost Mining Power */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <IconSymbol name="bolt.fill" size={24} color="#FFD700" />
            <Text style={styles.cardTitle}>Boost Mining Power</Text>
          </View>
          
          <Text style={styles.boostDescription}>
            Increase your mining rate by purchasing mining power with USDT.
          </Text>
          
          <Text style={styles.boostFormula}>
            +1% power per 10 USDT invested
          </Text>
          
          <Pressable 
            style={styles.boostButton} 
            onPress={() => router.push('/purchase')}
          >
            <IconSymbol name="arrow.up.circle.fill" size={20} color={colors.background} />
            <Text style={styles.boostButtonText}>Boost Power</Text>
          </Pressable>
        </View>

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
  statusCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 2,
  },
  statusCardActive: {
    backgroundColor: colors.cardBackground,
    borderColor: colors.success,
  },
  statusCardInactive: {
    backgroundColor: colors.cardBackground,
    borderColor: colors.error,
  },
  statusIconContainer: {
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  statusSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  statusMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
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
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  referralMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
  },
  referralMetricItem: {
    alignItems: 'center',
  },
  referralMetricValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 4,
  },
  referralMetricLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  shareButton: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  shareButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  commissionInfo: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
  },
  commissionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  commissionText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  requirementText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
  },
  requirementItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 12,
  },
  requirementNote: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 8,
    lineHeight: 18,
  },
  boostDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  boostFormula: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 16,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
  },
  boostButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boostButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  lockedCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  lockedTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  lockedDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  unlockButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  unlockButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});
