
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
  const { user, updateBalance, refreshUser } = useAuth();
  const { config } = useMiningConfig();
  const { t } = useLocalization();
  const { mxiRate, isConnected, connectToBinance, convertMXIToUSD } = useBinance();
  const [isMining, setIsMining] = useState(false);
  const [miningProgress, setMiningProgress] = useState(0);
  const [minedAmount, setMinedAmount] = useState(0);

  // Animation values
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      router.replace('/(auth)/login');
    }
  }, [user]);

  // Start rotation animation when mining
  useEffect(() => {
    if (isMining) {
      rotation.value = withRepeat(
        withTiming(360, {
          duration: 2000,
          easing: Easing.linear,
        }),
        -1,
        false
      );
      scale.value = withRepeat(
        withTiming(1.1, {
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );
    } else {
      rotation.value = withTiming(0);
      scale.value = withTiming(1);
    }
  }, [isMining, rotation, scale]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${rotation.value}deg` },
        { scale: scale.value },
      ],
    };
  });

  // Mining timer - configurable MXI per minute
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isMining && user) {
      interval = setInterval(() => {
        // Update every second, mining rate from config
        const miningRate = config.miningRatePerMinute * user.miningPower; // MXI per minute
        const incrementPerSecond = miningRate / 60; // MXI per second
        
        setMinedAmount(prev => {
          const newAmount = prev + incrementPerSecond;
          return newAmount;
        });
        
        // Update progress (arbitrary scale for visual feedback)
        setMiningProgress(prev => {
          const newProgress = (prev + 0.1) % 100;
          return newProgress;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMining, user, config.miningRatePerMinute]);

  const startMining = () => {
    if (!isMining) {
      setIsMining(true);
      setMinedAmount(0);
      setMiningProgress(0);
      console.log(`Mining started - Rate: ${config.miningRatePerMinute} MXI per minute`);
    }
  };

  const stopMining = () => {
    if (isMining && minedAmount > 0) {
      updateBalance(minedAmount);
      Alert.alert(
        t('home.miningStopped'),
        t('home.miningStoppedMessage', { amount: minedAmount.toFixed(6) }),
        [{ text: t('common.ok') }]
      );
    }
    setIsMining(false);
    setMinedAmount(0);
    setMiningProgress(0);
    console.log("Mining stopped");
  };

  const handleConnectBinance = async () => {
    if (!isConnected) {
      await connectToBinance();
      Alert.alert(
        t('home.binanceConnected'),
        t('home.binanceConnectedMessage'),
        [{ text: t('common.ok') }]
      );
    }
  };

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
        {/* Mining Status Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Animated.View style={animatedStyle}>
              <IconSymbol 
                name="bitcoinsign.circle.fill" 
                size={80} 
                color={isMining ? colors.accent : colors.primary} 
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

        {/* Mining Progress Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('home.miningProgress')}</Text>
          
          <View style={styles.miningStatsContainer}>
            <View style={styles.miningStatBox}>
              <IconSymbol name="clock.fill" size={24} color={colors.primary} />
              <Text style={styles.miningStatValue}>
                {isMining ? minedAmount.toFixed(6) : '0.000000'}
              </Text>
              <Text style={styles.miningStatLabel}>{t('home.minedThisSession')}</Text>
            </View>
          </View>

          <View style={styles.progressBarContainer}>
            <View 
              style={[
                styles.progressBar, 
                { width: `${miningProgress}%` }
              ]} 
            />
          </View>
          
          <View style={styles.miningInfo}>
            <View style={styles.infoRow}>
              <IconSymbol name="gauge" size={20} color={colors.textSecondary} />
              <Text style={styles.infoText}>
                {t('home.status')}: {isMining ? t('home.miningActive') : t('home.idle')}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <IconSymbol name="chart.bar.fill" size={20} color={colors.textSecondary} />
              <Text style={styles.infoText}>
                {t('home.rate')}: {formatMiningRate()} MXI {t('home.perMinute')}
              </Text>
            </View>
          </View>

          {/* Mining Controls */}
          <View style={styles.buttonGroup}>
            {!isMining ? (
              <Pressable 
                style={[styles.button, styles.primaryButton]}
                onPress={startMining}
              >
                <IconSymbol name="play.fill" size={20} color="#ffffff" />
                <Text style={styles.buttonText}>{t('home.startMining')}</Text>
              </Pressable>
            ) : (
              <Pressable 
                style={[styles.button, styles.dangerButton]}
                onPress={stopMining}
              >
                <IconSymbol name="stop.fill" size={20} color="#ffffff" />
                <Text style={styles.buttonText}>{t('home.stopMining')}</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Purchase Card - Updated with new quick options */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('home.purchaseMaxcoin')}</Text>
          <Text style={styles.cardSubtitle}>
            {t('home.increaseMiningPower')}
          </Text>
          
          <View style={styles.purchaseGrid}>
            <Pressable 
              style={styles.purchaseButton}
              onPress={() => router.push('/purchase?amount=0.02')}
            >
              <IconSymbol name="plus.circle.fill" size={32} color={colors.primary} />
              <Text style={styles.purchaseAmount}>0.02 MXI</Text>
              <Text style={styles.purchaseBonus}>
                +{((0.02 / config.powerIncreaseThreshold) * config.powerIncreasePercent).toFixed(3)}% {t('home.power')}
              </Text>
            </Pressable>

            <Pressable 
              style={styles.purchaseButton}
              onPress={() => router.push('/purchase?amount=0.2')}
            >
              <IconSymbol name="plus.circle.fill" size={32} color={colors.primary} />
              <Text style={styles.purchaseAmount}>0.2 MXI</Text>
              <Text style={styles.purchaseBonus}>
                +{((0.2 / config.powerIncreaseThreshold) * config.powerIncreasePercent).toFixed(3)}% {t('home.power')}
              </Text>
            </Pressable>

            <Pressable 
              style={styles.purchaseButton}
              onPress={() => router.push('/purchase?amount=2.0')}
            >
              <IconSymbol name="plus.circle.fill" size={32} color={colors.accent} />
              <Text style={styles.purchaseAmount}>2.0 MXI</Text>
              <Text style={styles.purchaseBonus}>
                +{((2.0 / config.powerIncreaseThreshold) * config.powerIncreasePercent).toFixed(2)}% {t('home.power')}
              </Text>
            </Pressable>

            <Pressable 
              style={styles.purchaseButton}
              onPress={() => router.push('/purchase?amount=200')}
            >
              <IconSymbol name="plus.circle.fill" size={32} color={colors.success} />
              <Text style={styles.purchaseAmount}>200 MXI</Text>
              <Text style={styles.purchaseBonus}>
                +{((200 / config.powerIncreaseThreshold) * config.powerIncreasePercent).toFixed(1)}% {t('home.power')}
              </Text>
            </Pressable>
          </View>

          <Pressable 
            style={[styles.button, styles.accentButton, { marginTop: 12 }]}
            onPress={() => router.push('/purchase')}
          >
            <IconSymbol name="pencil.circle.fill" size={20} color={colors.text} />
            <Text style={[styles.buttonText, { color: colors.text }]}>
              {t('home.customAmount')} ({config.minPurchase}-{config.maxPurchase} MXI)
            </Text>
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

        {/* Binance Integration Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('home.binanceIntegration')}</Text>
          
          <View style={styles.binanceStatus}>
            <IconSymbol 
              name={isConnected ? "checkmark.circle.fill" : "xmark.circle.fill"} 
              size={24} 
              color={isConnected ? colors.success : colors.textSecondary} 
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.statusText}>
                {isConnected ? t('home.connected') : t('home.notConnected')}
              </Text>
              {isConnected && mxiRate && (
                <Text style={styles.statusSubtext}>
                  1 MXI = ${mxiRate.price.toFixed(2)} USD
                </Text>
              )}
            </View>
          </View>

          {!isConnected && (
            <Pressable 
              style={[styles.button, styles.accentButton]}
              onPress={handleConnectBinance}
            >
              <IconSymbol name="link" size={20} color={colors.text} />
              <Text style={[styles.buttonText, { color: colors.text }]}>
                {t('home.connectToBinance')}
              </Text>
            </Pressable>
          )}

          {isConnected && (
            <View style={styles.buttonGroup}>
              <Pressable 
                style={[styles.button, styles.primaryButton]}
                onPress={() => router.push("/send-mxi")}
              >
                <IconSymbol name="paperplane.fill" size={20} color="#ffffff" />
                <Text style={styles.buttonText}>Send MXI</Text>
              </Pressable>
              
              <Pressable 
                style={[styles.button, styles.secondaryButton]}
                onPress={() => router.push("/formsheet")}
              >
                <IconSymbol name="arrow.up.circle.fill" size={20} color="#ffffff" />
                <Text style={styles.buttonText}>{t('home.withdrawMXI')}</Text>
              </Pressable>
            </View>
          )}
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
  miningStatsContainer: {
    marginBottom: 16,
  },
  miningStatBox: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  miningStatValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.accent,
  },
  miningStatLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  purchaseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  purchaseButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  purchaseAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  purchaseBonus: {
    fontSize: 11,
    color: colors.success,
    fontWeight: '600',
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
  progressBarContainer: {
    height: 12,
    backgroundColor: colors.background,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 6,
  },
  miningInfo: {
    gap: 12,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  buttonGroup: {
    gap: 10,
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
  secondaryButton: {
    backgroundColor: colors.secondary,
  },
  accentButton: {
    backgroundColor: colors.accent,
  },
  dangerButton: {
    backgroundColor: colors.danger,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  binanceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  statusSubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
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
