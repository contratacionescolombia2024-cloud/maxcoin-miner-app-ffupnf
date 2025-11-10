
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalization } from '@/contexts/LocalizationContext';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

export default function PaymentMethodsScreen() {
  const { purchaseMaxcoin, recordFirstPurchase, user, refreshUser } = useAuth();
  const { t } = useLocalization();
  const params = useLocalSearchParams();
  const amount = parseFloat(params.amount as string) || 0;
  const usdValue = parseFloat(params.usdValue as string) || 0;
  
  const [processing, setProcessing] = useState(false);

  console.log('💳 PaymentMethodsScreen - Amount:', amount, 'MXI | USD Value:', usdValue, 'USDT');

  const handleProceedToPayment = async () => {
    if (processing) {
      console.log('⚠️ Payment already in progress, ignoring duplicate press');
      return;
    }

    console.log('💳 Confirming payment - Amount:', amount, 'MXI | USD Value:', usdValue, 'USDT');
    
    Alert.alert(
      'Confirmar Compra',
      `Estás a punto de comprar ${amount.toFixed(6)} MXI por $${usdValue.toFixed(2)} USDT vía Binance Pay.\n\n⚠️ MODO DE PRUEBA: El pago se simulará automáticamente.\n\n¿Proceder con el pago?`,
      [
        { 
          text: 'Cancelar', 
          style: 'cancel',
          onPress: () => console.log('❌ User cancelled payment')
        },
        {
          text: 'Confirmar',
          onPress: async () => {
            console.log('✅ User confirmed payment, starting process...');
            await processBinancePayment();
          },
        },
      ]
    );
  };

  const processBinancePayment = async () => {
    console.log('🔄 Processing Binance payment...');
    setProcessing(true);
    
    try {
      // Simulate Binance payment processing (temporary for testing)
      console.log('⏳ Simulating payment delay...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('✅ Payment simulation complete, updating balance...');
      
      // Complete the purchase
      await purchaseMaxcoin(amount);
      console.log('✅ Balance updated with amount:', amount, 'MXI');
      
      // Record first purchase for referral tracking
      await recordFirstPurchase(usdValue);
      console.log('✅ First purchase recorded with USD value:', usdValue, 'USDT');
      
      // Refresh user data to get latest state
      await refreshUser();
      console.log('✅ User data refreshed');
      
      let successMessage = `✅ ¡Compra exitosa de ${amount.toFixed(6)} MXI!\n\nTu nuevo saldo ha sido actualizado.`;
      
      // Check if user still needs to make unlock payment
      if (!user?.unlockPaymentMade) {
        successMessage += '\n\n📌 Nota: Para acceder a las funciones de Minería y Lotería, necesitas hacer el pago de desbloqueo de 100 USDT por separado.';
      }
      
      console.log('🎉 Payment successful, showing success alert');
      
      Alert.alert(
        '🎉 ¡Éxito!',
        successMessage,
        [
          {
            text: 'OK',
            onPress: () => {
              console.log('📱 Navigating to home screen');
              setProcessing(false);
              router.replace('/(tabs)/(home)');
            },
          },
        ]
      );
    } catch (error) {
      console.error('❌ Error processing payment:', error);
      setProcessing(false);
      Alert.alert(
        'Error', 
        'El procesamiento del pago falló. Por favor, inténtalo de nuevo.',
        [
          {
            text: 'OK',
            onPress: () => {
              console.log('User acknowledged error');
            }
          }
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Método de Pago</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Purchase Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.iconContainer}>
            <IconSymbol name="cart.fill" size={64} color={colors.accent} />
          </View>
          
          <Text style={styles.summaryTitle}>Resumen de Compra</Text>
          
          <View style={styles.amountDisplay}>
            <Text style={styles.amountMXI}>{amount.toFixed(6)} MXI</Text>
            <Text style={styles.amountUSD}>${usdValue.toFixed(2)} USDT</Text>
          </View>
          
          {!user?.unlockPaymentMade && (
            <View style={styles.unlockNotice}>
              <IconSymbol name="info.circle.fill" size={24} color={colors.primary} />
              <Text style={styles.unlockNoticeText}>
                Esta es una compra de poder de minería. Para desbloquear las funciones de Minería y Lotería, realiza el pago de desbloqueo de 100 USDT por separado.
              </Text>
            </View>
          )}
        </View>

        {/* Payment Method Card */}
        <View style={styles.paymentCard}>
          <Text style={styles.sectionTitle}>Método de Pago</Text>
          
          <View style={styles.methodCard}>
            <View style={styles.methodIcon}>
              <IconSymbol name="bitcoinsign.circle.fill" size={48} color="#F3BA2F" />
            </View>
            
            <View style={styles.methodInfo}>
              <Text style={styles.methodName}>Binance Pay</Text>
              <Text style={styles.methodDescription}>
                Pago seguro de criptomonedas vía Binance
              </Text>
              <View style={styles.onlyMethodBadge}>
                <Text style={styles.onlyMethodText}>ÚNICO MÉTODO DE PAGO</Text>
              </View>
            </View>
            
            <IconSymbol name="checkmark.circle.fill" size={32} color={colors.success} />
          </View>

          <View style={styles.infoBox}>
            <IconSymbol name="info.circle.fill" size={20} color={colors.primary} />
            <Text style={styles.infoBoxText}>
              Todos los pagos se procesan de forma segura a través de Binance Pay usando USDT. Este es el único método de pago disponible.
            </Text>
          </View>
        </View>

        {/* Important Notes */}
        <View style={styles.notesCard}>
          <View style={styles.notesHeader}>
            <IconSymbol name="exclamationmark.triangle.fill" size={24} color={colors.warning} />
            <Text style={styles.notesTitle}>Información Importante</Text>
          </View>
          
          <Text style={styles.noteText}>
            - Solo Binance Pay (USDT) está disponible para pagos
          </Text>
          <Text style={styles.noteText}>
            - Los MXI comprados se pueden retirar inmediatamente
          </Text>
          <Text style={styles.noteText}>
            - Las comisiones de referidos se distribuyen automáticamente
          </Text>
          <Text style={styles.noteText}>
            - Esto es solo para compras de poder de minería
          </Text>
          <Text style={styles.noteText}>
            - El poder de minería aumenta con compras USDT (1% por 10 USDT)
          </Text>
          <Text style={styles.noteText}>
            - El pago de desbloqueo (100 USDT) es separado y requerido para Minería/Lotería
          </Text>
          <Text style={styles.noteText}>
            - Todas las transacciones se registran en tu historial
          </Text>
          <Text style={styles.noteText}>
            - ⚠️ MODO DE PRUEBA: El pago se simulará automáticamente
          </Text>
        </View>

        {/* Proceed Button */}
        <Pressable
          style={[
            styles.proceedButton,
            processing && styles.proceedButtonDisabled,
          ]}
          onPress={handleProceedToPayment}
          disabled={processing}
        >
          {processing ? (
            <>
              <IconSymbol name="hourglass" size={20} color={colors.background} />
              <Text style={styles.proceedButtonText}>Procesando Pago...</Text>
            </>
          ) : (
            <>
              <IconSymbol name="arrow.right.circle.fill" size={20} color={colors.background} />
              <Text style={styles.proceedButtonText}>Pagar ${usdValue.toFixed(2)} USDT</Text>
            </>
          )}
        </Pressable>

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
  summaryCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: colors.accent,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 20,
  },
  amountDisplay: {
    alignItems: 'center',
    marginBottom: 20,
  },
  amountMXI: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 8,
  },
  amountUSD: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
  },
  unlockNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 2,
    borderColor: '#FFD700',
    gap: 12,
  },
  unlockNoticeText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  paymentCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  methodCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.success,
    marginBottom: 16,
  },
  methodIcon: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  methodDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  onlyMethodBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  onlyMethodText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.background,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.highlight,
    borderRadius: 10,
    padding: 14,
    gap: 12,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    lineHeight: 19,
  },
  notesCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  noteText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 8,
  },
  proceedButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  proceedButtonDisabled: {
    backgroundColor: colors.textSecondary,
    opacity: 0.5,
  },
  proceedButtonText: {
    color: colors.background,
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 10,
  },
});
