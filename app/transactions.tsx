
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth, Transaction } from '@/contexts/AuthContext';
import { useBinance } from '@/contexts/BinanceContext';

export default function TransactionsScreen() {
  const { user, getTransactionHistory } = useAuth();
  const { convertMXIToUSD } = useBinance();
  
  const transactions = getTransactionHistory();

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'transfer':
        return 'arrow.left.arrow.right.circle.fill';
      case 'purchase':
        return 'cart.fill';
      case 'mining':
        return 'hammer.fill';
      case 'commission':
        return 'gift.fill';
      case 'withdrawal':
        return 'arrow.up.circle.fill';
      default:
        return 'circle.fill';
    }
  };

  const getTransactionColor = (type: string, amount: number) => {
    if (amount > 0) return colors.success;
    if (amount < 0) return colors.danger;
    return colors.textSecondary;
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Calculate metrics
  const calculateMetrics = () => {
    let miningEarnings = 0;
    let commissionEarnings = 0;
    let purchasedAmount = 0;

    transactions.forEach(tx => {
      if (tx.type === 'mining' && tx.amount > 0) {
        miningEarnings += tx.amount;
      } else if (tx.type === 'commission' && tx.amount > 0) {
        commissionEarnings += tx.amount;
      } else if (tx.type === 'purchase' && tx.amount > 0) {
        purchasedAmount += tx.amount;
      }
    });

    return {
      miningEarnings,
      commissionEarnings,
      purchasedAmount,
    };
  };

  const metrics = calculateMetrics();
  const availableForWithdrawal = user?.withdrawalRestrictions 
    ? user.withdrawalRestrictions.purchasedAmount + 
      user.withdrawalRestrictions.commissionEarnings + 
      (user.withdrawalRestrictions.canWithdrawEarnings ? user.withdrawalRestrictions.miningEarnings : 0)
    : 0;

  if (!user) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Transactions & Metrics</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Metrics Summary Card */}
          <View style={styles.metricsCard}>
            <Text style={styles.metricsTitle}>Your Metrics</Text>
            
            <View style={styles.metricRow}>
              <View style={styles.metricItem}>
                <IconSymbol name="hammer.fill" size={24} color={colors.primary} />
                <Text style={styles.metricLabel}>MXI Mined</Text>
                <Text style={styles.metricValue}>{metrics.miningEarnings.toFixed(6)}</Text>
                <Text style={styles.metricUsd}>
                  ≈ ${convertMXIToUSD(metrics.miningEarnings).toFixed(2)}
                </Text>
              </View>

              <View style={styles.metricDivider} />

              <View style={styles.metricItem}>
                <IconSymbol name="gift.fill" size={24} color={colors.success} />
                <Text style={styles.metricLabel}>MXI from Commissions</Text>
                <Text style={styles.metricValue}>{metrics.commissionEarnings.toFixed(6)}</Text>
                <Text style={styles.metricUsd}>
                  ≈ ${convertMXIToUSD(metrics.commissionEarnings).toFixed(2)}
                </Text>
              </View>
            </View>

            <View style={styles.dividerLine} />

            <View style={styles.balanceSection}>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>Current Balance:</Text>
                <Text style={styles.balanceValue}>{user.balance.toFixed(6)} MXI</Text>
              </View>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>Available for Withdrawal:</Text>
                <Text style={[styles.balanceValue, { color: colors.success }]}>
                  {availableForWithdrawal.toFixed(6)} MXI
                </Text>
              </View>
            </View>

            <View style={styles.infoBox}>
              <IconSymbol name="info.circle.fill" size={16} color={colors.primary} />
              <Text style={styles.infoText}>
                Commissions are available for immediate withdrawal. Mining earnings require 10 active referrals for the first 5 withdrawals.
              </Text>
            </View>
          </View>

          {/* Withdrawal Status Card */}
          <View style={styles.statusCard}>
            <Text style={styles.statusTitle}>Withdrawal Status</Text>
            
            <View style={styles.statusRow}>
              <View style={styles.statusItem}>
                <View style={styles.statusIndicator}>
                  <IconSymbol name="checkmark.circle.fill" size={20} color={colors.success} />
                </View>
                <View style={styles.statusInfo}>
                  <Text style={styles.statusLabel}>Purchased MXI</Text>
                  <Text style={styles.statusValue}>{metrics.purchasedAmount.toFixed(6)} MXI</Text>
                  <Text style={styles.statusNote}>Always available</Text>
                </View>
              </View>
            </View>

            <View style={styles.statusRow}>
              <View style={styles.statusItem}>
                <View style={styles.statusIndicator}>
                  <IconSymbol name="checkmark.circle.fill" size={20} color={colors.success} />
                </View>
                <View style={styles.statusInfo}>
                  <Text style={styles.statusLabel}>Commission Earnings</Text>
                  <Text style={styles.statusValue}>{metrics.commissionEarnings.toFixed(6)} MXI</Text>
                  <Text style={styles.statusNote}>Immediate withdrawal</Text>
                </View>
              </View>
            </View>

            <View style={styles.statusRow}>
              <View style={styles.statusItem}>
                <View style={styles.statusIndicator}>
                  <IconSymbol 
                    name={user.withdrawalRestrictions?.canWithdrawEarnings ? "checkmark.circle.fill" : "clock.fill"} 
                    size={20} 
                    color={user.withdrawalRestrictions?.canWithdrawEarnings ? colors.success : colors.warning} 
                  />
                </View>
                <View style={styles.statusInfo}>
                  <Text style={styles.statusLabel}>Mining Earnings</Text>
                  <Text style={styles.statusValue}>{metrics.miningEarnings.toFixed(6)} MXI</Text>
                  <Text style={styles.statusNote}>
                    {user.withdrawalRestrictions?.canWithdrawEarnings 
                      ? 'Available for withdrawal' 
                      : 'Requires 10 active referrals'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Transaction History */}
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Transaction History</Text>
            <Text style={styles.historyCount}>{transactions.length} transactions</Text>
          </View>

          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol name="tray.fill" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>No Transactions Yet</Text>
              <Text style={styles.emptyText}>
                Your transaction history will appear here
              </Text>
            </View>
          ) : (
            <View style={styles.transactionsList}>
              {transactions.map((transaction) => (
                <View key={transaction.id} style={styles.transactionCard}>
                  <View style={styles.transactionHeader}>
                    <View style={styles.transactionIconContainer}>
                      <IconSymbol
                        name={getTransactionIcon(transaction.type)}
                        size={24}
                        color={getTransactionColor(transaction.type, transaction.amount)}
                      />
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionType}>
                        {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                      </Text>
                      <Text style={styles.transactionDate}>
                        {formatDate(transaction.timestamp)}
                      </Text>
                    </View>
                    <View style={styles.transactionAmount}>
                      <Text
                        style={[
                          styles.transactionAmountText,
                          { color: getTransactionColor(transaction.type, transaction.amount) },
                        ]}
                      >
                        {transaction.amount > 0 ? '+' : ''}
                        {transaction.amount.toFixed(6)} MXI
                      </Text>
                      {transaction.usdValue && (
                        <Text style={styles.transactionUSD}>
                          ${transaction.usdValue.toFixed(2)}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Transaction Details */}
                  {(transaction.description || transaction.from || transaction.to || transaction.commission) && (
                    <View style={styles.transactionDetails}>
                      {transaction.description && (
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Description:</Text>
                          <Text style={styles.detailValue}>{transaction.description}</Text>
                        </View>
                      )}
                      
                      {transaction.from && (
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>From:</Text>
                          <Text style={styles.detailValue} numberOfLines={1}>
                            {transaction.from}
                          </Text>
                        </View>
                      )}
                      
                      {transaction.to && (
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>To:</Text>
                          <Text style={styles.detailValue} numberOfLines={1}>
                            {transaction.to}
                          </Text>
                        </View>
                      )}
                      
                      {transaction.commission && (
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Commission:</Text>
                          <Text style={styles.detailValue}>
                            {transaction.commission.toFixed(6)} MXI ({transaction.commissionRate}%)
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
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
    paddingBottom: 16,
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
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  metricsCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  metricsTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 20,
  },
  metricRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    backgroundColor: colors.background,
    marginHorizontal: 16,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    marginBottom: 8,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  metricUsd: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  dividerLine: {
    height: 1,
    backgroundColor: colors.background,
    marginVertical: 16,
  },
  balanceSection: {
    gap: 12,
    marginBottom: 16,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.highlight,
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: colors.text,
    lineHeight: 18,
  },
  statusCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  statusRow: {
    marginBottom: 16,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  statusIndicator: {
    marginTop: 2,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 2,
  },
  statusNote: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  historyCount: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  transactionsList: {
    gap: 12,
  },
  transactionCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.highlight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionAmountText: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  transactionUSD: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  transactionDetails: {
    borderTopWidth: 1,
    borderTopColor: colors.background,
    paddingTop: 12,
    marginTop: 12,
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    minWidth: 90,
  },
  detailValue: {
    flex: 1,
    fontSize: 12,
    color: colors.text,
    fontFamily: 'monospace',
  },
});
