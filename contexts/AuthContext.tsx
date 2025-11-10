
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMiningConfig } from './MiningConfigContext';
import { supabase } from '@/app/integrations/supabase/client';

// ⚠️ TEMPORARY TESTING FLAG - Set to true to bypass unlock payment requirement
// When true, all features (Mining & Lottery) are unlocked without payment
const TEMPORARY_UNLOCK_BYPASS = true;

export interface Transaction {
  id: string;
  type: 'transfer' | 'purchase' | 'mining' | 'commission' | 'withdrawal';
  amount: number;
  usdValue?: number;
  from?: string;
  to?: string;
  commission?: number;
  commissionRate?: number;
  description?: string;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
  platform?: string;
}

export interface WithdrawalRestrictions {
  purchasedAmount: number;
  miningEarnings: number;
  commissionEarnings: number;
  lastWithdrawalDate?: string;
  withdrawalCount: number;
  canWithdrawEarnings: boolean;
  earningsWithdrawalCycleStart?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  emailVerified: boolean;
  balance: number;
  miningPower: number;
  referralCode: string;
  referredBy?: string;
  referrals: string[];
  referralEarnings: number;
  totalPurchases: number;
  createdAt: string;
  uniqueIdentifier: string;
  withdrawalAddresses: {
    binance?: string;
    coinbase?: string;
    skrill?: string;
  };
  transactions: Transaction[];
  withdrawalRestrictions: WithdrawalRestrictions;
  isBlocked?: boolean;
  hasMiningAccess?: boolean;
  hasFirstPurchase?: boolean;
  unlockPaymentMade?: boolean;
  unlockPaymentDate?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (username: string, email: string, password: string, referralCode?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  updateBalance: (amount: number, type: 'mining' | 'commission' | 'purchase') => Promise<void>;
  purchaseMaxcoin: (amount: number) => Promise<void>;
  addReferralEarnings: (amount: number) => Promise<void>;
  refreshUser: () => Promise<void>;
  transferMXI: (recipientCode: string, amount: number, usdValue: number, description?: string) => Promise<{ success: boolean; message?: string; recipientReceives?: number; commission?: number }>;
  withdrawMXI: (platform: string, address: string, amount: number) => Promise<{ success: boolean; message?: string }>;
  updateWithdrawalAddress: (platform: string, address: string) => Promise<void>;
  getUserByReferralCode: (code: string) => Promise<User | null>;
  getTransactionHistory: () => Transaction[];
  canWithdrawAmount: (amount: number) => { canWithdraw: boolean; availableForWithdrawal: number; message?: string };
  getReferralLink: () => string;
  getActiveReferralsCount: () => Promise<number>;
  recordFirstPurchase: (usdAmount: number) => Promise<void>;
  recordUnlockPayment: () => Promise<void>;
  isUnlocked: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CURRENT_USER: '@maxcoin_current_user',
  USERS: '@maxcoin_users',
  TRANSACTIONS: '@maxcoin_transactions',
};

const generateReferralCode = (username: string): string => {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${username.substring(0, 3).toUpperCase()}${random}`;
};

const generateUniqueIdentifier = (username: string): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `MXI-${username.substring(0, 2).toUpperCase()}${timestamp}${random}`;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const miningConfigContext = useMiningConfig();

  const loadCurrentUser = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        console.log('Loading user data for:', session.user.email);
        await loadUserData(session.user.id);
      } else {
        console.log('No active session found');
        setUser(null);
      }
    } catch (error) {
      console.error('Error loading current user:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCurrentUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if (event === 'SIGNED_IN' && session?.user) {
        await loadUserData(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      } else if (event === 'USER_UPDATED' && session?.user) {
        await loadUserData(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadUserData = async (userId: string) => {
    try {
      console.log('Loading user data for ID:', userId);
      
      const { data: userData, error } = await supabase
        .from('users')
        .select(`
          *,
          withdrawal_restrictions(*),
          withdrawal_addresses(*)
        `)
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading user data:', error);
        
        // If user profile doesn't exist, sign out
        if (error.code === 'PGRST116') {
          console.error('User profile not found in database. This should not happen.');
          await supabase.auth.signOut();
        }
        return;
      }

      if (userData) {
        console.log('User data loaded successfully:', userData.email);
        
        // Get transactions
        const { data: transactions } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(100);

        // Get referrals count
        const { count: referralsCount } = await supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .eq('referred_by', userId);

        const restrictions = userData.withdrawal_restrictions?.[0] || {
          purchasedAmount: 0,
          miningEarnings: 0,
          commissionEarnings: 0,
          withdrawalCount: 0,
          canWithdrawEarnings: false,
        };

        const addresses = userData.withdrawal_addresses?.reduce((acc: any, addr: any) => {
          acc[addr.platform] = addr.address;
          return acc;
        }, {}) || {};

        const mappedUser: User = {
          id: userData.id,
          username: userData.username,
          email: userData.email,
          emailVerified: userData.email_verified,
          balance: parseFloat(userData.balance),
          miningPower: parseFloat(userData.mining_power),
          referralCode: userData.referral_code,
          referredBy: userData.referred_by,
          referrals: Array(referralsCount || 0).fill(''),
          referralEarnings: parseFloat(userData.referral_earnings),
          totalPurchases: parseFloat(userData.total_purchases),
          createdAt: userData.created_at,
          uniqueIdentifier: userData.unique_identifier,
          withdrawalAddresses: addresses,
          transactions: transactions?.map((tx: any) => ({
            id: tx.transaction_id,
            type: tx.type,
            amount: parseFloat(tx.amount),
            usdValue: tx.usd_value ? parseFloat(tx.usd_value) : undefined,
            from: tx.from_identifier,
            to: tx.to_identifier,
            commission: tx.commission ? parseFloat(tx.commission) : undefined,
            commissionRate: tx.commission_rate ? parseFloat(tx.commission_rate) : undefined,
            description: tx.description,
            timestamp: tx.created_at,
            status: tx.status,
            platform: tx.platform,
          })) || [],
          withdrawalRestrictions: {
            purchasedAmount: parseFloat(restrictions.purchased_amount || 0),
            miningEarnings: parseFloat(restrictions.mining_earnings || 0),
            commissionEarnings: parseFloat(restrictions.commission_earnings || 0),
            lastWithdrawalDate: restrictions.last_withdrawal_date,
            withdrawalCount: restrictions.withdrawal_count || 0,
            canWithdrawEarnings: restrictions.can_withdraw_earnings || false,
            earningsWithdrawalCycleStart: restrictions.earnings_withdrawal_cycle_start,
          },
          isBlocked: userData.is_blocked,
          hasMiningAccess: userData.has_mining_access,
          hasFirstPurchase: userData.has_first_purchase,
          unlockPaymentMade: userData.unlock_payment_made,
          unlockPaymentDate: userData.unlock_payment_date,
        };

        setUser(mappedUser);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const refreshUser = async () => {
    if (user) {
      await loadUserData(user.id);
    }
  };

  const getReferralLink = (): string => {
    if (!user) return '';
    return `https://maxcoin-mxi.app/register?ref=${user.referralCode}`;
  };

  const getActiveReferralsCount = async (): Promise<number> => {
    if (!user) return 0;

    try {
      const { count } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('referred_by', user.id)
        .or('total_purchases.gt.0,has_mining_access.eq.true');

      return count || 0;
    } catch (error) {
      console.error('Error getting active referrals count:', error);
      return 0;
    }
  };

  const recordFirstPurchase = async (usdAmount: number) => {
    if (!user) return;

    try {
      if (!user.hasFirstPurchase && usdAmount > 0) {
        const { error } = await supabase
          .from('users')
          .update({ has_first_purchase: true })
          .eq('id', user.id);

        if (!error) {
          await refreshUser();
          console.log('✅ First purchase recorded for referral tracking');
        }
      }
    } catch (error) {
      console.error('Error recording first purchase:', error);
    }
  };

  const recordUnlockPayment = async () => {
    if (!user) return;

    try {
      if (!user.unlockPaymentMade) {
        const { error } = await supabase
          .from('users')
          .update({ 
            unlock_payment_made: true,
            unlock_payment_date: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (!error) {
          await refreshUser();
          console.log('✅ 100 USDT unlock payment recorded - Mining and Lottery features unlocked');
        }
      }
    } catch (error) {
      console.error('Error recording unlock payment:', error);
    }
  };

  // Check if user has unlocked features (with temporary bypass)
  const isUnlocked = (): boolean => {
    if (TEMPORARY_UNLOCK_BYPASS) {
      console.warn('⚠️⚠️⚠️ TEMPORARY UNLOCK BYPASS ACTIVE ⚠️⚠️⚠️');
      console.warn('All features (Mining & Lottery) are unlocked for testing');
      console.warn('Set TEMPORARY_UNLOCK_BYPASS = false in AuthContext.tsx to disable');
      return true;
    }
    const unlocked = user?.unlockPaymentMade || false;
    console.log('Unlock status:', unlocked ? 'UNLOCKED' : 'LOCKED');
    return unlocked;
  };

  const register = async (
    username: string,
    email: string,
    password: string,
    referralCode?: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      console.log('Starting registration for:', email);
      
      // Check if username already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .single();

      if (existingUser) {
        return { success: false, message: 'Username already exists' };
      }

      // Register with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password,
        options: {
          emailRedirectTo: 'https://natively.dev/email-confirmed',
        },
      });

      if (authError) {
        console.error('Auth registration error:', authError);
        return { success: false, message: authError.message };
      }

      if (!authData.user) {
        return { success: false, message: 'Registration failed' };
      }

      console.log('Auth user created:', authData.user.id);

      // Find referrer if referral code provided
      let referredByUserId: string | undefined;
      if (referralCode) {
        const { data: referrer } = await supabase
          .from('users')
          .select('id')
          .eq('referral_code', referralCode.toUpperCase())
          .single();

        if (referrer) {
          referredByUserId = referrer.id;
          console.log('Referrer found:', referredByUserId);
        }
      }

      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          username,
          email: email.toLowerCase(),
          email_verified: false,
          balance: 0,
          mining_power: 1,
          referral_code: generateReferralCode(username),
          referred_by: referredByUserId,
          referral_earnings: 0,
          total_purchases: 0,
          unique_identifier: generateUniqueIdentifier(username),
          is_blocked: false,
          has_mining_access: false,
          has_first_purchase: false,
          unlock_payment_made: false,
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Clean up auth user if profile creation fails
        await supabase.auth.admin.deleteUser(authData.user.id);
        return { success: false, message: 'Failed to create user profile' };
      }

      console.log('User profile created successfully');

      // Create withdrawal restrictions record
      await supabase
        .from('withdrawal_restrictions')
        .insert({
          user_id: authData.user.id,
          purchased_amount: 0,
          mining_earnings: 0,
          commission_earnings: 0,
          withdrawal_count: 0,
          can_withdraw_earnings: false,
        });

      console.log('User registered successfully. Email verification required.');
      return { 
        success: true, 
        message: 'Registration successful! Please check your email to verify your account before logging in.' 
      };
    } catch (error) {
      console.error('Error registering user:', error);
      return { success: false, message: 'Registration failed. Please try again.' };
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      console.log('Attempting login for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      });

      if (error) {
        console.error('Login error:', error);
        
        // Provide user-friendly error messages
        if (error.message.includes('Email not confirmed')) {
          return { 
            success: false, 
            message: 'Please verify your email before logging in. Check your inbox for the verification link.' 
          };
        } else if (error.message.includes('Invalid login credentials')) {
          return { 
            success: false, 
            message: 'Invalid email or password. Please check your credentials and try again.' 
          };
        }
        
        return { success: false, message: error.message };
      }

      if (!data.user) {
        return { success: false, message: 'Login failed' };
      }

      console.log('Auth login successful for:', data.user.email);

      // Check if user profile exists and is not blocked
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('is_blocked, email_verified')
        .eq('id', data.user.id)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
        await supabase.auth.signOut();
        return { 
          success: false, 
          message: 'User profile not found. Please contact support.' 
        };
      }

      if (userData?.is_blocked) {
        await supabase.auth.signOut();
        return { 
          success: false, 
          message: 'Your account has been blocked. Please contact support for assistance.' 
        };
      }

      // Double-check email verification (belt and suspenders approach)
      if (!userData?.email_verified) {
        console.warn('Email not verified in public.users table');
        await supabase.auth.signOut();
        return { 
          success: false, 
          message: 'Please verify your email before logging in. Check your inbox for the verification link.' 
        };
      }

      // Load user data
      await loadUserData(data.user.id);
      
      console.log('✅ Login successful for:', email);
      
      // Show bypass warning if active
      if (TEMPORARY_UNLOCK_BYPASS) {
        console.warn('⚠️⚠️⚠️ TEMPORARY UNLOCK BYPASS IS ACTIVE ⚠️⚠️⚠️');
      }
      
      return { success: true };
    } catch (error) {
      console.error('Unexpected login error:', error);
      return { success: false, message: 'An unexpected error occurred. Please try again.' };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      setUser(null);
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const updateBalance = async (amount: number, type: 'mining' | 'commission' | 'purchase') => {
    if (!user) return;

    try {
      const newBalance = user.balance + amount;
      
      const { error } = await supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('id', user.id);

      if (error) {
        console.error('Balance update error:', error);
        return;
      }

      // Update withdrawal restrictions
      const restrictionField = type === 'mining' ? 'mining_earnings' : 
                              type === 'commission' ? 'commission_earnings' : 
                              'purchased_amount';

      const { data: restrictions } = await supabase
        .from('withdrawal_restrictions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (restrictions) {
        await supabase
          .from('withdrawal_restrictions')
          .update({ 
            [restrictionField]: (restrictions[restrictionField] || 0) + amount 
          })
          .eq('user_id', user.id);
      }

      // Create transaction
      const transactionId = `${type.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      
      await supabase
        .from('transactions')
        .insert({
          transaction_id: transactionId,
          user_id: user.id,
          type: type === 'purchase' ? 'purchase' : type === 'commission' ? 'commission' : 'mining',
          amount: amount,
          description: `${type.charAt(0).toUpperCase() + type.slice(1)} earnings`,
          status: 'completed',
        });

      await refreshUser();
    } catch (error) {
      console.error('Error updating balance:', error);
    }
  };

  const canWithdrawAmount = (amount: number): { canWithdraw: boolean; availableForWithdrawal: number; message?: string } => {
    if (!user) {
      return { canWithdraw: false, availableForWithdrawal: 0, message: 'User not authenticated' };
    }

    const restrictions = user.withdrawalRestrictions;
    const availablePurchased = restrictions.purchasedAmount;
    const availableCommission = restrictions.commissionEarnings;
    const availableMining = restrictions.canWithdrawEarnings ? restrictions.miningEarnings : 0;
    const totalAvailable = availablePurchased + availableCommission + availableMining;

    if (amount > totalAvailable) {
      return {
        canWithdraw: false,
        availableForWithdrawal: totalAvailable,
        message: `You can withdraw ${totalAvailable.toFixed(6)} MXI. ` +
                 `(${availablePurchased.toFixed(6)} purchased, ` +
                 `${availableCommission.toFixed(6)} commissions, ` +
                 `${availableMining.toFixed(6)} mining)`
      };
    }

    return { canWithdraw: true, availableForWithdrawal: totalAvailable };
  };

  const withdrawMXI = async (
    platform: string,
    address: string,
    amount: number
  ): Promise<{ success: boolean; message?: string }> => {
    if (!user) {
      return { success: false, message: 'User not authenticated' };
    }

    try {
      const eligibility = canWithdrawAmount(amount);
      if (!eligibility.canWithdraw) {
        return { success: false, message: eligibility.message };
      }

      // Call Supabase Edge Function for Binance withdrawal
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return { success: false, message: 'Not authenticated' };
      }

      const response = await fetch(
        `${supabase.supabaseUrl}/functions/v1/binance-withdraw`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount,
            address,
            network: 'BSC',
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        return { success: false, message: result.error || 'Withdrawal failed' };
      }

      await refreshUser();
      return { success: true };
    } catch (error) {
      console.error('Error withdrawing MXI:', error);
      return { success: false, message: 'Withdrawal failed' };
    }
  };

  const updateWithdrawalAddress = async (platform: string, address: string) => {
    if (!user) return;

    try {
      await supabase
        .from('withdrawal_addresses')
        .upsert({
          user_id: user.id,
          platform: platform.toLowerCase(),
          address: address,
        }, {
          onConflict: 'user_id,platform',
        });

      await refreshUser();
    } catch (error) {
      console.error('Error updating withdrawal address:', error);
    }
  };

  const getUserByReferralCode = async (code: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('referral_code', code.toUpperCase())
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        username: data.username,
        email: data.email,
        emailVerified: data.email_verified,
        balance: parseFloat(data.balance),
        miningPower: parseFloat(data.mining_power),
        referralCode: data.referral_code,
        referredBy: data.referred_by,
        referrals: [],
        referralEarnings: parseFloat(data.referral_earnings),
        totalPurchases: parseFloat(data.total_purchases),
        createdAt: data.created_at,
        uniqueIdentifier: data.unique_identifier,
        withdrawalAddresses: {},
        transactions: [],
        withdrawalRestrictions: {
          purchasedAmount: 0,
          miningEarnings: 0,
          commissionEarnings: 0,
          withdrawalCount: 0,
          canWithdrawEarnings: false,
        },
        isBlocked: data.is_blocked,
        hasMiningAccess: data.has_mining_access,
        hasFirstPurchase: data.has_first_purchase,
        unlockPaymentMade: data.unlock_payment_made,
        unlockPaymentDate: data.unlock_payment_date,
      };
    } catch (error) {
      console.error('Error finding user by referral code:', error);
      return null;
    }
  };

  const transferMXI = async (
    recipientCode: string,
    amount: number,
    usdValue: number,
    description?: string
  ): Promise<{ success: boolean; message?: string; recipientReceives?: number; commission?: number }> => {
    if (!user) {
      return { success: false, message: 'User not authenticated' };
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return { success: false, message: 'Not authenticated' };
      }

      const response = await fetch(
        `${supabase.supabaseUrl}/functions/v1/transfer-mxi`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipientCode,
            amount,
            usdValue,
            description,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        return { success: false, message: result.error || 'Transfer failed' };
      }

      await refreshUser();

      console.log('MXI Transfer completed:', result);

      return {
        success: true,
        recipientReceives: result.recipientReceives,
        commission: result.commission,
      };
    } catch (error) {
      console.error('Error transferring MXI:', error);
      return { success: false, message: 'Transfer failed' };
    }
  };

  const purchaseMaxcoin = async (amount: number) => {
    if (!user) return;

    try {
      const config = miningConfigContext.config;
      const newBalance = user.balance + amount;
      const newTotalPurchases = user.totalPurchases + amount;
      const powerIncrease = (newTotalPurchases / config.powerIncreaseThreshold) * (config.powerIncreasePercent / 100);
      const newMiningPower = 1 + powerIncrease;

      await supabase
        .from('users')
        .update({ 
          balance: newBalance,
          total_purchases: newTotalPurchases,
          mining_power: newMiningPower,
        })
        .eq('id', user.id);

      // Update withdrawal restrictions
      const { data: restrictions } = await supabase
        .from('withdrawal_restrictions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (restrictions) {
        await supabase
          .from('withdrawal_restrictions')
          .update({ 
            purchased_amount: (restrictions.purchased_amount || 0) + amount 
          })
          .eq('user_id', user.id);
      }

      // Create transaction
      const transactionId = `PUR-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      
      await supabase
        .from('transactions')
        .insert({
          transaction_id: transactionId,
          user_id: user.id,
          type: 'purchase',
          amount: amount,
          description: 'MXI Purchase',
          status: 'completed',
        });

      await refreshUser();
      console.log('✅ Purchase completed:', amount, 'MXI');
    } catch (error) {
      console.error('Error purchasing maxcoin:', error);
    }
  };

  const addReferralEarnings = async (amount: number) => {
    if (!user) return;

    try {
      const newBalance = user.balance + amount;
      const newReferralEarnings = user.referralEarnings + amount;

      await supabase
        .from('users')
        .update({ 
          balance: newBalance,
          referral_earnings: newReferralEarnings,
        })
        .eq('id', user.id);

      // Update commission earnings in restrictions
      const { data: restrictions } = await supabase
        .from('withdrawal_restrictions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (restrictions) {
        await supabase
          .from('withdrawal_restrictions')
          .update({ 
            commission_earnings: (restrictions.commission_earnings || 0) + amount 
          })
          .eq('user_id', user.id);
      }

      await refreshUser();
    } catch (error) {
      console.error('Error adding referral earnings:', error);
    }
  };

  const getTransactionHistory = (): Transaction[] => {
    if (!user || !user.transactions) return [];
    return user.transactions;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        updateBalance,
        purchaseMaxcoin,
        addReferralEarnings,
        refreshUser,
        transferMXI,
        withdrawMXI,
        updateWithdrawalAddress,
        getUserByReferralCode,
        getTransactionHistory,
        canWithdrawAmount,
        getReferralLink,
        getActiveReferralsCount,
        recordFirstPurchase,
        recordUnlockPayment,
        isUnlocked,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
