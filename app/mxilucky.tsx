
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
  const { user, updateBalance } = useAuth();
  const { 
    config, 
    purchaseTickets, 
    getUserTickets, 
    getCurrentPrizePool,
    getNextDrawDate,
    getTotalTicketsSold,
  } = useLottery();
  const { mxiPrice } = useBinance();

  const [ticketQuantity, setTicketQuantity] = useState('1');
  const [userTickets, setUserTickets] = useState<any[]>([]);
  const [prizePool, setPrizePool] = useState(0);
  const [totalTickets, setTotalTickets] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadLotteryData = useCallback(async () => {
    if (!user) return;

    try {
      const tickets = await getUserTickets(user.id);
      const pool = await getCurrentPrizePool();
      const total = await getTotalTicketsSold();
      
      setUserTickets(tickets);
      setPrizePool(pool);
      setTotalTickets(total);
    } catch (error) {
      console.error('Error loading lottery data:', error);
    }
  }, [user, getUserTickets, getCurrentPrizePool, getTotalTicketsSold]);

  useEffect(() => {
    loadLotteryData();
  }, [loadLotteryData]);

  const handlePurchaseTickets = async () => {
    if (!user) {
      Alert.alert('Error', 'Please log in to purchase tickets');
      return;
    }

    if (!user.hasFirstPurchase) {
      Alert.alert(
        'First Purchase Required',
        'You must make your first purchase of at least 100 USDT before accessing lottery features. Would you like to purchase MXI now?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Purchase MXI', onPress: () => router.push('/purchase') },
        ]
      );
      return;
    }

    const quantity = parseInt(ticketQuantity);
    if (isNaN(quantity) || quantity < 1) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    const totalCost = quantity * config.ticketPrice;
    
    if (user.balance < totalCost) {
      Alert.alert(
        'Insufficient Balance',
        `You need ${totalCost.toFixed(6)} MXI to purchase ${quantity} ticket(s). Your current balance is ${user.balance.toFixed(6)} MXI.`,
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
            try {
              const result = await purchaseTickets(
                user.id,
                user.username,
                user.uniqueIdentifier,
                quantity
              );

              if (result.success) {
                // Deduct balance
                await updateBalance(-totalCost, 'purchase');
                
                Alert.alert(
                  'Success',
                  `Successfully purchased ${quantity} ticket(s)! Good luck!`
                );
                
                // Reload data
                await loadLotteryData();
                setTicketQuantity('1');
              } else {
                Alert.alert('Error', result.message || 'Failed to purchase tickets');
              }
            } catch (error) {
              console.error('Error purchasing tickets:', error);
              Alert.alert('Error', 'Failed to purchase tickets');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const getNextDraw = () => {
    const nextDraw = getNextDrawDate();
    return nextDraw.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
      timeZoneName: 'short',
    });
  };

  const getProgressPercentage = () => {
    return Math.min((totalTickets / config.minTicketsForDraw) * 100, 100);
  };

  const getWinningProbability = () => {
    if (totalTickets === 0 || userTickets.length === 0) return 0;
    return (userTickets.length / totalTickets) * 100;
  };

  const getPrizeDistribution = () => {
    // Prize distribution among 4 winners based on total participants
    const firstPrize = prizePool * 0.50; // 50% to 1st place
    const secondPrize = prizePool * 0.30; // 30% to 2nd place
    const thirdPrize = prizePool * 0.15; // 15% to 3rd place
    const fourthPrize = prizePool * 0.05; // 5% to 4th place

    return [
      { position: '1st Place', amount: firstPrize },
      { position: '2nd Place', amount: secondPrize },
      { position: '3rd Place', amount: thirdPrize },
      { position: '4th Place', amount: fourthPrize },
    ];
  };

  // Check if user has made first purchase
  if (!user?.hasFirstPurchase) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>MXILUCKY</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.lockedCard}>
            <IconSymbol name="lock.fill" size={64} color={colors.warning} />
            <Text style={styles.lockedTitle}>Lottery Access Locked</Text>
            <Text style={styles.lockedDescription}>
              To unlock lottery features, you must make your first purchase of at least 100 USDT worth of MXI.
            </Text>
            
            <View style={styles.requirementBox}>
              <Text style={styles.requirementTitle}>Requirements:</Text>
              <Text style={styles.requirementText}>
                • First purchase: 100 USDT minimum
              </Text>
              <Text style={styles.requirementText}>
                • This unlocks both Mining and Lottery features
              </Text>
              <Text style={styles.requirementText}>
                • After unlocking, you can purchase lottery tickets
              </Text>
            </View>

            <Pressable 
              style={styles.unlockButton} 
              onPress={() => router.push('/purchase')}
            >
              <IconSymbol name="cart.fill" size={20} color={colors.background} />
              <Text style={styles.unlockButtonText}>Purchase MXI Now</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  const quickQuantities = [1, 5, 10, 25];
  const prizeDistribution = getPrizeDistribution();
  const winningProbability = getWinningProbability();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>MXILUCKY</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Prize Pool Card */}
        <View style={styles.prizeCard}>
          <View style={styles.prizeHeader}>
            <IconSymbol name="trophy.fill" size={48} color="#FFD700" />
            <Text style={styles.prizeTitle}>Current Prize Pool</Text>
          </View>
          
          <Text style={styles.prizeAmount}>{prizePool.toFixed(2)} MXI</Text>
          <Text style={styles.prizeUsd}>≈ ${(prizePool * mxiPrice).toFixed(2)} USD</Text>
          
          <View style={styles.divider} />
          
          <View style={styles.prizeInfo}>
            <View style={styles.prizeInfoItem}>
              <Text style={styles.prizeInfoLabel}>Winners</Text>
              <Text style={styles.prizeInfoValue}>{config.numberOfWinners}</Text>
            </View>
            <View style={styles.prizeInfoItem}>
              <Text style={styles.prizeInfoLabel}>Total Tickets</Text>
              <Text style={styles.prizeInfoValue}>{totalTickets}</Text>
            </View>
          </View>
        </View>

        {/* Prize Distribution Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <IconSymbol name="chart.pie.fill" size={28} color="#FFD700" />
            <Text style={styles.cardTitle}>Prize Distribution</Text>
          </View>
          
          {prizeDistribution.map((prize, index) => (
            <View key={index} style={styles.prizeDistributionRow}>
              <View style={styles.prizePosition}>
                <Text style={styles.prizePositionText}>{prize.position}</Text>
              </View>
              <View style={styles.prizeAmountContainer}>
                <Text style={styles.prizeDistributionAmount}>
                  {prize.amount.toFixed(2)} MXI
                </Text>
                <Text style={styles.prizeDistributionUsd}>
                  ≈ ${(prize.amount * mxiPrice).toFixed(2)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Your Winning Probability */}
        {userTickets.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <IconSymbol name="percent" size={28} color={colors.success} />
              <Text style={styles.cardTitle}>Your Winning Probability</Text>
            </View>
            
            <View style={styles.probabilityContainer}>
              <Text style={styles.probabilityValue}>
                {winningProbability.toFixed(2)}%
              </Text>
              <Text style={styles.probabilityText}>
                Based on {userTickets.length} ticket{userTickets.length !== 1 ? 's' : ''} out of {totalTickets} total
              </Text>
            </View>
          </View>
        )}

        {/* Draw Progress Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <IconSymbol name="clock.fill" size={28} color={colors.primary} />
            <Text style={styles.cardTitle}>Next Draw</Text>
          </View>
          
          <Text style={styles.drawDate}>{getNextDraw()}</Text>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${getProgressPercentage()}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {totalTickets} / {config.minTicketsForDraw} tickets sold
            </Text>
          </View>
          
          {totalTickets < config.minTicketsForDraw && (
            <Text style={styles.warningText}>
              Draw will only occur if minimum {config.minTicketsForDraw} tickets are sold
            </Text>
          )}
        </View>

        {/* Purchase Tickets Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <IconSymbol name="ticket.fill" size={28} color={colors.accent} />
            <Text style={styles.cardTitle}>Purchase Tickets</Text>
          </View>
          
          <View style={styles.ticketPriceBox}>
            <Text style={styles.ticketPriceLabel}>Price per ticket:</Text>
            <Text style={styles.ticketPriceValue}>
              {config.ticketPrice} MXI
            </Text>
          </View>

          <Text style={styles.inputLabel}>Quantity:</Text>
          <TextInput
            style={styles.input}
            value={ticketQuantity}
            onChangeText={setTicketQuantity}
            keyboardType="number-pad"
            placeholder="Enter quantity"
            placeholderTextColor={colors.textSecondary}
          />

          <View style={styles.quickButtons}>
            {quickQuantities.map((qty) => (
              <Pressable
                key={qty}
                style={styles.quickButton}
                onPress={() => setTicketQuantity(qty.toString())}
              >
                <Text style={styles.quickButtonText}>{qty}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.totalCostBox}>
            <Text style={styles.totalCostLabel}>Total Cost:</Text>
            <Text style={styles.totalCostValue}>
              {(parseInt(ticketQuantity || '0') * config.ticketPrice).toFixed(2)} MXI
            </Text>
          </View>

          <Pressable
            style={[styles.purchaseButton, loading && styles.purchaseButtonDisabled]}
            onPress={handlePurchaseTickets}
            disabled={loading}
          >
            <IconSymbol name="cart.fill" size={20} color={colors.background} />
            <Text style={styles.purchaseButtonText}>
              {loading ? 'Processing...' : 'Purchase Tickets'}
            </Text>
          </Pressable>
        </View>

        {/* My Tickets Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <IconSymbol name="list.bullet" size={28} color={colors.success} />
            <Text style={styles.cardTitle}>My Tickets</Text>
          </View>
          
          <View style={styles.myTicketsInfo}>
            <Text style={styles.myTicketsLabel}>Tickets for next draw:</Text>
            <Text style={styles.myTicketsValue}>{userTickets.length}</Text>
          </View>

          {userTickets.length > 0 ? (
            <View style={styles.ticketsList}>
              {userTickets.slice(0, 5).map((ticket) => (
                <View key={ticket.id} style={styles.ticketItem}>
                  <IconSymbol name="ticket" size={20} color={colors.primary} />
                  <Text style={styles.ticketNumber}>#{ticket.ticketNumber}</Text>
                  <Text style={styles.ticketId}>{ticket.id}</Text>
                </View>
              ))}
              {userTickets.length > 5 && (
                <Text style={styles.moreTickets}>
                  +{userTickets.length - 5} more tickets
                </Text>
              )}
            </View>
          ) : (
            <Text style={styles.noTicketsText}>
              You haven&apos;t purchased any tickets for the next draw yet.
            </Text>
          )}
        </View>

        {/* How It Works Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <IconSymbol name="info.circle.fill" size={28} color={colors.warning} />
            <Text style={styles.cardTitle}>How It Works</Text>
          </View>
          
          <Text style={styles.infoText}>
            • Draws occur every Friday at 20:00 UTC
          </Text>
          <Text style={styles.infoText}>
            • Minimum {config.minTicketsForDraw} tickets must be sold for draw to occur
          </Text>
          <Text style={styles.infoText}>
            • {config.numberOfWinners} winners share the prize pool
          </Text>
          <Text style={styles.infoText}>
            • Prize distribution: 50% (1st), 30% (2nd), 15% (3rd), 5% (4th)
          </Text>
          <Text style={styles.infoText}>
            • Your winning probability increases with more tickets
          </Text>
          <Text style={styles.infoText}>
            • Results are published at draw time
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
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  lockedCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.warning,
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
  requirementBox: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 20,
    width: '100%',
    marginBottom: 24,
  },
  requirementTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  requirementText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 4,
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
  prizeCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FFD700',
    alignItems: 'center',
  },
  prizeHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  prizeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
  },
  prizeAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFD700',
    marginBottom: 4,
  },
  prizeUsd: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  prizeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  prizeInfoItem: {
    alignItems: 'center',
  },
  prizeInfoLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  prizeInfoValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
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
  prizeDistributionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  prizePosition: {
    flex: 1,
  },
  prizePositionText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  prizeAmountContainer: {
    alignItems: 'flex-end',
  },
  prizeDistributionAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFD700',
  },
  prizeDistributionUsd: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  probabilityContainer: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 24,
  },
  probabilityValue: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.success,
    marginBottom: 8,
  },
  probabilityText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  drawDate: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.background,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  warningText: {
    fontSize: 12,
    color: colors.warning,
    textAlign: 'center',
    marginTop: 8,
  },
  ticketPriceBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  ticketPriceLabel: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  ticketPriceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  inputLabel: {
    fontSize: 15,
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
    marginBottom: 12,
  },
  quickButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  quickButton: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  totalCostBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  totalCostLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  totalCostValue: {
    fontSize: 20,
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
  myTicketsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  myTicketsLabel: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  myTicketsValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.success,
  },
  ticketsList: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
  },
  ticketItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  ticketNumber: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
    marginRight: 12,
  },
  ticketId: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
  },
  moreTickets: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  noTicketsText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 8,
  },
});
