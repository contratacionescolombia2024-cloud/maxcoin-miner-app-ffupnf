
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useBinance } from '@/contexts/BinanceContext';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

const UNLOCK_COST_USDT = 100;

export default function UnlockPaymentScreen() {
  const { user, recordUnlockPayment, purchaseMaxcoin, refreshUser } = useAuth();
  const { mxiPrice } = useBinance();
  const [processing, setProcessing] = useState(false);

  const mxiAmount = UNLOCK_COST_USDT / mxiPrice;

  const handlePurchase = async () => {
    if (!user) {
      Alert.alert('Error', 'Por favor inicia sesión para continuar');
      return;
    }

    if (processing) {
      console.log('⚠️ Payment already in progress, ignoring duplicate press');
      return;
    }

    console.log('🔓 Confirming unlock payment - Amount:', mxiAmount, 'MXI | USD Value:', UNLOCK_COST_USDT, 'USDT');

    Alert.alert(
      'Confirmar Pago de Desbloqueo',
      `Estás a punto de pagar ${UNLOCK_COST_USDT} USDT (${mxiAmount.toFixed(6)} MXI) para desbloquear las funciones de Minería y Lotería.\n\nEste es un pago único que desbloquea todas las funciones permanentemente.\n\n⚠️ MODO DE PRUEBA: El pago se simulará automáticamente.\n\n¿Proceder con el pago?`,
      [
        { 
          text: 'Cancelar', 
          style: 'cancel',
          onPress: () => console.log('❌ User cancelled unlock payment')
        },
        {
          text: 'Confirmar',
          onPress: async () => {
            console.log('✅ User confirmed unlock payment, starting process...');
            await processUnlockPayment();
          },
        },
      ]
    );
  };

  const processUnlockPayment = async () => {
    console.log('🔄 Processing unlock payment...');
    setProcessing(true);
    
    try {
      // Simulate Binance payment processing (temporary for testing)
      console.log('⏳ Simulating payment delay...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('✅ Payment simulation complete, updating balance...');
      
      // Add MXI to user balance
      await purchaseMaxcoin(mxiAmount);
      console.log('✅ Balance updated with MXI amount:', mxiAmount);
      
      // Record the unlock payment
      await recordUnlockPayment();
      console.log('✅ Unlock payment recorded successfully');
      
      // Refresh user data to get latest state
      await refreshUser();
      console.log('✅ User data refreshed');
      
      console.log('🎉 Unlock payment successful, showing success alert');
      
      Alert.alert(
        '🎉 ¡Éxito!',
        `¡Felicitaciones! Has desbloqueado exitosamente las funciones de Minería y Lotería!\n\nRecibiste ${mxiAmount.toFixed(6)} MXI en tu cuenta.\n\nAhora puedes:\n- Acceder al Panel de Minería\n- Comprar boletos de lotería\n- Comenzar a ganar MXI a través de la minería`,
        [
          {
            text: 'Ir al Panel de Minería',
            onPress: () => {
              console.log('📱 Navigating to mining panel');
              setProcessing(false);
              router.replace('/mining-panel');
            },
          },
        ]
      );
    } catch (error) {
      console.error('❌ Error processing unlock payment:', error);
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

  // If already unlocked, redirect
  if (user?.unlockPaymentMade) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Desbloquear Funciones</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.alreadyUnlockedCard}>
            <IconSymbol name="checkmark.circle.fill" size={80} color={colors.success} />
            <Text style={styles.alreadyUnlockedTitle}>¡Ya Desbloqueado!</Text>
            <Text style={styles.alreadyUnlockedDescription}>
              Ya has realizado el pago de desbloqueo. Todas las funciones están disponibles para ti.
            </Text>
            
            <Pressable 
              style={styles.goToMiningButton} 
              onPress={() => router.push('/mining-panel')}
            >
              <IconSymbol name="arrow.right.circle.fill" size={20} color={colors.background} />
              <Text style={styles.goToMiningButtonText}>Ir al Panel de Minería</Text>
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
        <Text style={styles.headerTitle}>Desbloquear Funciones</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.iconContainer}>
            <IconSymbol name="lock.open.fill" size={80} color="#FFD700" />
          </View>
          
          <Text style={styles.heroTitle}>Desbloquear Todas las Funciones</Text>
          <Text style={styles.heroSubtitle}>Pago único de 100 USDT</Text>
          
          <View style={styles.priceDisplay}>
            <Text style={styles.priceUSDT}>{UNLOCK_COST_USDT} USDT</Text>
            <Text style={styles.priceMXI}>≈ {mxiAmount.toFixed(6)} MXI</Text>
          </View>
        </View>

        {/* What You Get Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <IconSymbol name="star.fill" size={32} color="#FFD700" />
            <Text style={styles.cardTitle}>Lo Que Obtienes</Text>
          </View>
          
          <View style={styles.featureItem}>
            <IconSymbol name="checkmark.circle.fill" size={24} color={colors.success} />
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Acceso a Minería</Text>
              <Text style={styles.featureDescription}>
                Comienza a ganar MXI a través de minería automatizada
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <IconSymbol name="checkmark.circle.fill" size={24} color={colors.success} />
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Acceso a Lotería</Text>
              <Text style={styles.featureDescription}>
                Compra boletos de lotería y gana premios
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <IconSymbol name="checkmark.circle.fill" size={24} color={colors.success} />
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Saldo MXI</Text>
              <Text style={styles.featureDescription}>
                Recibe {mxiAmount.toFixed(6)} MXI inmediatamente
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <IconSymbol name="checkmark.circle.fill" size={24} color={colors.success} />
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Comisiones de Referidos</Text>
              <Text style={styles.featureDescription}>
                Gana de las actividades de tus referidos
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <IconSymbol name="checkmark.circle.fill" size={24} color={colors.success} />
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Acceso Permanente</Text>
              <Text style={styles.featureDescription}>
                Pago único, acceso de por vida
              </Text>
            </View>
          </View>
        </View>

        {/* How It Works Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <IconSymbol name="info.circle.fill" size={32} color={colors.primary} />
            <Text style={styles.cardTitle}>Cómo Funciona</Text>
          </View>
          
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepTextContainer}>
              <Text style={styles.stepTitle}>Realizar Pago</Text>
              <Text style={styles.stepDescription}>
                Paga 100 USDT vía Binance Pay
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepTextContainer}>
              <Text style={styles.stepTitle}>Recibir MXI</Text>
              <Text style={styles.stepDescription}>
                Obtén {mxiAmount.toFixed(6)} MXI en tu cuenta
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepTextContainer}>
              <Text style={styles.stepTitle}>Funciones Desbloqueadas</Text>
              <Text style={styles.stepDescription}>
                Accede a Minería y Lotería inmediatamente
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <View style={styles.stepTextContainer}>
              <Text style={styles.stepTitle}>Comenzar a Ganar</Text>
              <Text style={styles.stepDescription}>
                Empieza a minar y participar en la lotería
              </Text>
            </View>
          </View>
        </View>

        {/* Important Notes Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <IconSymbol name="exclamationmark.triangle.fill" size={32} color={colors.warning} />
            <Text style={styles.cardTitle}>Información Importante</Text>
          </View>
          
          <Text style={styles.noteText}>
            - Este es un pago único de desbloqueo de 100 USDT
          </Text>
          <Text style={styles.noteText}>
            - Separado de las compras de poder de minería
          </Text>
          <Text style={styles.noteText}>
            - Recibes MXI equivalente a tu pago
          </Text>
          <Text style={styles.noteText}>
            - La minería requiere un paquete adicional de 100 USDT (30 días)
          </Text>
          <Text style={styles.noteText}>
            - El poder de minería se puede aumentar con compras USDT
          </Text>
          <Text style={styles.noteText}>
            - Todos los pagos se procesan vía Binance Pay
          </Text>
          <Text style={styles.noteText}>
            - ⚠️ MODO DE PRUEBA: El pago se simulará automáticamente
          </Text>
        </View>

        {/* Purchase Button */}
        <Pressable
          style={[
            styles.purchaseButton,
            processing && styles.purchaseButtonDisabled,
          ]}
          onPress={handlePurchase}
          disabled={processing}
        >
          {processing ? (
            <>
              <IconSymbol name="hourglass" size={24} color={colors.background} />
              <Text style={styles.purchaseButtonText}>Procesando Pago...</Text>
            </>
          ) : (
            <>
              <IconSymbol name="lock.open.fill" size={24} color={colors.background} />
              <Text style={styles.purchaseButtonText}>Desbloquear por {UNLOCK_COST_USDT} USDT</Text>
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
  heroCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 24,
    padding: 32,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#FFD700',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  priceDisplay: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 20,
    width: '100%',
  },
  priceUSDT: {
    fontSize: 36,
    fontWeight: '900',
    color: colors.primary,
    marginBottom: 8,
  },
  priceMXI: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
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
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  featureTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.background,
  },
  stepTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  noteText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 8,
  },
  purchaseButton: {
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
  purchaseButtonDisabled: {
    backgroundColor: colors.textSecondary,
    opacity: 0.5,
  },
  purchaseButtonText: {
    color: colors.background,
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 12,
  },
  alreadyUnlockedCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.success,
  },
  alreadyUnlockedTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  alreadyUnlockedDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  goToMiningButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  goToMiningButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});
