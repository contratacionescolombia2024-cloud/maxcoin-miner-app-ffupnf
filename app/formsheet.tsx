
import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Pressable,
  TextInput,
  Alert,
  ScrollView 
} from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';

export default function FormSheetModal() {
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [binanceAddress, setBinanceAddress] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    
    if (!withdrawAmount || isNaN(amount) || amount <= 0) {
      Alert.alert(
        "Invalid Amount",
        "Please enter a valid withdrawal amount",
        [{ text: "OK" }]
      );
      return;
    }

    if (!binanceAddress.trim()) {
      Alert.alert(
        "Missing Address",
        "Please enter your Binance wallet address",
        [{ text: "OK" }]
      );
      return;
    }

    setIsProcessing(true);
    
    // Simulate withdrawal process
    setTimeout(() => {
      setIsProcessing(false);
      Alert.alert(
        "Withdrawal Initiated",
        `Your withdrawal of ${amount} MXI to ${binanceAddress.substring(0, 10)}... has been initiated. (Simulated)`,
        [
          { 
            text: "OK", 
            onPress: () => router.back() 
          }
        ]
      );
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.grabber} />
        <Text style={styles.title}>Withdraw MXI</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <View style={styles.infoCard}>
          <IconSymbol name="info.circle.fill" size={24} color={colors.primary} />
          <Text style={styles.infoText}>
            Withdraw your mined Maxcoin MXI to your Binance wallet. Minimum withdrawal: 0.1 MXI
          </Text>
        </View>

        {/* Withdrawal Form */}
        <View style={styles.formSection}>
          <Text style={styles.label}>Withdrawal Amount</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
              placeholder="0.0000"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
            />
            <Text style={styles.currency}>MXI</Text>
          </View>
          <Text style={styles.helperText}>Available balance: 0.0000 MXI</Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Binance Wallet Address</Text>
          <TextInput
            style={[styles.input, styles.addressInput]}
            value={binanceAddress}
            onChangeText={setBinanceAddress}
            placeholder="Enter your Binance wallet address"
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={3}
          />
          <Text style={styles.helperText}>
            Make sure this address is correct. Transactions cannot be reversed.
          </Text>
        </View>

        {/* Fee Information */}
        <View style={styles.feeCard}>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Network Fee</Text>
            <Text style={styles.feeValue}>0.0001 MXI</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>You will receive</Text>
            <Text style={styles.feeValueBold}>
              {withdrawAmount ? (parseFloat(withdrawAmount) - 0.0001).toFixed(4) : '0.0000'} MXI
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonGroup}>
          <Pressable 
            style={[styles.button, styles.primaryButton]}
            onPress={handleWithdraw}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Text style={styles.buttonText}>Processing...</Text>
            ) : (
              <>
                <IconSymbol name="arrow.up.circle.fill" size={20} color="#ffffff" />
                <Text style={styles.buttonText}>Confirm Withdrawal</Text>
              </>
            )}
          </Pressable>

          <Pressable 
            style={[styles.button, styles.secondaryButton]}
            onPress={() => router.back()}
            disabled={isProcessing}
          >
            <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
          </Pressable>
        </View>

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <IconSymbol name="lock.shield.fill" size={20} color={colors.success} />
          <Text style={styles.securityText}>
            Your transaction is secured with end-to-end encryption
          </Text>
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
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.highlight,
  },
  grabber: {
    width: 40,
    height: 4,
    backgroundColor: colors.textSecondary,
    borderRadius: 2,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.highlight,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  formSection: {
    marginBottom: 24,
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
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: colors.text,
    paddingVertical: 14,
  },
  addressInput: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.highlight,
    padding: 14,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  currency: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
  },
  helperText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
  },
  feeCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feeLabel: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  feeValue: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  feeValueBold: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: colors.background,
    marginVertical: 12,
  },
  buttonGroup: {
    gap: 12,
    marginBottom: 20,
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
    borderColor: colors.highlight,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
  },
  securityText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
