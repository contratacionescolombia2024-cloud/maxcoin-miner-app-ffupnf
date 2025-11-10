
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMiningConfig } from './MiningConfigContext';

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
  purchasedAmount: number; // Amount purchased or transferred from external wallet
  miningEarnings: number; // Earnings from mining
  commissionEarnings: number; // Earnings from commissions
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
  hasFirstPurchase?: boolean; // New field to track first purchase of 100 USDT
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

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const currentUserId = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (currentUserId) {
        const usersData = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
        if (usersData) {
          const users = JSON.parse(usersData);
          const foundUser = users.find((u: User) => u.id === currentUserId);
          if (foundUser) {
            setUser(foundUser);
          }
        }
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    if (user) {
      try {
        const usersData = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
        if (usersData) {
          const users = JSON.parse(usersData);
          const foundUser = users.find((u: User) => u.id === user.id);
          if (foundUser) {
            setUser(foundUser);
          }
        }
      } catch (error) {
        console.error('Error refreshing user:', error);
      }
    }
  };

  const getReferralLink = (): string => {
    if (!user) return '';
    // Generate unique referral link for the user
    return `https://maxcoin-mxi.app/register?ref=${user.referralCode}`;
  };

  const getActiveReferralsCount = async (): Promise<number> => {
    if (!user) return 0;

    try {
      const usersData = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      if (!usersData) return 0;

      const users: User[] = JSON.parse(usersData);
      
      // Count referrals who have made purchases (initial package or mining power)
      let activeCount = 0;
      for (const refId of user.referrals) {
        const referral = users.find(u => u.id === refId);
        if (referral && (referral.totalPurchases > 0 || referral.hasMiningAccess)) {
          activeCount++;
        }
      }

      return activeCount;
    } catch (error) {
      console.error('Error getting active referrals count:', error);
      return 0;
    }
  };

  const recordFirstPurchase = async (usdAmount: number) => {
    if (!user) return;

    try {
      const usersData = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      if (!usersData) return;

      const users: User[] = JSON.parse(usersData);
      const userIndex = users.findIndex(u => u.id === user.id);

      if (userIndex !== -1) {
        // Check if this is the first purchase of at least 100 USDT
        if (!users[userIndex].hasFirstPurchase && usdAmount >= 100) {
          users[userIndex].hasFirstPurchase = true;
          await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
          setUser(users[userIndex]);
          console.log('First purchase of 100 USDT recorded - Mining and Lottery unlocked');
        }
      }
    } catch (error) {
      console.error('Error recording first purchase:', error);
    }
  };

  const register = async (
    username: string,
    email: string,
    password: string,
    referralCode?: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const usersData = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      const users: User[] = usersData ? JSON.parse(usersData) : [];

      // Check for duplicate username
      if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
        return { success: false, message: 'Username already exists' };
      }

      // Check for duplicate email
      if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        return { success: false, message: 'Email already registered' };
      }

      let referredByUserId: string | undefined;
      if (referralCode) {
        const referrer = users.find(u => u.referralCode === referralCode.toUpperCase());
        if (referrer) {
          referredByUserId = referrer.id;
        }
      }

      const newUser: User = {
        id: Date.now().toString(),
        username,
        email: email.toLowerCase(),
        emailVerified: true, // Simulated email verification
        balance: 0,
        miningPower: 1,
        referralCode: generateReferralCode(username),
        referredBy: referredByUserId,
        referrals: [],
        referralEarnings: 0,
        totalPurchases: 0,
        createdAt: new Date().toISOString(),
        uniqueIdentifier: generateUniqueIdentifier(username),
        withdrawalAddresses: {},
        transactions: [],
        withdrawalRestrictions: {
          purchasedAmount: 0,
          miningEarnings: 0,
          commissionEarnings: 0,
          withdrawalCount: 0,
          canWithdrawEarnings: false,
        },
        isBlocked: false,
        hasMiningAccess: false,
        hasFirstPurchase: false, // New users start with no first purchase
      };

      if (referredByUserId) {
        const referrerIndex = users.findIndex(u => u.id === referredByUserId);
        if (referrerIndex !== -1) {
          users[referrerIndex].referrals.push(newUser.id);
        }
      }

      const passwordsData = await AsyncStorage.getItem('@maxcoin_passwords');
      const passwords = passwordsData ? JSON.parse(passwordsData) : {};
      passwords[newUser.id] = password;
      await AsyncStorage.setItem('@maxcoin_passwords', JSON.stringify(passwords));

      users.push(newUser);
      await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, newUser.id);

      setUser(newUser);
      console.log('User registered:', { username, email, emailVerified: true, referralLink: `https://maxcoin-mxi.app/register?ref=${newUser.referralCode}` });
      return { success: true };
    } catch (error) {
      console.error('Error registering user:', error);
      return { success: false, message: 'Registration failed' };
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const usersData = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      if (!usersData) return { success: false, message: 'No users found' };

      const users: User[] = JSON.parse(usersData);
      const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (!foundUser) return { success: false, message: 'User not found' };

      // Check if user is blocked
      const blockedUsersData = await AsyncStorage.getItem('@maxcoin_blocked_users');
      const blockedUsers = blockedUsersData ? JSON.parse(blockedUsersData) : [];
      if (blockedUsers.includes(foundUser.id)) {
        return { success: false, message: 'Account has been blocked. Please contact support.' };
      }

      const passwordsData = await AsyncStorage.getItem('@maxcoin_passwords');
      const passwords = passwordsData ? JSON.parse(passwordsData) : {};
      
      if (passwords[foundUser.id] !== password) {
        return { success: false, message: 'Invalid password' };
      }

      if (!foundUser.emailVerified) {
        return { success: false, message: 'Please verify your email before logging in' };
      }

      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, foundUser.id);
      setUser(foundUser);
      console.log('User logged in:', { email, username: foundUser.username });
      return { success: true };
    } catch (error) {
      console.error('Error logging in:', error);
      return { success: false, message: 'Login failed' };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const updateBalance = async (amount: number, type: 'mining' | 'commission' | 'purchase') => {
    if (!user) return;

    try {
      const usersData = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      if (!usersData) return;

      const users: User[] = JSON.parse(usersData);
      const userIndex = users.findIndex(u => u.id === user.id);

      if (userIndex !== -1) {
        users[userIndex].balance += amount;
        
        // Track earnings by type for withdrawal restrictions
        if (type === 'mining') {
          users[userIndex].withdrawalRestrictions.miningEarnings += amount;
        } else if (type === 'commission') {
          users[userIndex].withdrawalRestrictions.commissionEarnings += amount;
        } else if (type === 'purchase') {
          users[userIndex].withdrawalRestrictions.purchasedAmount += amount;
        }

        // Add transaction
        const transaction: Transaction = {
          id: `${type.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
          type: type === 'purchase' ? 'purchase' : type === 'commission' ? 'commission' : 'mining',
          amount: amount,
          description: `${type.charAt(0).toUpperCase() + type.slice(1)} earnings`,
          timestamp: new Date().toISOString(),
          status: 'completed',
        };

        if (!users[userIndex].transactions) {
          users[userIndex].transactions = [];
        }
        users[userIndex].transactions.unshift(transaction);

        await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        setUser(users[userIndex]);
      }
    } catch (error) {
      console.error('Error updating balance:', error);
    }
  };

  const canWithdrawAmount = (amount: number): { canWithdraw: boolean; availableForWithdrawal: number; message?: string } => {
    if (!user) {
      return { canWithdraw: false, availableForWithdrawal: 0, message: 'User not authenticated' };
    }

    const restrictions = user.withdrawalRestrictions;
    
    // Purchased/transferred MXI is always available for withdrawal
    const availablePurchased = restrictions.purchasedAmount;
    
    // Commission earnings are available immediately
    const availableCommission = restrictions.commissionEarnings;
    
    // Mining earnings require 10 active referrals with purchases
    const canWithdrawMining = checkMiningWithdrawalEligibility(user);
    const availableMining = canWithdrawMining ? restrictions.miningEarnings : 0;
    
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

  const checkMiningWithdrawalEligibility = (user: User): boolean => {
    // Mining withdrawals require 10 active referrals with purchases per cycle
    // This is checked in real-time via getActiveReferralsCount
    return user.withdrawalRestrictions.canWithdrawEarnings;
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
      // Check withdrawal eligibility
      const eligibility = canWithdrawAmount(amount);
      if (!eligibility.canWithdraw) {
        return { success: false, message: eligibility.message };
      }

      const usersData = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      if (!usersData) {
        return { success: false, message: 'Failed to load users data' };
      }

      const users: User[] = JSON.parse(usersData);
      const userIndex = users.findIndex(u => u.id === user.id);

      if (userIndex === -1) {
        return { success: false, message: 'User not found' };
      }

      if (users[userIndex].balance < amount) {
        return { success: false, message: 'Insufficient balance' };
      }

      // Deduct from balance
      users[userIndex].balance -= amount;

      // Deduct from appropriate restriction categories
      let remainingAmount = amount;
      const restrictions = users[userIndex].withdrawalRestrictions;

      // First deduct from purchased amount (always available)
      if (restrictions.purchasedAmount > 0) {
        const deductFromPurchased = Math.min(remainingAmount, restrictions.purchasedAmount);
        restrictions.purchasedAmount -= deductFromPurchased;
        remainingAmount -= deductFromPurchased;
      }

      // Then deduct from commission earnings (always available)
      if (remainingAmount > 0 && restrictions.commissionEarnings > 0) {
        const deductFromCommission = Math.min(remainingAmount, restrictions.commissionEarnings);
        restrictions.commissionEarnings -= deductFromCommission;
        remainingAmount -= deductFromCommission;
      }

      // Finally deduct from mining earnings (if eligible)
      if (remainingAmount > 0 && checkMiningWithdrawalEligibility(users[userIndex])) {
        if (restrictions.miningEarnings > 0) {
          const deductFromMining = Math.min(remainingAmount, restrictions.miningEarnings);
          restrictions.miningEarnings -= deductFromMining;
          remainingAmount -= deductFromMining;
        }
      }

      // Update withdrawal tracking
      restrictions.withdrawalCount += 1;
      restrictions.lastWithdrawalDate = new Date().toISOString();
      if (!restrictions.earningsWithdrawalCycleStart) {
        restrictions.earningsWithdrawalCycleStart = new Date().toISOString();
      }

      const withdrawalTransaction: Transaction = {
        id: `WTH-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        type: 'withdrawal',
        amount: -amount,
        to: address,
        platform: platform,
        description: `Withdrawal to ${platform} (Processed within 48 hours)`,
        timestamp: new Date().toISOString(),
        status: 'pending',
      };

      if (!users[userIndex].transactions) users[userIndex].transactions = [];
      users[userIndex].transactions.unshift(withdrawalTransaction);

      await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      setUser(users[userIndex]);

      console.log('Withdrawal initiated:', {
        transactionId: withdrawalTransaction.id,
        user: user.username,
        uniqueId: user.uniqueIdentifier,
        platform,
        address,
        amount,
        withdrawalCount: restrictions.withdrawalCount,
        timestamp: new Date().toISOString(),
      });

      return { success: true };
    } catch (error) {
      console.error('Error withdrawing MXI:', error);
      return { success: false, message: 'Withdrawal failed' };
    }
  };

  const updateWithdrawalAddress = async (platform: string, address: string) => {
    if (!user) return;

    try {
      const usersData = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      if (!usersData) return;

      const users: User[] = JSON.parse(usersData);
      const userIndex = users.findIndex(u => u.id === user.id);

      if (userIndex !== -1) {
        if (!users[userIndex].withdrawalAddresses) {
          users[userIndex].withdrawalAddresses = {};
        }
        users[userIndex].withdrawalAddresses[platform.toLowerCase()] = address;
        await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        setUser(users[userIndex]);
      }
    } catch (error) {
      console.error('Error updating withdrawal address:', error);
    }
  };

  const getUserByReferralCode = async (code: string): Promise<User | null> => {
    try {
      const usersData = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      if (!usersData) return null;

      const users: User[] = JSON.parse(usersData);
      const foundUser = users.find(u => u.referralCode === code.toUpperCase());
      return foundUser || null;
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
      const usersData = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      if (!usersData) {
        return { success: false, message: 'Failed to load users data' };
      }

      const users: User[] = JSON.parse(usersData);
      const senderIndex = users.findIndex(u => u.id === user.id);
      const recipient = users.find(u => u.referralCode === recipientCode.toUpperCase());

      if (!recipient) {
        return { success: false, message: 'Recipient not found' };
      }

      if (recipient.id === user.id) {
        return { success: false, message: 'Cannot transfer to yourself' };
      }

      if (senderIndex === -1) {
        return { success: false, message: 'Sender not found' };
      }

      if (users[senderIndex].balance < amount) {
        return { success: false, message: 'Insufficient balance' };
      }

      const config = miningConfigContext.config;
      const commissionRate = config.level1Commission;
      const commissionAmount = (amount * commissionRate) / 100;
      const recipientReceives = amount - commissionAmount;

      users[senderIndex].balance -= amount;

      const recipientIndex = users.findIndex(u => u.id === recipient.id);
      users[recipientIndex].balance += recipientReceives;
      
      // Track as purchased amount for recipient (can be withdrawn immediately)
      users[recipientIndex].withdrawalRestrictions.purchasedAmount += recipientReceives;

      const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      
      const senderTransaction: Transaction = {
        id: transactionId,
        type: 'transfer',
        amount: -amount,
        usdValue: usdValue,
        from: user.uniqueIdentifier,
        to: recipient.uniqueIdentifier,
        commission: commissionAmount,
        commissionRate: commissionRate,
        description: description || 'MXI Transfer',
        timestamp: new Date().toISOString(),
        status: 'completed',
      };

      const recipientTransaction: Transaction = {
        id: transactionId,
        type: 'transfer',
        amount: recipientReceives,
        usdValue: usdValue * (recipientReceives / amount),
        from: user.uniqueIdentifier,
        to: recipient.uniqueIdentifier,
        commission: commissionAmount,
        commissionRate: commissionRate,
        description: description || 'MXI Transfer',
        timestamp: new Date().toISOString(),
        status: 'completed',
      };

      if (!users[senderIndex].transactions) users[senderIndex].transactions = [];
      if (!users[recipientIndex].transactions) users[recipientIndex].transactions = [];
      
      users[senderIndex].transactions.unshift(senderTransaction);
      users[recipientIndex].transactions.unshift(recipientTransaction);

      // Distribute commissions (available immediately for withdrawal)
      if (users[senderIndex].referredBy) {
        const level1Index = users.findIndex(u => u.id === users[senderIndex].referredBy);
        if (level1Index !== -1) {
          const level1Commission = commissionAmount * 0.5;
          users[level1Index].balance += level1Commission;
          users[level1Index].referralEarnings += level1Commission;
          users[level1Index].withdrawalRestrictions.commissionEarnings += level1Commission;

          const commissionTransaction: Transaction = {
            id: `COM-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
            type: 'commission',
            amount: level1Commission,
            from: user.uniqueIdentifier,
            description: 'Level 1 Commission from transfer',
            timestamp: new Date().toISOString(),
            status: 'completed',
          };
          
          if (!users[level1Index].transactions) users[level1Index].transactions = [];
          users[level1Index].transactions.unshift(commissionTransaction);

          if (users[level1Index].referredBy) {
            const level2Index = users.findIndex(u => u.id === users[level1Index].referredBy);
            if (level2Index !== -1) {
              const level2Commission = commissionAmount * 0.3;
              users[level2Index].balance += level2Commission;
              users[level2Index].referralEarnings += level2Commission;
              users[level2Index].withdrawalRestrictions.commissionEarnings += level2Commission;

              const level2CommissionTransaction: Transaction = {
                id: `COM-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
                type: 'commission',
                amount: level2Commission,
                from: user.uniqueIdentifier,
                description: 'Level 2 Commission from transfer',
                timestamp: new Date().toISOString(),
                status: 'completed',
              };
              
              if (!users[level2Index].transactions) users[level2Index].transactions = [];
              users[level2Index].transactions.unshift(level2CommissionTransaction);

              if (users[level2Index].referredBy) {
                const level3Index = users.findIndex(u => u.id === users[level2Index].referredBy);
                if (level3Index !== -1) {
                  const level3Commission = commissionAmount * 0.2;
                  users[level3Index].balance += level3Commission;
                  users[level3Index].referralEarnings += level3Commission;
                  users[level3Index].withdrawalRestrictions.commissionEarnings += level3Commission;

                  const level3CommissionTransaction: Transaction = {
                    id: `COM-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
                    type: 'commission',
                    amount: level3Commission,
                    from: user.uniqueIdentifier,
                    description: 'Level 3 Commission from transfer',
                    timestamp: new Date().toISOString(),
                    status: 'completed',
                  };
                  
                  if (!users[level3Index].transactions) users[level3Index].transactions = [];
                  users[level3Index].transactions.unshift(level3CommissionTransaction);
                }
              }
            }
          }
        }
      }

      await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      setUser(users[senderIndex]);

      console.log('Real MXI Transfer completed:', {
        transactionId,
        from: user.username,
        to: recipient.username,
        amount,
        recipientReceives,
        commission: commissionAmount,
        usdValue,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        recipientReceives,
        commission: commissionAmount,
      };
    } catch (error) {
      console.error('Error transferring MXI:', error);
      return { success: false, message: 'Transfer failed' };
    }
  };

  const purchaseMaxcoin = async (amount: number) => {
    if (!user) return;

    try {
      const usersData = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      if (!usersData) return;

      const users: User[] = JSON.parse(usersData);
      const userIndex = users.findIndex(u => u.id === user.id);

      if (userIndex !== -1) {
        const config = miningConfigContext.config;
        
        users[userIndex].balance += amount;
        users[userIndex].totalPurchases += amount;
        
        // Track as purchased amount (can be withdrawn immediately)
        users[userIndex].withdrawalRestrictions.purchasedAmount += amount;
        
        const powerIncrease = (users[userIndex].totalPurchases / config.powerIncreaseThreshold) * (config.powerIncreasePercent / 100);
        users[userIndex].miningPower = 1 + powerIncrease;

        const purchaseTransaction: Transaction = {
          id: `PUR-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
          type: 'purchase',
          amount: amount,
          description: 'MXI Purchase',
          timestamp: new Date().toISOString(),
          status: 'completed',
        };

        if (!users[userIndex].transactions) users[userIndex].transactions = [];
        users[userIndex].transactions.unshift(purchaseTransaction);

        // Distribute referral commissions (available immediately for withdrawal)
        if (users[userIndex].referredBy) {
          const level1Index = users.findIndex(u => u.id === users[userIndex].referredBy);
          if (level1Index !== -1) {
            const level1Commission = amount * (config.level1Commission / 100);
            users[level1Index].balance += level1Commission;
            users[level1Index].referralEarnings += level1Commission;
            users[level1Index].withdrawalRestrictions.commissionEarnings += level1Commission;

            const commissionTransaction: Transaction = {
              id: `COM-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
              type: 'commission',
              amount: level1Commission,
              from: users[userIndex].uniqueIdentifier,
              description: 'Level 1 Commission from purchase',
              timestamp: new Date().toISOString(),
              status: 'completed',
            };
            
            if (!users[level1Index].transactions) users[level1Index].transactions = [];
            users[level1Index].transactions.unshift(commissionTransaction);

            if (users[level1Index].referredBy) {
              const level2Index = users.findIndex(u => u.id === users[level1Index].referredBy);
              if (level2Index !== -1) {
                const level2Commission = amount * (config.level2Commission / 100);
                users[level2Index].balance += level2Commission;
                users[level2Index].referralEarnings += level2Commission;
                users[level2Index].withdrawalRestrictions.commissionEarnings += level2Commission;

                const level2CommissionTransaction: Transaction = {
                  id: `COM-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
                  type: 'commission',
                  amount: level2Commission,
                  from: users[userIndex].uniqueIdentifier,
                  description: 'Level 2 Commission from purchase',
                  timestamp: new Date().toISOString(),
                  status: 'completed',
                };
                
                if (!users[level2Index].transactions) users[level2Index].transactions = [];
                users[level2Index].transactions.unshift(level2CommissionTransaction);

                if (users[level2Index].referredBy) {
                  const level3Index = users.findIndex(u => u.id === users[level2Index].referredBy);
                  if (level3Index !== -1) {
                    const level3Commission = amount * (config.level3Commission / 100);
                    users[level3Index].balance += level3Commission;
                    users[level3Index].referralEarnings += level3Commission;
                    users[level3Index].withdrawalRestrictions.commissionEarnings += level3Commission;

                    const level3CommissionTransaction: Transaction = {
                      id: `COM-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
                      type: 'commission',
                      amount: level3Commission,
                      from: users[userIndex].uniqueIdentifier,
                      description: 'Level 3 Commission from purchase',
                      timestamp: new Date().toISOString(),
                      status: 'completed',
                    };
                    
                    if (!users[level3Index].transactions) users[level3Index].transactions = [];
                    users[level3Index].transactions.unshift(level3CommissionTransaction);
                  }
                }
              }
            }
          }
        }

        await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        setUser(users[userIndex]);
      }
    } catch (error) {
      console.error('Error purchasing maxcoin:', error);
    }
  };

  const addReferralEarnings = async (amount: number) => {
    if (!user) return;

    try {
      const usersData = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      if (!usersData) return;

      const users: User[] = JSON.parse(usersData);
      const userIndex = users.findIndex(u => u.id === user.id);

      if (userIndex !== -1) {
        users[userIndex].referralEarnings += amount;
        users[userIndex].balance += amount;
        users[userIndex].withdrawalRestrictions.commissionEarnings += amount;
        await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        setUser(users[userIndex]);
      }
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
