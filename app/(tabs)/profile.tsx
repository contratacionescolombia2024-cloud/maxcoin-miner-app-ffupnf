
import React, { useState } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/IconSymbol";
import { colors } from "@/styles/commonStyles";

export default function ProfileScreen() {
  const [userName, setUserName] = useState("Crypto Miner");
  const [email, setEmail] = useState("miner@maxcoin.com");
  const [binanceAddress, setBinanceAddress] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const handleSaveProfile = () => {
    setIsEditing(false);
    Alert.alert(
      "Profile Updated",
      "Your profile has been updated successfully!",
      [{ text: "OK" }]
    );
  };

  return (
    <SafeAreaView 
      style={[styles.safeArea, { backgroundColor: colors.background }]} 
      edges={['top']}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          Platform.OS !== 'ios' && styles.contentContainerWithTabBar
        ]}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <IconSymbol name="person.circle.fill" size={100} color={colors.primary} />
          </View>
          
          {!isEditing ? (
            <>
              <Text style={styles.name}>{userName}</Text>
              <Text style={styles.email}>{email}</Text>
              
              <Pressable 
                style={styles.editButton}
                onPress={() => setIsEditing(true)}
              >
                <IconSymbol name="pencil" size={16} color="#ffffff" />
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </Pressable>
            </>
          ) : (
            <View style={styles.editForm}>
              <TextInput
                style={styles.input}
                value={userName}
                onChangeText={setUserName}
                placeholder="Name"
                placeholderTextColor={colors.textSecondary}
              />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
              />
              
              <View style={styles.editButtons}>
                <Pressable 
                  style={[styles.button, styles.secondaryButton]}
                  onPress={() => setIsEditing(false)}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </Pressable>
                
                <Pressable 
                  style={[styles.button, styles.primaryButton]}
                  onPress={handleSaveProfile}
                >
                  <Text style={styles.buttonText}>Save</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {/* Account Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <IconSymbol name="person.fill" size={20} color={colors.textSecondary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>User ID</Text>
                <Text style={styles.infoValue}>MXI-{Math.random().toString(36).substr(2, 9).toUpperCase()}</Text>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.infoRow}>
              <IconSymbol name="calendar" size={20} color={colors.textSecondary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Member Since</Text>
                <Text style={styles.infoValue}>January 2025</Text>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.infoRow}>
              <IconSymbol name="star.fill" size={20} color={colors.accent} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Mining Level</Text>
                <Text style={styles.infoValue}>Level 1</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Binance Integration Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Binance Integration</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <IconSymbol name="link" size={20} color={colors.textSecondary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Binance Wallet Address</Text>
                <TextInput
                  style={styles.addressInput}
                  value={binanceAddress}
                  onChangeText={setBinanceAddress}
                  placeholder="Enter your Binance wallet address"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                />
              </View>
            </View>
            
            <Pressable 
              style={[styles.button, styles.accentButton, { marginTop: 12 }]}
              onPress={() => {
                if (binanceAddress.trim()) {
                  Alert.alert(
                    "Address Saved",
                    "Your Binance wallet address has been saved successfully!",
                    [{ text: "OK" }]
                  );
                } else {
                  Alert.alert(
                    "Error",
                    "Please enter a valid Binance wallet address",
                    [{ text: "OK" }]
                  );
                }
              }}
            >
              <IconSymbol name="checkmark.circle.fill" size={20} color={colors.text} />
              <Text style={[styles.buttonText, { color: colors.text }]}>Save Address</Text>
            </Pressable>
          </View>
        </View>

        {/* Mining Stats Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mining Statistics</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <IconSymbol name="chart.bar.fill" size={32} color={colors.primary} />
              <Text style={styles.statValue}>0.0000</Text>
              <Text style={styles.statLabel}>Total Mined</Text>
            </View>
            
            <View style={styles.statCard}>
              <IconSymbol name="clock.fill" size={32} color={colors.accent} />
              <Text style={styles.statValue}>0h</Text>
              <Text style={styles.statLabel}>Mining Time</Text>
            </View>
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <View style={styles.infoCard}>
            <Pressable style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <IconSymbol name="bell.fill" size={20} color={colors.textSecondary} />
                <Text style={styles.settingText}>Notifications</Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
            </Pressable>
            
            <View style={styles.divider} />
            
            <Pressable style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <IconSymbol name="lock.fill" size={20} color={colors.textSecondary} />
                <Text style={styles.settingText}>Security</Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
            </Pressable>
            
            <View style={styles.divider} />
            
            <Pressable style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <IconSymbol name="questionmark.circle.fill" size={20} color={colors.textSecondary} />
                <Text style={styles.settingText}>Help & Support</Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  contentContainerWithTabBar: {
    paddingBottom: 100,
  },
  profileHeader: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  editButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  editForm: {
    width: '100%',
    gap: 12,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.highlight,
  },
  editButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.secondary,
  },
  accentButton: {
    backgroundColor: colors.accent,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.background,
    marginVertical: 12,
  },
  addressInput: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: colors.text,
    minHeight: 60,
    textAlignVertical: 'top',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
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
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
});
