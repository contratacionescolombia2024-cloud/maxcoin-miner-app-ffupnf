
import React, { useState, useEffect } from 'react';
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
  const { user, getReferralLink, getActiveReferralsCount } = useAuth();
  const { getMiningAccess, checkAccessExpiry, getMiningAccessCost } = useMiningAccess();
  const { mxiPrice } = useBinance();
  const [miningAccess, setMiningAccess] = useState<any>(null);
  const [hasActiveAccess, setHasActiveAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeReferrals, setActiveReferrals] = useState(0);

  useEffect(() => {
    loadMiningAccess();
  }, [user]);

  const loadMiningAccess = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const access = await getMiningAccess(user.id);
      const isActive = await checkAccessExpiry(user.id);
      const activeCount = await getActiveReferralsCount();
      
      setMiningAccess(access);
      setHasActiveAccess(isActive);
      setActiveReferrals(activeCount);
    } catch (error) {
      console.error('Error loading mining access:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseAccess = () => {
    router.push('/mining-access-purchase');
  };

  const handleRenewAccess = () => {
    router.push('/mining-access-purchase?renewal=true');
  };

  const handleShareReferralLink = async () => {
    if (!user) return;
    
    try {
      const referralLink = getReferralLink();
      await Share.share({
        message: `Join Maxcoin MXI and start mining cryptocurrency! Use my referral link: ${referralLink}`,
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
    if (!user) return { total: 0, active: 0 };
    
    return {
      total: user.referrals.length,
      active: activeReferrals,
    };
  };

  const canWithdrawMiningEarnings = () => {
    // Mining earnings require 10 active referrals with purchases per cycle
    return activeReferrals >= 10;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Mining Panel</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  const referralMetrics = getReferralMetrics();
  const daysRemaining = getDaysRemaining();
  const accessCost = getMiningAccessCost();
  const miningWithdrawalsEnabled = canWithdrawMiningEarnings();

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
        {/* Access Status Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <IconSymbol name="lock.shield.fill" size={32} color={hasActiveAccess ? colors.success : colors.error} />
            <Text style={styles.cardTitle}>Mining Access Status</Text>
          </View>
          
          {hasActiveAccess ? (
            <>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Status:</Text>
                <Text style={[styles.statusValue, { color: colors.success }]}>Active</Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Days Remaining:</Text>
                <Text style={styles.statusValue}>{daysRemaining} days</Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Renewals:</Text>
                <Text style={styles.statusValue}>{miningAccess?.renewalCount || 0}</Text>
              </View>
              
              {daysRemaining <= 7 && (
                <Pressable style={styles.renewButton} onPress={handleRenewAccess}>
                  <IconSymbol name="arrow.clockwise" size={20} color={colors.background} />
                  <Text style={styles.renewButtonText}>Renew Access</Text>
                </Pressable>
              )}
            </>
          ) : (
            <>
              <Text style={styles.noAccessText}>
                You need to purchase the initial mining package (50 USDT) to start earning MXI through mining.
              </Text>
              <View style={styles.costInfo}>
                <Text style={styles.costLabel}>Access Cost:</Text>
                <Text style={styles.costValue}>{accessCost} USDT</Text>
              </View>
              <View style={styles.costInfo}>
                <Text style={styles.costLabel}>Duration:</Text>
                <Text style={styles.costValue}>30 Days</Text>
              </View>
              
              <Pressable style={styles.purchaseButton} onPress={handlePurchaseAccess}>
                <IconSymbol name="cart.fill" size={20} color={colors.background} />
                <Text style={styles.purchaseButtonText}>Purchase Initial Package</Text>
              </Pressable>
            </>
          )}
        </View>

        {/* Mining Metrics Card */}
        {hasActiveAccess && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <IconSymbol name="chart.bar.fill" size={32} color={colors.primary} />
              <Text style={styles.cardTitle}>Mining Metrics</Text>
            </View>
            
            <View style={styles.metricRow}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Total Mined</Text>
                <Text style={styles.metricValue}>
                  {(miningAccess?.totalMined || 0).toFixed(6)} MXI
                </Text>
                <Text style={styles.metricUsd}>
                  ≈ ${((miningAccess?.totalMined || 0) * mxiPrice).toFixed(2)}
                </Text>
              </View>
              
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Total Withdrawn</Text>
                <Text style={styles.metricValue}>
                  {(miningAccess?.totalWithdrawn || 0).toFixed(6)} MXI
                </Text>
                <Text style={styles.metricUsd}>
                  ≈ ${((miningAccess?.totalWithdrawn || 0) * mxiPrice).toFixed(2)}
                </Text>
              </View>
            </View>

            <View style={styles.metricRow}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Current Balance</Text>
                <Text style={styles.metricValue}>
                  {(user?.balance || 0).toFixed(6)} MXI
                </Text>
                <Text style={styles.metricUsd}>
                  ≈ ${((user?.balance || 0) * mxiPrice).toFixed(2)}
                </Text>
              </View>
              
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Mining Power</Text>
                <Text style={styles.metricValue}>
                  {user?.miningPower.toFixed(2)}x
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Referral Progress Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <IconSymbol name="person.3.fill" size={32} color={colors.accent} />
            <Text style={styles.cardTitle}>Referral Progress</Text>
          </View>
          
          <View style={styles.referralRow}>
            <Text style={styles.referralLabel}>Total Referrals:</Text>
            <Text style={styles.referralValue}>{referralMetrics.total}</Text>
          </View>
          
          <View style={styles.referralRow}>
            <Text style={styles.referralLabel}>Active Referrals (with purchases):</Text>
            <Text style={styles.referralValue}>{referralMetrics.active}</Text>
          </View>
          
          <View style={styles.referralRow}>
            <Text style={styles.referralLabel}>Referral Earnings:</Text>
            <Text style={styles.referralValue}>
              {(user?.referralEarnings || 0).toFixed(6)} MXI
            </Text>
          </View>

          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarLabel}>
              <Text style={styles.progressBarText}>
                Progress to unlock mining withdrawals
              </Text>
              <Text style={styles.progressBarValue}>
                {referralMetrics.active}/10
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { width: `${Math.min((referralMetrics.active / 10) * 100, 100)}%` }
                ]} 
              />
            </View>
          </View>

          <Pressable style={styles.shareButton} onPress={handleShareReferralLink}>
            <IconSymbol name="square.and.arrow.up" size={20} color={colors.background} />
            <Text style={styles.shareButtonText}>Share Referral Link</Text>
          </Pressable>
        </View>

        {/* Withdrawal Availability Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <IconSymbol name="arrow.up.circle.fill" size={32} color={miningWithdrawalsEnabled ? colors.success : colors.warning} />
            <Text style={styles.cardTitle}>Withdrawal Status</Text>
          </View>
          
          <View style={styles.withdrawalInfo}>
            <Text style={styles.withdrawalLabel}>Purchased/Transferred MXI:</Text>
            <Text style={[styles.withdrawalStatus, { color: colors.success }]}>
              Always Available
            </Text>
          </View>
          
          <View style={styles.withdrawalInfo}>
            <Text style={styles.withdrawalLabel}>Commission Earnings:</Text>
            <Text style={[styles.withdrawalStatus, { color: colors.success }]}>
              Available Immediately
            </Text>
          </View>

          <View style={styles.withdrawalInfo}>
            <Text style={styles.withdrawalLabel}>Mining Earnings:</Text>
            <Text style={[styles.withdrawalStatus, { color: miningWithdrawalsEnabled ? colors.success : colors.warning }]}>
              {miningWithdrawalsEnabled ? 'Available' : 'Restricted'}
            </Text>
          </View>
          
          {!miningWithdrawalsEnabled && (
            <View style={styles.requirementsBox}>
              <Text style={styles.requirementsTitle}>Requirements to withdraw mining earnings:</Text>
              <Text style={styles.requirementText}>
                • 10 active referrals with purchases per cycle
              </Text>
              <Text style={styles.requirementText}>
                • Purchases include initial package (50 USDT) or mining power
              </Text>
              <Text style={styles.requirementText}>
                • Current progress: {referralMetrics.active}/10 active referrals
              </Text>
            </View>
          )}
          
          <Pressable 
            style={styles.withdrawButton} 
            onPress={() => router.push('/formsheet')}
          >
            <IconSymbol name="arrow.up.circle" size={20} color={colors.background} />
            <Text style={styles.withdrawButtonText}>Withdraw MXI</Text>
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
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
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  noAccessText: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 20,
  },
  costInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  costLabel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  costValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  purchaseButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  purchaseButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  renewButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  renewButtonText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  metricUsd: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  referralRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  referralLabel: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  referralValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  progressBarContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  progressBarLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBarText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  progressBarValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  progressBar: {
    height: 10,
    backgroundColor: colors.background,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 5,
  },
  shareButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  shareButtonText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  withdrawalInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  withdrawalLabel: {
    fontSize: 15,
    color: colors.textSecondary,
    flex: 1,
  },
  withdrawalStatus: {
    fontSize: 15,
    fontWeight: '700',
  },
  requirementsBox: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  withdrawButton: {
    backgroundColor: colors.success,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  withdrawButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});
