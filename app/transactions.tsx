
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

  if (!user) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="arrow.left" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Transaction History</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Transactions</Text>
                <Text style={styles.summaryValue}>{transactions.length}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Current Balance</Text>
                <Text style={styles.summaryValue}>{user.balance.toFixed(6)} MXI</Text>
              </View>
            </View>
          </View>

          {/* Transactions List */}
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

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Transaction ID:</Text>
                      <Text style={styles.detailValue} numberOfLines={1}>
                        {transaction.id}
                      </Text>
                    </View>

                    <View style={styles.statusBadge}>
                      <IconSymbol
                        name={transaction.status === 'completed' ? 'checkmark.circle.fill' : 'clock.fill'}
                        size={14}
                        color={transaction.status === 'completed' ? colors.success : colors.warning}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          { color: transaction.status === 'completed' ? colors.success : colors.warning },
                        ]}
                      >
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </Text>
                    </View>
                  </View>
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.highlight,
  },
  backButton: {
    padding: 8,
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
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.background,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
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
    gap: 16,
  },
  transactionCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  transactionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.highlight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionAmountText: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  transactionUSD: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  transactionDetails: {
    borderTopWidth: 1,
    borderTopColor: colors.background,
    paddingTop: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
    minWidth: 100,
  },
  detailValue: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    fontFamily: 'monospace',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: colors.highlight,
    marginTop: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
