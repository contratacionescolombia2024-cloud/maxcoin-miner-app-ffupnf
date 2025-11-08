
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Platform,
  Pressable,
  TextInput,
  Alert 
} from "react-native";
import { colors } from "@/styles/commonStyles";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState } from "react";
import { IconSymbol } from "@/components/IconSymbol";
import { useAuth } from "@/contexts/AuthContext";
import { useMiningConfig } from "@/contexts/MiningConfigContext";
import { useLocalization } from "@/contexts/LocalizationContext";
import { router } from "expo-router";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { config } = useMiningConfig();
  const { t, locale, setLocale, availableLocales } = useLocalization();
  const [name, setName] = useState(user?.username || '');
  const [email, setEmail] = useState('');
  const [binanceAddress, setBinanceAddress] = useState('');

  const handleSaveProfile = () => {
    Alert.alert(
      t('profile.profileUpdated'),
      t('profile.profileUpdatedMessage'),
      [{ text: t('common.ok') }]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      t('common.logout'),
      t('profile.logoutConfirm'),
      [
        { text: t('common.cancel'), style: "cancel" },
        {
          text: t('common.logout'),
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const handleShareReferralCode = () => {
    Alert.alert(
      t('profile.shareReferralCode'),
      t('profile.shareReferralMessage', { code: user?.referralCode }),
      [{ text: t('common.ok') }]
    );
  };

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          Platform.OS !== 'ios' && styles.scrollContentWithTabBar
        ]}
      >
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <IconSymbol name="person.circle.fill" size={100} color={colors.primary} />
          </View>
          <Text style={styles.username}>{user.username}</Text>
          <Text style={styles.userId}>User ID: {user.id}</Text>
        </View>

        {/* Language Selector Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🌐 Language / Idioma / Língua</Text>
          <View style={styles.languageContainer}>
            {availableLocales.map((lang) => (
              <Pressable
                key={lang.code}
                style={[
                  styles.languageButton,
                  locale === lang.code && styles.languageButtonActive,
                ]}
                onPress={() => setLocale(lang.code)}
              >
                <Text style={styles.languageFlag}>{lang.flag}</Text>
                <Text
                  style={[
                    styles.languageText,
                    locale === lang.code && styles.languageTextActive,
                  ]}
                >
                  {lang.name}
                </Text>
                {locale === lang.code && (
                  <IconSymbol name="checkmark.circle.fill" size={20} color={colors.primary} />
                )}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Balance Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('profile.accountBalance')}</Text>
          <View style={styles.balanceContainer}>
            <IconSymbol name="bitcoinsign.circle.fill" size={40} color={colors.primary} />
            <View style={styles.balanceInfo}>
              <Text style={styles.balanceAmount}>{user.balance.toFixed(4)} MXI</Text>
              <Text style={styles.balanceLabel}>{t('profile.totalBalance')}</Text>
            </View>
          </View>
        </View>

        {/* Mining Stats Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('profile.miningStatistics')}</Text>
          
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <IconSymbol name="flame.fill" size={24} color={colors.accent} />
              <Text style={styles.statValue}>{user.miningPower.toFixed(2)}x</Text>
              <Text style={styles.statLabel}>{t('profile.miningPower')}</Text>
            </View>

            <View style={styles.statItem}>
              <IconSymbol name="cart.fill" size={24} color={colors.primary} />
              <Text style={styles.statValue}>{user.totalPurchases.toFixed(2)}</Text>
              <Text style={styles.statLabel}>{t('profile.totalPurchases')}</Text>
            </View>
          </View>
        </View>

        {/* Referral Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('profile.referralProgram')}</Text>
          
          <View style={styles.referralCodeContainer}>
            <View style={styles.referralCodeBox}>
              <Text style={styles.referralCodeLabel}>{t('profile.yourReferralCode')}</Text>
              <Text style={styles.referralCode}>{user.referralCode}</Text>
            </View>
            <Pressable style={styles.shareButton} onPress={handleShareReferralCode}>
              <IconSymbol name="square.and.arrow.up" size={24} color={colors.primary} />
            </Pressable>
          </View>

          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <IconSymbol name="person.2.fill" size={24} color={colors.primary} />
              <Text style={styles.statValue}>{user.referrals.length}</Text>
              <Text style={styles.statLabel}>{t('profile.totalReferrals')}</Text>
            </View>

            <View style={styles.statItem}>
              <IconSymbol name="dollarsign.circle.fill" size={24} color={colors.success} />
              <Text style={styles.statValue}>{user.referralEarnings.toFixed(4)}</Text>
              <Text style={styles.statLabel}>{t('profile.referralEarnings')}</Text>
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

        {/* Profile Information Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('profile.profileInformation')}</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('profile.username')}</Text>
            <View style={styles.inputContainer}>
              <IconSymbol name="person.fill" size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder={t('profile.enterName')}
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('profile.email')}</Text>
            <View style={styles.inputContainer}>
              <IconSymbol name="envelope.fill" size={20} color={colors.textSecondary} />
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
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('profile.binanceWallet')}</Text>
            <View style={styles.inputContainer}>
              <IconSymbol name="wallet.pass.fill" size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.input}
                value={binanceAddress}
                onChangeText={setBinanceAddress}
                placeholder={t('profile.enterBinanceAddress')}
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
              />
            </View>
          </View>

          <Pressable style={styles.saveButton} onPress={handleSaveProfile}>
            <IconSymbol name="checkmark.circle.fill" size={20} color="#ffffff" />
            <Text style={styles.saveButtonText}>{t('profile.saveChanges')}</Text>
          </Pressable>
        </View>

        {/* Account Actions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('profile.accountActions')}</Text>
          
          <Pressable 
            style={styles.actionButton} 
            onPress={() => router.push('/admin')}
          >
            <IconSymbol name="gearshape.fill" size={24} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.primary }]}>
              {t('profile.adminPanel')}
            </Text>
            <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
          </Pressable>

          <Pressable style={styles.actionButton} onPress={handleLogout}>
            <IconSymbol name="arrow.right.square.fill" size={24} color={colors.danger} />
            <Text style={[styles.actionButtonText, { color: colors.danger }]}>
              {t('common.logout')}
            </Text>
            <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* Account Info */}
        <View style={styles.accountInfo}>
          <Text style={styles.accountInfoText}>
            {t('profile.memberSince')}: {new Date(user.createdAt).toLocaleDateString()}
          </Text>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 20,
  },
  scrollContentWithTabBar: {
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  username: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  userId: {
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
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  balanceInfo: {
    flex: 1,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 4,
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  referralCodeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  referralCodeBox: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  referralCodeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  referralCode: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 2,
  },
  shareButton: {
    backgroundColor: colors.background,
    borderRadius: 12,
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.highlight,
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
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
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  accountInfo: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  accountInfoText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  languageContainer: {
    gap: 12,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.highlight,
  },
  languageFlag: {
    fontSize: 24,
  },
  languageText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  languageTextActive: {
    color: colors.primary,
  },
});
