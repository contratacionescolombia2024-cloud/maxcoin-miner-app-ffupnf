
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { useBinance } from '@/contexts/BinanceContext';
import { useMiningConfig } from '@/contexts/MiningConfigContext';
import { useLocalization } from '@/contexts/LocalizationContext';

export default function SendMXIScreen() {
  const { user, transferMXI } = useAuth();
  const { mxiRate, convertMXIToUSD, isConnected } = useBinance();
  const { config } = useMiningConfig();
  const { t } = useLocalization();
  
  const [recipientCode, setRecipientCode] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const mxiAmount = parseFloat(amount) || 0;
  const usdValue = convertMXIToUSD(mxiAmount);
  
  const commissionRate = config.level1Commission;
  const commissionAmount = (mxiAmount * commissionRate) / 100;
  const recipientReceives = mxiAmount - commissionAmount;

  const handleSendMXI = async () => {
    if (!user) return;

    if (!recipientCode.trim()) {
      Alert.alert(t('common.error'), 'Please enter recipient referral code');
      return;
    }

    if (!amount || isNaN(mxiAmount) || mxiAmount <= 0) {
      Alert.alert(t('common.error'), 'Please enter a valid amount');
      return;
    }

    if (mxiAmount > user.balance) {
      Alert.alert(t('common.error'), 'Insufficient balance');
      return;
    }

    if (!isConnected || !mxiRate) {
      Alert.alert(t('common.error'), 'Exchange rate unavailable. Please try again.');
      return;
    }

    setIsProcessing(true);

    try {
      const result = await transferMXI(
        recipientCode,
        mxiAmount,
        usdValue,
        description || undefined
      );

      if (result.success) {
        Alert.alert(
          'Transfer Successful',
          `Successfully transferred ${mxiAmount.toFixed(6)} MXI!\n\n` +
          `Recipient receives: ${result.recipientReceives?.toFixed(6)} MXI\n` +
          `Commission: ${result.commission?.toFixed(6)} MXI (${commissionRate}%)\n` +
          `USD Value: $${usdValue.toFixed(2)}\n` +
          `Exchange Rate: 1 MXI = $${mxiRate.price.toFixed(2)}\n\n` +
          `Transaction ID: TXN-${Date.now().toString(36).toUpperCase()}\n\n` +
          `Your unique identifier: ${user.uniqueIdentifier}`,
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert(t('common.error'), result.message || 'Transfer failed');
      }
    } catch (error) {
      console.error('Error sending MXI:', error);
      Alert.alert(t('common.error'), 'Transfer failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <IconSymbol name="arrow.left.arrow.right.circle.fill" size={80} color={colors.primary} />
          <Text style={styles.title}>Send MXI</Text>
          <Text style={styles.subtitle}>Transfer MXI to another user using their unique referral code</Text>
        </View>

        {/* User Code Info Card */}
        <View style={styles.userCodeCard}>
          <View style={styles.userCodeHeader}>
            <IconSymbol name="person.text.rectangle.fill" size={24} color={colors.primary} />
            <Text style={styles.userCodeTitle}>Your Unique Codes</Text>
          </View>
          <View style={styles.userCodeRow}>
            <Text style={styles.userCodeLabel}>Referral Code:</Text>
            <Text style={styles.userCodeValue}>{user.referralCode}</Text>
          </View>
          <View style={styles.userCodeRow}>
            <Text style={styles.userCodeLabel}>User ID:</Text>
            <Text style={styles.userCodeValue}>{user.uniqueIdentifier}</Text>
          </View>
          <Text style={styles.userCodeNote}>
            Others can send you MXI using your referral code
          </Text>
        </View>

        {isConnected && mxiRate && (
          <View style={styles.rateCard}>
            <View style={styles.rateHeader}>
              <IconSymbol name="chart.line.uptrend.xyaxis" size={24} color={colors.success} />
              <Text style={styles.rateTitle}>Current Exchange Rate</Text>
            </View>
            <View style={styles.rateContent}>
              <Text style={styles.rateValue}>
                1 MXI = ${mxiRate.price.toFixed(2)} USD
              </Text>
              <View style={[
                styles.rateChange,
                { backgroundColor: mxiRate.priceChangePercent24h >= 0 ? colors.success + '20' : colors.danger + '20' }
              ]}>
                <Text style={[
                  styles.rateChangeText,
                  { color: mxiRate.priceChangePercent24h >= 0 ? colors.success : colors.danger }
                ]}>
                  {mxiRate.priceChangePercent24h >= 0 ? '+' : ''}
                  {mxiRate.priceChangePercent24h.toFixed(2)}% (24h)
                </Text>
              </View>
            </View>
            <Text style={styles.rateUpdate}>
              Last update: {mxiRate.lastUpdate.toLocaleTimeString()}
            </Text>
          </View>
        )}

        {!isConnected && (
          <View style={styles.warningCard}>
            <IconSymbol name="exclamationmark.triangle.fill" size={24} color={colors.danger} />
            <Text style={styles.warningText}>Not connected to Binance. Exchange rates unavailable.</Text>
          </View>
        )}

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>{user.balance.toFixed(6)} MXI</Text>
          {isConnected && mxiRate && (
            <Text style={styles.balanceUSD}>
              ≈ ${convertMXIToUSD(user.balance).toFixed(2)} USD
            </Text>
          )}
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Recipient Referral Code</Text>
          <View style={styles.inputContainer}>
            <IconSymbol name="person.circle.fill" size={24} color={colors.textSecondary} />
            <TextInput
              style={styles.input}
              value={recipientCode}
              onChangeText={setRecipientCode}
              placeholder="Enter recipient's referral code"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="characters"
            />
          </View>
          <Text style={styles.helperText}>
            Ask the recipient for their referral code to send MXI
          </Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Amount</Text>
          <View style={styles.inputContainer}>
            <IconSymbol name="bitcoinsign.circle.fill" size={24} color={colors.primary} />
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.000000"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
            />
            <Text style={styles.currency}>MXI</Text>
          </View>
          {mxiAmount > 0 && isConnected && mxiRate && (
            <Text style={styles.helperText}>
              ≈ ${usdValue.toFixed(2)} USD at current rate
            </Text>
          )}
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.descriptionInput]}
            value={description}
            onChangeText={setDescription}
            placeholder="Add a note for this transfer"
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={3}
          />
        </View>

        {mxiAmount > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Transaction Summary</Text>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Sending Amount</Text>
              <Text style={styles.summaryValue}>{mxiAmount.toFixed(6)} MXI</Text>
            </View>

            {isConnected && mxiRate && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>USD Value</Text>
                <Text style={styles.summaryValue}>${usdValue.toFixed(2)}</Text>
              </View>
            )}

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Commission ({commissionRate}%)
              </Text>
              <Text style={[styles.summaryValue, { color: colors.danger }]}>
                -{commissionAmount.toFixed(6)} MXI
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabelBold}>Recipient Receives</Text>
              <Text style={styles.summaryValueBold}>
                {recipientReceives.toFixed(6)} MXI
              </Text>
            </View>

            {isConnected && mxiRate && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Recipient USD Value</Text>
                <Text style={styles.summaryValue}>
                  ≈ ${convertMXIToUSD(recipientReceives).toFixed(2)} USD
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.infoCard}>
          <IconSymbol name="info.circle.fill" size={24} color={colors.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>About User Code Transfers</Text>
            <Text style={styles.infoText}>
              - A {commissionRate}% commission is deducted from transfers and distributed to your referral chain
            </Text>
            <Text style={styles.infoText}>
              - The recipient can withdraw the received MXI immediately
            </Text>
            <Text style={styles.infoText}>
              - Transfers are instant and processed through the database
            </Text>
            <Text style={styles.infoText}>
              - Make sure you have the correct referral code before sending
            </Text>
          </View>
        </View>

        <View style={styles.buttonGroup}>
          <Pressable
            style={[
              styles.button,
              styles.primaryButton,
              (isProcessing || !isConnected || mxiAmount <= 0) && styles.buttonDisabled,
            ]}
            onPress={handleSendMXI}
            disabled={isProcessing || !isConnected || mxiAmount <= 0}
          >
            <IconSymbol name="paperplane.fill" size={20} color="#ffffff" />
            <Text style={styles.buttonText}>
              {isProcessing ? 'Processing...' : 'Send MXI'}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.secondaryButton]}
            onPress={() => router.back()}
            disabled={isProcessing}
          >
            <Text style={[styles.buttonText, { color: colors.text }]}>
              Cancel
            </Text>
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
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  userCodeCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  userCodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  userCodeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  userCodeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  userCodeLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  userCodeValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: 'monospace',
  },
  userCodeNote: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 12,
    lineHeight: 18,
  },
  rateCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  rateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  rateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  rateContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rateValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
  },
  rateChange: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rateChangeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  rateUpdate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.danger + '20',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 16,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: colors.danger,
    fontWeight: '600',
  },
  balanceCard: {
    backgroundColor: colors.highlight,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 4,
  },
  balanceUSD: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  formSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.highlight,
    paddingHorizontal: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 14,
  },
  descriptionInput: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.highlight,
    padding: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  currency: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  helperText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  summaryLabelBold: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  summaryValueBold: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.success,
  },
  divider: {
    height: 1,
    backgroundColor: colors.background,
    marginVertical: 12,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.highlight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 4,
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
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
