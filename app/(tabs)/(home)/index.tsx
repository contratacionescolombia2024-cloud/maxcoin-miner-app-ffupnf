
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
  const [isMining, setIsMining] = useState(false);
  const [miningProgress, setMiningProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(7200); // 2 hours in seconds
  const [binanceConnected, setBinanceConnected] = useState(false);

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
  }, [isMining]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${rotation.value}deg` },
        { scale: scale.value },
      ],
    };
  });

  // Mining timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isMining && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = prev - 1;
          const progress = ((7200 - newTime) / 7200) * 100;
          setMiningProgress(progress);
          
          // Complete mining cycle
          if (newTime <= 0) {
            const miningReward = 0.1 * (user?.miningPower || 1);
            updateBalance(miningReward);
            setIsMining(false);
            setTimeRemaining(7200);
            setMiningProgress(0);
            Alert.alert(
              "Mining Complete!",
              `You have mined ${miningReward.toFixed(4)} MXI! Start mining again to earn more.`,
              [{ text: "OK" }]
            );
            return 7200;
          }
          
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMining, timeRemaining, user]);

  const startMining = () => {
    if (!isMining) {
      setIsMining(true);
      console.log("Mining started");
    }
  };

  const stopMining = () => {
    setIsMining(false);
    console.log("Mining stopped");
  };

  const connectBinance = () => {
    setBinanceConnected(true);
    Alert.alert(
      "Binance Connected",
      "Your Binance account has been connected successfully! (Simulated)",
      [{ text: "OK" }]
    );
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
            title: "Maxcoin MXI Mining",
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
          
          <Text style={styles.balanceLabel}>Your Balance</Text>
          <Text style={styles.balanceAmount}>{user.balance.toFixed(4)} MXI</Text>
          
          <View style={styles.levelBadge}>
            <IconSymbol name="star.fill" size={16} color={colors.accent} />
            <Text style={styles.levelText}>Mining Power: {user.miningPower.toFixed(2)}x</Text>
          </View>
        </View>

        {/* Purchase Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Purchase Maxcoin</Text>
          <Text style={styles.cardSubtitle}>
            Increase your mining power by purchasing MXI
          </Text>
          
          <View style={styles.purchaseGrid}>
            <Pressable 
              style={styles.purchaseButton}
              onPress={() => router.push('/purchase?amount=10')}
            >
              <IconSymbol name="plus.circle.fill" size={32} color={colors.primary} />
              <Text style={styles.purchaseAmount}>10 MXI</Text>
              <Text style={styles.purchaseBonus}>+1% Mining Power</Text>
            </Pressable>

            <Pressable 
              style={styles.purchaseButton}
              onPress={() => router.push('/purchase?amount=50')}
            >
              <IconSymbol name="plus.circle.fill" size={32} color={colors.primary} />
              <Text style={styles.purchaseAmount}>50 MXI</Text>
              <Text style={styles.purchaseBonus}>+5% Mining Power</Text>
            </Pressable>

            <Pressable 
              style={styles.purchaseButton}
              onPress={() => router.push('/purchase?amount=100')}
            >
              <IconSymbol name="plus.circle.fill" size={32} color={colors.accent} />
              <Text style={styles.purchaseAmount}>100 MXI</Text>
              <Text style={styles.purchaseBonus}>+10% Mining Power</Text>
            </Pressable>
          </View>
        </View>

        {/* Referral Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Referral Program</Text>
          
          <View style={styles.referralCodeBox}>
            <Text style={styles.referralLabel}>Your Referral Code</Text>
            <Text style={styles.referralCode}>{user.referralCode}</Text>
            <Text style={styles.referralHint}>Share this code to earn rewards!</Text>
          </View>

          <View style={styles.referralStats}>
            <View style={styles.referralStatItem}>
              <IconSymbol name="person.2.fill" size={24} color={colors.primary} />
              <Text style={styles.referralStatValue}>{user.referrals.length}</Text>
              <Text style={styles.referralStatLabel}>Referrals</Text>
            </View>

            <View style={styles.referralStatItem}>
              <IconSymbol name="dollarsign.circle.fill" size={24} color={colors.success} />
              <Text style={styles.referralStatValue}>{user.referralEarnings.toFixed(4)}</Text>
              <Text style={styles.referralStatLabel}>Earned (MXI)</Text>
            </View>
          </View>

          <View style={styles.infoBox}>
            <IconSymbol name="info.circle.fill" size={20} color={colors.primary} />
            <Text style={styles.infoBoxText}>
              Earn 5% from direct referrals and 2% from their referrals!
            </Text>
          </View>
        </View>

        {/* Mining Progress Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Mining Progress</Text>
          
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
              <IconSymbol name="clock.fill" size={20} color={colors.textSecondary} />
              <Text style={styles.infoText}>
                {isMining ? `Time Remaining: ${formatTime(timeRemaining)}` : 'Not Mining'}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <IconSymbol name="chart.bar.fill" size={20} color={colors.textSecondary} />
              <Text style={styles.infoText}>
                Rate: {(0.1 * user.miningPower).toFixed(4)} MXI / 2 hours
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
                <Text style={styles.buttonText}>Start Mining</Text>
              </Pressable>
            ) : (
              <Pressable 
                style={[styles.button, styles.dangerButton]}
                onPress={stopMining}
              >
                <IconSymbol name="stop.fill" size={20} color="#ffffff" />
                <Text style={styles.buttonText}>Stop Mining</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Binance Integration Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Binance Integration</Text>
          
          <View style={styles.binanceStatus}>
            <IconSymbol 
              name={binanceConnected ? "checkmark.circle.fill" : "xmark.circle.fill"} 
              size={24} 
              color={binanceConnected ? colors.success : colors.textSecondary} 
            />
            <Text style={styles.statusText}>
              {binanceConnected ? "Connected to Binance" : "Not Connected"}
            </Text>
          </View>

          {!binanceConnected && (
            <Pressable 
              style={[styles.button, styles.accentButton]}
              onPress={connectBinance}
            >
              <IconSymbol name="link" size={20} color={colors.text} />
              <Text style={[styles.buttonText, { color: colors.text }]}>
                Connect to Binance
              </Text>
            </Pressable>
          )}

          {binanceConnected && (
            <Pressable 
              style={[styles.button, styles.secondaryButton]}
              onPress={() => router.push("/formsheet")}
            >
              <IconSymbol name="arrow.up.circle.fill" size={20} color="#ffffff" />
              <Text style={styles.buttonText}>Withdraw MXI</Text>
            </Pressable>
          )}
        </View>

        {/* Info Card */}
        <View style={[styles.card, styles.infoCard]}>
          <IconSymbol name="info.circle.fill" size={24} color={colors.primary} />
          <Text style={styles.infoCardText}>
            Keep the app open to mine Maxcoin MXI. Your mining power increases with purchases!
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
  purchaseGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  purchaseButton: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  purchaseAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  purchaseBonus: {
    fontSize: 12,
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
