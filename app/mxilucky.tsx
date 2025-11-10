
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useLottery } from '@/contexts/LotteryContext';
import { useBinance } from '@/contexts/BinanceContext';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

export default function MXILuckyScreen() {
  const { user, isUnlocked } = useAuth();
  const { config, purchaseTickets, getCurrentPrizePool, getTotalTicketsSold, getNextDrawDate } = useLottery();
  const { mxiPrice } = useBinance();
  const [ticketQuantity, setTicketQuantity] = useState('1');
  const [prizePool, setPrizePool] = useState(0);
  const [totalTickets, setTotalTickets] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLotteryData();
  }, []);

  const loadLotteryData = async () => {
    const pool = await getCurrentPrizePool();
    const tickets = await getTotalTicketsSold();
    setPrizePool(pool);
    setTotalTickets(tickets);
  };

  const handlePurchaseTickets = useCallback(async () => {
    if (!user) {
      Alert.alert('Error', 'Please log in to purchase tickets');
      return;
    }

    // Check if features are unlocked (with bypass)
    if (!isUnlocked()) {
      Alert.alert(
        'Unlock Required',
        'You need to make the 100 USDT unlock payment to access the lottery.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Unlock Now', onPress: () => router.push('/unlock-payment') },
        ]
      );
      return;
    }

    const quantity = parseInt(ticketQuantity);
    if (isNaN(quantity) || quantity < 1) {
      Alert.alert('Invalid Quantity', 'Please enter a valid number of tickets');
      return;
    }

    const totalCost = config.ticketPrice * quantity;
    if (user.balance < totalCost) {
      Alert.alert(
        'Insufficient Balance',
        `You need ${totalCost.toFixed(6)} MXI to purchase ${quantity} ticket(s). Your balance: ${user.balance.toFixed(6)} MXI`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Buy MXI', onPress: () => router.push('/purchase') },
        ]
      );
      return;
    }

    Alert.alert(
      'Confirm Purchase',
      `Purchase ${quantity} ticket(s) for ${totalCost.toFixed(6)} MXI?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setLoading(true);
            const result = await purchaseTickets(
              user.id,
              user.username,
              user.uniqueIdentifier,
              quantity
            );
            setLoading(false);

            if (result.success) {
              Alert.alert(
                'Success!',
                `You have purchased ${quantity} ticket(s) for the next draw!`,
                [{ text: 'OK', onPress: () => loadLotteryData() }]
              );
              setTicketQuantity('1');
            } else {
              Alert.alert('Error', result.message || 'Failed to purchase tickets');
            }
          },
        },
      ]
    );
  }, [user, ticketQuantity, config, isUnlocked]);

  const getNextDraw = () => {
    const nextDraw = getNextDrawDate();
    const now = new Date();
    const diff = nextDraw.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}d ${hours}h`;
  };

  const getProgressPercentage = () => {
    if (config.maxTicketsPerDraw === 0) return 0;
    return (totalTickets / config.maxTicketsPerDraw) * 100;
  };

  const getWinningProbability = () => {
    if (totalTickets === 0) return 0;
    const quantity = parseInt(ticketQuantity) || 1;
    return (quantity / (totalTickets + quantity)) * 100;
  };

  const getPrizeDistribution = () => {
    return [
      { place: '1st', percentage: config.firstPrizePercent, amount: (prizePool * config.firstPrizePercent) / 100 },
      { place: '2nd', percentage: config.secondPrizePercent, amount: (prizePool * config.secondPrizePercent) / 100 },
      { place: '3rd', percentage: config.thirdPrizePercent, amount: (prizePool * config.thirdPrizePercent) / 100 },
    ];
  };

  // Show unlock required message if not unlocked (and bypass is not active)
  if (!isUnlocked()) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>MXI Lucky</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.lockedCard}>
            <IconSymbol name="lock.fill" size={80} color={colors.textSecondary} />
            <Text style={styles.lockedTitle}>Lottery Locked</Text>
            <Text style={styles.lockedDescription}>
              Make the 100 USDT unlock payment to access the lottery and start winning prizes!
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>MXI Lucky</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Prize Pool Card */}
        <View style={styles.prizePoolCard}>
          <Text style={styles.prizePoolLabel}>Current Prize Pool</Text>
          <Text style={styles.prizePoolAmount}>{prizePool.toFixed(6)} MXI</Text>
          <Text style={styles.prizePoolUSD}>≈ ${(prizePool * mxiPrice).toFixed(2)} USD</Text>
          
          <View style={styles.nextDrawContainer}>
            <IconSymbol name="clock.fill" size={20} color={colors.primary} />
            <Text style={styles.nextDrawText}>Next draw in: {getNextDraw()}</Text>
          </View>
        </View>

        {/* Ticket Sales Progress */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <IconSymbol name="ticket.fill" size={24} color={colors.primary} />
            <Text style={styles.cardTitle}>Ticket Sales</Text>
          </View>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${getProgressPercentage()}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {totalTickets} / {config.maxTicketsPerDraw} tickets sold
            </Text>
          </View>
        </View>

        {/* Purchase Tickets Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <IconSymbol name="cart.fill" size={24} color={colors.primary} />
            <Text style={styles.cardTitle}>Purchase Tickets</Text>
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Number of Tickets</Text>
            <TextInput
              style={styles.input}
              value={ticketQuantity}
              onChangeText={setTicketQuantity}
              keyboardType="number-pad"
              placeholder="1"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.costContainer}>
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>Price per ticket:</Text>
              <Text style={styles.costValue}>{config.ticketPrice.toFixed(6)} MXI</Text>
            </View>
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>Total cost:</Text>
              <Text style={styles.costValueTotal}>
                {(config.ticketPrice * (parseInt(ticketQuantity) || 1)).toFixed(6)} MXI
              </Text>
            </View>
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>Your balance:</Text>
              <Text style={styles.costValue}>{user?.balance.toFixed(6)} MXI</Text>
            </View>
          </View>

          <View style={styles.probabilityContainer}>
            <IconSymbol name="chart.bar.fill" size={20} color={colors.success} />
            <Text style={styles.probabilityText}>
              Winning probability: {getWinningProbability().toFixed(2)}%
            </Text>
          </View>

          <Pressable
            style={[styles.purchaseButton, loading && styles.purchaseButtonDisabled]}
            onPress={handlePurchaseTickets}
            disabled={loading}
          >
            <IconSymbol name="ticket.fill" size={20} color={colors.background} />
            <Text style={styles.purchaseButtonText}>
              {loading ? 'Processing...' : 'Purchase Tickets'}
            </Text>
          </Pressable>
        </View>

        {/* Prize Distribution Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <IconSymbol name="trophy.fill" size={24} color="#FFD700" />
            <Text style={styles.cardTitle}>Prize Distribution</Text>
          </View>
          
          {getPrizeDistribution().map((prize, index) => (
            <View key={index} style={styles.prizeRow}>
              <View style={styles.prizePlace}>
                <Text style={styles.prizePlaceText}>{prize.place}</Text>
              </View>
              <View style={styles.prizeInfo}>
                <Text style={styles.prizePercentage}>{prize.percentage}%</Text>
                <Text style={styles.prizeAmount}>{prize.amount.toFixed(6)} MXI</Text>
              </View>
            </View>
          ))}
        </View>

        {/* How It Works Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <IconSymbol name="info.circle.fill" size={24} color={colors.primary} />
            <Text style={styles.cardTitle}>How It Works</Text>
          </View>
          
          <Text style={styles.infoText}>
            - Purchase tickets with MXI
          </Text>
          <Text style={styles.infoText}>
            - Draw occurs every {config.drawFrequencyDays} days
          </Text>
          <Text style={styles.infoText}>
            - Winners are randomly selected
          </Text>
          <Text style={styles.infoText}>
            - Prizes are distributed automatically
          </Text>
          <Text style={styles.infoText}>
            - More tickets = higher winning chance
          </Text>
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
  prizePoolCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  prizePoolLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  prizePoolAmount: {
    fontSize: 36,
    fontWeight: '900',
    color: colors.primary,
    marginBottom: 4,
  },
  prizePoolUSD: {
    fontSize: 18,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  nextDrawContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
  },
  nextDrawText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
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
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 12,
    backgroundColor: colors.background,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 6,
  },
  progressText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  costContainer: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  costLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  costValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  costValueTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  probabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  probabilityText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
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
    opacity: 0.5,
  },
  purchaseButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  prizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
  },
  prizePlace: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  prizePlaceText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.background,
  },
  prizeInfo: {
    flex: 1,
  },
  prizePercentage: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  prizeAmount: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 8,
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
