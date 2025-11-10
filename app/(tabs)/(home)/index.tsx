
import React, { useState, useEffect } from "react";
import { Stack } from "expo-router";
import { useTheme } from "@react-navigation/native";
import { 
  ScrollView, 
  StyleSheet, 
  View, 
  Text, 
  Pressable, 
  Platform,
  Alert 
} from "react-native";
import { IconSymbol } from "@/components/IconSymbol";
import { colors } from "@/styles/commonStyles";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useMiningConfig } from "@/contexts/MiningConfigContext";
import { useLocalization } from "@/contexts/LocalizationContext";
import { useBinance } from "@/contexts/BinanceContext";
import PriceChart from "@/components/PriceChart";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
} from "react-native-reanimated";

export default function HomeScreen() {
  const theme = useTheme();
  const { user, refreshUser } = useAuth();
  const { config } = useMiningConfig();
  const { t } = useLocalization();
  const { mxiRate, isConnected, convertMXIToUSD } = useBinance();

  // Animation values
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      router.replace('/(auth)/login');
    }
  }, [user]);

  // Continuous rotation animation for the coin icon
  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 3000,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${rotation.value}deg` },
      ],
    };
  });

  const formatMiningRate = () => {
    if (!user) return "0.0000";
    const ratePerMinute = config.miningRatePerMinute * user.miningPower;
    return ratePerMinute.toFixed(6);
  };

  const renderHeaderRight = () => (
    <Pressable
      onPress={() => router.push("/formsheet")}
      style={styles.headerButtonContainer}
    >
      <IconSymbol name="arrow.up.circle.fill" color={colors.primary} size={24} />
    </Pressable>
  );

  if (!user) {
    return null;
  }

  return (
    <>
      {Platform.OS === 'ios' && (
        <Stack.Screen
          options={{
            title: t('home.title'),
            headerRight: renderHeaderRight,
          }}
        />
      )}
      <ScrollView 
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[
          styles.scrollContent,
          Platform.OS !== 'ios' && styles.scrollContentWithTabBar
        ]}
      >
        {/* Balance Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Animated.View style={animatedStyle}>
              <IconSymbol 
                name="bitcoinsign.circle.fill" 
                size={80} 
                color={colors.primary} 
              />
            </Animated.View>
          </View>
          
          <Text style={styles.balanceLabel}>{t('home.yourBalance')}</Text>
          <Text style={styles.balanceAmount}>{user.balance.toFixed(6)} MXI</Text>
          
          {isConnected && mxiRate && (
            <Text style={styles.balanceUSD}>
              ≈ ${convertMXIToUSD(user.balance).toFixed(2)} USD
            </Text>
          )}
          
          <View style={styles.levelBadge}>
            <IconSymbol name="star.fill" size={16} color={colors.accent} />
            <Text style={styles.levelText}>{t('home.miningPower')}: {user.miningPower.toFixed(2)}x</Text>
          </View>
        </View>

        {/* Real-Time Price Chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('home.marketPrice')}</Text>
          <Text style={styles.cardSubtitle}>
            {t('home.livePriceSubtitle')}
          </Text>
          <PriceChart />
        </View>

        {/* Quick Actions Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          
          <View style={styles.actionGrid}>
            <Pressable 
              style={styles.actionButton}
              onPress={() => router.push('/mining-panel')}
            >
              <IconSymbol name="hammer.fill" size={32} color={colors.primary} />
              <Text style={styles.actionButtonText}>Mining Panel</Text>
            </Pressable>

            <Pressable 
              style={styles.actionButton}
              onPress={() => router.push('/transactions')}
            >
              <IconSymbol name="list.bullet.rectangle" size={32} color={colors.accent} />
              <Text style={styles.actionButtonText}>Transactions</Text>
            </Pressable>

            <Pressable 
              style={styles.actionButton}
              onPress={() => router.push('/send-mxi')}
            >
              <IconSymbol name="paperplane.fill" size={32} color={colors.success} />
              <Text style={styles.actionButtonText}>Send MXI</Text>
            </Pressable>

            <Pressable 
              style={styles.actionButton}
              onPress={() => router.push('/mxilucky')}
            >
              <IconSymbol name="gift.fill" size={32} color={colors.warning} />
              <Text style={styles.actionButtonText}>MXILUCKY</Text>
            </Pressable>
          </View>
        </View>

        {/* Mining Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Mining Information</Text>
          
          <View style={styles.infoRow}>
            <IconSymbol name="gauge" size={20} color={colors.textSecondary} />
            <Text style={styles.infoText}>
              {t('home.rate')}: {formatMiningRate()} MXI {t('home.perMinute')}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <IconSymbol name="calendar" size={20} color={colors.textSecondary} />
            <Text style={styles.infoText}>
              Mining power rental: 30 days
            </Text>
          </View>

          <View style={styles.infoRow}>
            <IconSymbol name="info.circle" size={20} color={colors.textSecondary} />
            <Text style={styles.infoText}>
              Access the Mining Panel to start earning
            </Text>
          </View>

          <Pressable 
            style={[styles.button, styles.primaryButton, { marginTop: 12 }]}
            onPress={() => router.push('/mining-panel')}
          >
            <IconSymbol name="arrow.right.circle.fill" size={20} color="#ffffff" />
            <Text style={styles.buttonText}>Go to Mining Panel</Text>
          </Pressable>
        </View>

        {/* Referral Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('home.referralProgram')}</Text>
          
          <View style={styles.referralCodeBox}>
            <Text style={styles.referralLabel}>{t('home.yourReferralCode')}</Text>
            <Text style={styles.referralCode}>{user.referralCode}</Text>
            <Text style={styles.referralHint}>{t('home.shareCode')}</Text>
          </View>

          <View style={styles.referralStats}>
            <View style={styles.referralStatItem}>
              <IconSymbol name="person.2.fill" size={24} color={colors.primary} />
              <Text style={styles.referralStatValue}>{user.referrals.length}</Text>
              <Text style={styles.referralStatLabel}>{t('home.referrals')}</Text>
            </View>

            <View style={styles.referralStatItem}>
              <IconSymbol name="dollarsign.circle.fill" size={24} color={colors.success} />
              <Text style={styles.referralStatValue}>{user.referralEarnings.toFixed(6)}</Text>
              <Text style={styles.referralStatLabel}>{t('home.earned')} (MXI)</Text>
            </View>
          </View>

          <View style={styles.infoBox}>
            <IconSymbol name="info.circle.fill" size={20} color={colors.primary} />
            <Text style={styles.infoBoxText}>
              {t('home.referralInfo', { 
                level1: config.level1Commission, 
                level2: config.level2Commission, 
                level3: config.level3Commission 
              })}
            </Text>
          </View>
        </View>

        {/* Info Card */}
        <View style={[styles.card, styles.infoCard]}>
          <IconSymbol name="info.circle.fill" size={24} color={colors.primary} />
          <Text style={styles.infoCardText}>
            {t('home.infoMessage', { rate: config.miningRatePerMinute })}
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 20,
  },
  scrollContentWithTabBar: {
    paddingBottom: 100,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 16,
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
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  balanceUSD: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.highlight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
    gap: 6,
  },
  levelText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  referralCodeBox: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  referralLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  referralCode: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 2,
  },
  referralHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  referralStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  referralStatItem: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  referralStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  referralStatLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.highlight,
    borderRadius: 8,
    padding: 12,
    gap: 10,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
    flex: 1,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.highlight,
  },
  infoCardText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  headerButtonContainer: {
    padding: 6,
  },
});
