
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

export default function PurchaseScreen() {
  const { amount } = useLocalSearchParams<{ amount: string }>();
  const { purchaseMaxcoin, user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const purchaseAmount = parseFloat(amount || '10');
  const miningPowerIncrease = (purchaseAmount / 10) * 0.1;
  const newMiningPower = (user?.miningPower || 1) + miningPowerIncrease;

  const handlePurchase = async () => {
    setIsProcessing(true);

    // Simulate payment processing
    setTimeout(async () => {
      await purchaseMaxcoin(purchaseAmount);
      setIsProcessing(false);

      Alert.alert(
        'Purchase Successful!',
        `You have purchased ${purchaseAmount} MXI!\n\nYour mining power has increased to ${newMiningPower.toFixed(2)}x`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    }, 1500);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <IconSymbol name="cart.fill" size={80} color={colors.primary} />
          <Text style={styles.title}>Purchase Maxcoin</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Purchase Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount</Text>
            <Text style={styles.detailValue}>{purchaseAmount} MXI</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Current Mining Power</Text>
            <Text style={styles.detailValue}>{(user?.miningPower || 1).toFixed(2)}x</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Mining Power Increase</Text>
            <Text style={[styles.detailValue, { color: colors.success }]}>
              +{miningPowerIncrease.toFixed(2)}x
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabelBold}>New Mining Power</Text>
            <Text style={styles.detailValueBold}>{newMiningPower.toFixed(2)}x</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Referral Bonuses</Text>
          <Text style={styles.cardSubtitle}>
            Your referrers will receive bonuses from this purchase:
          </Text>

          <View style={styles.bonusItem}>
            <IconSymbol name="person.fill" size={24} color={colors.primary} />
            <View style={styles.bonusInfo}>
              <Text style={styles.bonusLabel}>Direct Referrer</Text>
              <Text style={styles.bonusValue}>
                +{(purchaseAmount * 0.05).toFixed(4)} MXI (5%)
              </Text>
            </View>
          </View>

          <View style={styles.bonusItem}>
            <IconSymbol name="person.2.fill" size={24} color={colors.secondary} />
            <View style={styles.bonusInfo}>
              <Text style={styles.bonusLabel}>Second-Level Referrer</Text>
              <Text style={styles.bonusValue}>
                +{(purchaseAmount * 0.02).toFixed(4)} MXI (2%)
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <IconSymbol name="info.circle.fill" size={24} color={colors.primary} />
          <Text style={styles.infoText}>
            This is a simulated purchase. In production, this would integrate with a real payment processor.
          </Text>
        </View>

        <View style={styles.buttonGroup}>
          <Pressable
            style={[styles.button, styles.primaryButton, isProcessing && styles.buttonDisabled]}
            onPress={handlePurchase}
            disabled={isProcessing}
          >
            <IconSymbol name="checkmark.circle.fill" size={20} color="#ffffff" />
            <Text style={styles.buttonText}>
              {isProcessing ? 'Processing...' : `Purchase ${purchaseAmount} MXI`}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.secondaryButton]}
            onPress={() => router.back()}
            disabled={isProcessing}
          >
            <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginTop: 16,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  detailLabelBold: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  detailValueBold: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.background,
    marginVertical: 8,
  },
  bonusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  bonusInfo: {
    flex: 1,
  },
  bonusLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  bonusValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.success,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.highlight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  buttonGroup: {
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.textSecondary,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
