
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/app/integrations/supabase/client';

export default function AdminPasswordSetupScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleSetupPassword = async () => {
    setIsLoading(true);
    try {
      // Call the Edge Function to update admin password
      const { data, error } = await supabase.functions.invoke('update-admin-password', {
        method: 'POST',
      });

      if (error) {
        console.error('Error updating admin password:', error);
        Alert.alert('Error', 'Failed to update admin password: ' + error.message);
        return;
      }

      console.log('Admin password update result:', data);
      setIsComplete(true);
      Alert.alert(
        'Success',
        'Admin password has been set to: Ingo1991\n\nYou can now log in with:\nEmail: contratacionescolombia2024@gmail.com\nPassword: Ingo1991',
        [
          {
            text: 'Go to Login',
            onPress: () => router.replace('/(auth)/login'),
          },
        ]
      );
    } catch (error) {
      console.error('Unexpected error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <IconSymbol name="key.fill" size={100} color={colors.primary} />
        <Text style={styles.title}>Admin Password Setup</Text>
        <Text style={styles.subtitle}>
          Click the button below to set the admin password to: Ingo1991
        </Text>

        <View style={styles.infoCard}>
          <IconSymbol name="person.fill" size={24} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Admin Account</Text>
            <Text style={styles.infoText}>Email: contratacionescolombia2024@gmail.com</Text>
            <Text style={styles.infoText}>Password: Ingo1991</Text>
          </View>
        </View>

        {!isComplete ? (
          <Pressable
            style={[styles.setupButton, isLoading && styles.setupButtonDisabled]}
            onPress={handleSetupPassword}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <ActivityIndicator color="#ffffff" />
                <Text style={styles.buttonText}>Setting up...</Text>
              </>
            ) : (
              <>
                <IconSymbol name="checkmark.circle.fill" size={24} color="#ffffff" />
                <Text style={styles.buttonText}>Set Admin Password</Text>
              </>
            )}
          </Pressable>
        ) : (
          <View style={styles.successCard}>
            <IconSymbol name="checkmark.circle.fill" size={48} color={colors.success} />
            <Text style={styles.successTitle}>Password Set Successfully!</Text>
            <Text style={styles.successText}>
              You can now log in with the admin credentials
            </Text>
          </View>
        )}

        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    width: '100%',
    gap: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  setupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 12,
    width: '100%',
    marginBottom: 16,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
    elevation: 5,
  },
  setupButtonDisabled: {
    backgroundColor: colors.textSecondary,
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  successCard: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 32,
    width: '100%',
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.success,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  successText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
});
