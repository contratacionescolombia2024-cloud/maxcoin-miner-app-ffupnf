
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Platform,
  Pressable,
  TextInput,
  Alert,
  Share
} from "react-native";
import { colors } from "@/styles/commonStyles";
import { useAuth } from "@/contexts/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMiningConfig } from "@/contexts/MiningConfigContext";
import React, { useState } from "react";
import { router } from "expo-router";
import { useLocalization } from "@/contexts/LocalizationContext";
import { IconSymbol } from "@/components/IconSymbol";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { t } = useLocalization();
  const { config } = useMiningConfig();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [binanceAddress, setBinanceAddress] = useState("");

  const handleSaveProfile = () => {
    Alert.alert(
      t('profile.profileUpdated'),
      t('profile.profileUpdatedMessage')
    );
  };

  const handleLogout = () => {
    Alert.alert(
      t('common.logout'),
      t('profile.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.logout'), 
          style: 'destructive',
          onPress: () => logout()
        }
      ]
    );
  };

  const handleShareReferralCode = async () => {
    if (!user) return;
    
    try {
      await Share.share({
        message: t('profile.shareReferralMessage', { code: user.referralCode }),
      });
    } catch (error) {
      console.error('Error sharing referral code:', error);
    }
  };

  const handleShareUniqueId = async () => {
    if (!user) return;
    
    try {
      await Share.share({
        message: `My Maxcoin MXI Unique ID: ${user.uniqueIdentifier}\n\nUse this ID to send me MXI!`,
      });
    } catch (error) {
      console.error('Error sharing unique ID:', error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              <IconSymbol name="person.circle.fill" size={80} color={colors.primary} />
            </View>
            <Text style={styles.username}>{user.username}</Text>
            <Text style={styles.memberSince}>
              {t('profile.memberSince')} {new Date(user.createdAt).toLocaleDateString()}
            </Text>
          </View>

          {/* Unique Identifier Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <IconSymbol name="person.badge.key.fill" size={24} color={colors.primary} />
              <Text style={styles.cardTitle}>Unique Identifier</Text>
            </View>
            <View style={styles.identifierContainer}>
              <Text style={styles.identifierValue}>{user.uniqueIdentifier}</Text>
              <Pressable onPress={handleShareUniqueId} style={styles.shareButton}>
                <IconSymbol name="square.and.arrow.up" size={20} color={colors.primary} />
              </Pressable>
            </View>
            <Text style={styles.cardSubtext}>
              Share this ID to receive MXI transfers from other users
            </Text>
          </View>

          {/* Balance Card */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('profile.accountBalance')}</Text>
            <View style={styles.balanceContainer}>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceLabel}>{t('profile.totalBalance')}</Text>
                <Text style={styles.balanceValue}>{user.balance.toFixed(6)} MXI</Text>
              </View>
            </View>
          </View>

          {/* Mining Statistics */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('profile.miningStatistics')}</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <IconSymbol name="hammer.fill" size={24} color={colors.primary} />
                <Text style={styles.statLabel}>{t('profile.miningPower')}</Text>
                <Text style={styles.statValue}>{user.miningPower.toFixed(2)}x</Text>
              </View>
              <View style={styles.statItem}>
                <IconSymbol name="cart.fill" size={24} color={colors.success} />
                <Text style={styles.statLabel}>{t('profile.totalPurchases')}</Text>
                <Text style={styles.statValue}>{user.totalPurchases.toFixed(2)} MXI</Text>
              </View>
            </View>
          </View>

          {/* Referral Program */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('profile.referralProgram')}</Text>
            
            <View style={styles.referralCodeContainer}>
              <View style={styles.referralCodeBox}>
                <Text style={styles.referralCodeLabel}>{t('profile.yourReferralCode')}</Text>
                <Text style={styles.referralCode}>{user.referralCode}</Text>
              </View>
              <Pressable onPress={handleShareReferralCode} style={styles.shareIconButton}>
                <IconSymbol name="square.and.arrow.up" size={24} color={colors.primary} />
              </Pressable>
            </View>

            <View style={styles.referralStats}>
              <View style={styles.referralStatItem}>
                <Text style={styles.referralStatLabel}>{t('profile.totalReferrals')}</Text>
                <Text style={styles.referralStatValue}>{user.referrals.length}</Text>
              </View>
              <View style={styles.referralStatDivider} />
              <View style={styles.referralStatItem}>
                <Text style={styles.referralStatLabel}>{t('profile.referralEarnings')}</Text>
                <Text style={styles.referralStatValue}>{user.referralEarnings.toFixed(6)} MXI</Text>
              </View>
            </View>

            <View style={styles.infoBox}>
              <IconSymbol name="info.circle.fill" size={20} color={colors.primary} />
              <Text style={styles.infoText}>
                {t('profile.referralInfo', {
                  level1: config.level1Commission,
                  level2: config.level2Commission,
                  level3: config.level3Commission,
                })}
              </Text>
            </View>
          </View>

          {/* Transaction History Button */}
          <Pressable 
            style={styles.actionButton}
            onPress={() => router.push('/transactions')}
          >
            <IconSymbol name="list.bullet.rectangle" size={24} color={colors.primary} />
            <Text style={styles.actionButtonText}>View Transaction History</Text>
            <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
          </Pressable>

          {/* Profile Information */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('profile.profileInformation')}</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('profile.username')}</Text>
              <TextInput
                style={styles.input}
                value={user.username}
                editable={false}
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('profile.email')}</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder={t('profile.enterEmail')}
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('profile.binanceWallet')}</Text>
              <TextInput
                style={styles.input}
                value={binanceAddress}
                onChangeText={setBinanceAddress}
                placeholder={t('profile.enterBinanceAddress')}
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
              />
            </View>

            <Pressable style={styles.saveButton} onPress={handleSaveProfile}>
              <Text style={styles.saveButtonText}>{t('profile.saveChanges')}</Text>
            </Pressable>
          </View>

          {/* Account Actions */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('profile.accountActions')}</Text>
            
            <Pressable 
              style={styles.actionButton}
              onPress={() => router.push('/admin')}
            >
              <IconSymbol name="gearshape.fill" size={24} color={colors.primary} />
              <Text style={styles.actionButtonText}>{t('profile.adminPanel')}</Text>
              <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
            </Pressable>

            <Pressable 
              style={[styles.actionButton, styles.logoutButton]}
              onPress={handleLogout}
            >
              <IconSymbol name="arrow.right.square.fill" size={24} color={colors.danger} />
              <Text style={[styles.actionButtonText, { color: colors.danger }]}>
                {t('common.logout')}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  username: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 14,
    color: colors.textSecondary,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  identifierContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.highlight,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  identifierValue: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
    fontFamily: 'monospace',
  },
  shareButton: {
    padding: 8,
  },
  cardSubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  balanceContainer: {
    gap: 12,
  },
  balanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  balanceValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: colors.highlight,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  referralCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  referralCodeBox: {
    flex: 1,
    backgroundColor: colors.highlight,
    borderRadius: 12,
    padding: 16,
  },
  referralCodeLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  referralCode: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 2,
  },
  shareIconButton: {
    backgroundColor: colors.highlight,
    borderRadius: 12,
    padding: 16,
  },
  referralStats: {
    flexDirection: 'row',
    backgroundColor: colors.highlight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  referralStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  referralStatDivider: {
    width: 1,
    backgroundColor: colors.background,
  },
  referralStatLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  referralStatValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.highlight,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.highlight,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.text,
    borderWidth: 2,
    borderColor: colors.highlight,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.highlight,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 12,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  logoutButton: {
    backgroundColor: colors.danger + '20',
    marginBottom: 0,
  },
});
