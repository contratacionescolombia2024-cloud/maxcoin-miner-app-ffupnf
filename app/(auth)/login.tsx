
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!password) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Attempting login...');
      const result = await login(email.trim().toLowerCase(), password);

      if (result.success) {
        console.log('Login successful, navigating to home');
        // Navigation will happen automatically via auth state change
        router.replace('/(tabs)/(home)');
      } else {
        console.log('Login failed:', result.message);
        
        // Show detailed error message with guidance
        let errorTitle = 'Login Failed';
        let errorMessage = result.message || 'Invalid email or password';
        let actionButtons: any[] = [{ text: 'OK', style: 'default' }];

        // Provide specific guidance based on error type
        if (result.message?.includes('Email not confirmed') || result.message?.includes('verify your email')) {
          errorTitle = 'Email Not Verified';
          errorMessage = 'Your email address has not been verified yet.\n\n' +
                        'Please check your inbox (and spam folder) for the verification email we sent you during registration.\n\n' +
                        'Click the verification link in that email to activate your account.';
          actionButtons = [
            { text: 'OK', style: 'default' },
            { 
              text: 'Resend Email', 
              onPress: () => {
                Alert.alert(
                  'Resend Verification',
                  'Please contact support to resend your verification email.',
                  [{ text: 'OK' }]
                );
              }
            }
          ];
        } else if (result.message?.includes('Invalid login credentials') || result.message?.includes('Invalid email or password')) {
          errorTitle = 'Invalid Credentials';
          errorMessage = 'The email or password you entered is incorrect.\n\n' +
                        'Please check:\n' +
                        '• Your email address is spelled correctly\n' +
                        '• Your password is correct (passwords are case-sensitive)\n' +
                        '• You have registered an account with this email';
        } else if (result.message?.includes('blocked')) {
          errorTitle = 'Account Blocked';
          errorMessage = 'Your account has been blocked.\n\n' +
                        'Please contact support for assistance: contratacionescolombia2024@gmail.com';
        } else if (result.message?.includes('profile not found')) {
          errorTitle = 'Account Not Found';
          errorMessage = 'Your account profile could not be found.\n\n' +
                        'This may happen if:\n' +
                        '• Your account registration was not completed\n' +
                        '• There was an error during registration\n\n' +
                        'Please try registering again or contact support.';
          actionButtons = [
            { text: 'OK', style: 'default' },
            { 
              text: 'Register', 
              onPress: () => router.replace('/(auth)/register')
            }
          ];
        }

        Alert.alert(errorTitle, errorMessage, actionButtons);
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert(
        'Connection Error', 
        'An unexpected error occurred while trying to log in.\n\n' +
        'Please check your internet connection and try again.\n\n' +
        'If the problem persists, contact support.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <IconSymbol name="bitcoinsign.circle.fill" size={100} color={colors.primary} />
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Log in to continue mining Maxcoin MXI</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <IconSymbol name="envelope.fill" size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <IconSymbol name="lock.fill" size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              editable={!isLoading}
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} disabled={isLoading}>
              <IconSymbol
                name={showPassword ? 'eye.slash.fill' : 'eye.fill'}
                size={20}
                color={colors.textSecondary}
              />
            </Pressable>
          </View>

          <Pressable
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <Text style={styles.loginButtonText}>Logging In...</Text>
            ) : (
              <>
                <IconSymbol name="arrow.right.circle.fill" size={20} color={colors.background} />
                <Text style={styles.loginButtonText}>Log In</Text>
              </>
            )}
          </Pressable>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable
            style={styles.registerLink}
            onPress={() => router.replace('/(auth)/register')}
            disabled={isLoading}
          >
            <Text style={styles.registerLinkText}>
              Don&apos;t have an account? <Text style={styles.registerLinkBold}>Sign Up</Text>
            </Text>
          </Pressable>
        </View>

        <View style={styles.infoBox}>
          <IconSymbol name="info.circle.fill" size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            After registration, you must verify your email before logging in. Check your inbox for the verification link.
          </Text>
        </View>

        <View style={styles.troubleshootingBox}>
          <Text style={styles.troubleshootingTitle}>Having trouble logging in?</Text>
          <Text style={styles.troubleshootingText}>
            - Make sure you&apos;ve verified your email address{'\n'}
            - Check that your email and password are correct{'\n'}
            - Passwords are case-sensitive{'\n'}
            - Contact support if you need help
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Secure cryptocurrency mining platform
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 80,
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: colors.text,
    marginTop: 24,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loginButtonDisabled: {
    backgroundColor: colors.textSecondary,
    opacity: 0.5,
  },
  loginButtonText: {
    color: colors.background,
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  registerLink: {
    alignItems: 'center',
    padding: 12,
  },
  registerLinkText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  registerLinkBold: {
    fontWeight: '700',
    color: colors.primary,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.highlight,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    lineHeight: 19,
  },
  troubleshootingBox: {
    backgroundColor: colors.cardBackground,
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  troubleshootingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  troubleshootingText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
  },
});
