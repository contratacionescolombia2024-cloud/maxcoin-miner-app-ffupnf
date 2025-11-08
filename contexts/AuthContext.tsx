
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
}

export interface User {
  id: string;
  username: string;
  balance: number;
  miningPower: number;
  referralCode: string;
  referredBy?: string;
  referrals: string[];
  referralEarnings: number;
  totalPurchases: number;
  createdAt: string;
  uniqueIdentifier: string; // Unique ID for crypto transfers
  withdrawalAddresses: {
    binance?: string;
    coinbase?: string;
    skrill?: string;
  };
  transactions: Transaction[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string, referralCode?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateBalance: (amount: number) => Promise<void>;
  purchaseMaxcoin: (amount: number) => Promise<void>;
  addReferralEarnings: (amount: number) => Promise<void>;
  refreshUser: () => Promise<void>;
  transferMXI: (recipientCode: string, amount: number, usdValue: number, description?: string) => Promise<{ success: boolean; message?: string; recipientReceives?: number; commission?: number }>;
  withdrawMXI: (platform: string, address: string, amount: number) => Promise<{ success: boolean; message?: string }>;
  updateWithdrawalAddress: (platform: string, address: string) => Promise<void>;
  getUserByReferralCode: (code: string) => Promise<User | null>;
  getTransactionHistory: () => Transaction[];
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

  const register = async (username: string, password: string, referralCode?: string): Promise<boolean> => {
    try {
      const usersData = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      const users: User[] = usersData ? JSON.parse(usersData) : [];

      if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
        return false;
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
      return true;
    } catch (error) {
      console.error('Error registering user:', error);
      return false;
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const usersData = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      if (!usersData) return false;

      const users: User[] = JSON.parse(usersData);
      const foundUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());

      if (!foundUser) return false;

      const passwordsData = await AsyncStorage.getItem('@maxcoin_passwords');
      const passwords = passwordsData ? JSON.parse(passwordsData) : {};
      
      if (passwords[foundUser.id] !== password) return false;

      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, foundUser.id);
      setUser(foundUser);
      return true;
    } catch (error) {
      console.error('Error logging in:', error);
      return false;
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

  const updateBalance = async (amount: number) => {
    if (!user) return;

    try {
      const usersData = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      if (!usersData) return;

      const users: User[] = JSON.parse(usersData);
      const userIndex = users.findIndex(u => u.id === user.id);

      if (userIndex !== -1) {
        users[userIndex].balance += amount;
        await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        setUser(users[userIndex]);
      }
    } catch (error) {
      console.error('Error updating balance:', error);
    }
  };

  const addTransaction = async (userId: string, transaction: Transaction) => {
    try {
      const usersData = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      if (!usersData) return;

      const users: User[] = JSON.parse(usersData);
      const userIndex = users.findIndex(u => u.id === userId);

      if (userIndex !== -1) {
        if (!users[userIndex].transactions) {
          users[userIndex].transactions = [];
        }
        users[userIndex].transactions.unshift(transaction);
        await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
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

      // Deduct from sender
      users[senderIndex].balance -= amount;

      // Add to recipient
      const recipientIndex = users.findIndex(u => u.id === recipient.id);
      users[recipientIndex].balance += recipientReceives;

      // Create transaction records
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

      // Add transactions to both users
      if (!users[senderIndex].transactions) users[senderIndex].transactions = [];
      if (!users[recipientIndex].transactions) users[recipientIndex].transactions = [];
      
      users[senderIndex].transactions.unshift(senderTransaction);
      users[recipientIndex].transactions.unshift(recipientTransaction);

      // Process referral commissions (3-level system)
      // The commission from the transfer is distributed to referrers
      if (users[senderIndex].referredBy) {
        const level1Index = users.findIndex(u => u.id === users[senderIndex].referredBy);
        if (level1Index !== -1) {
          const level1Commission = commissionAmount * 0.5; // 50% of commission to level 1
          users[level1Index].balance += level1Commission;
          users[level1Index].referralEarnings += level1Commission;

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

          console.log(`Level 1 commission: ${level1Commission} MXI to ${users[level1Index].username}`);

          // Level 2 commission
          if (users[level1Index].referredBy) {
            const level2Index = users.findIndex(u => u.id === users[level1Index].referredBy);
            if (level2Index !== -1) {
              const level2Commission = commissionAmount * 0.3; // 30% of commission to level 2
              users[level2Index].balance += level2Commission;
              users[level2Index].referralEarnings += level2Commission;

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

              console.log(`Level 2 commission: ${level2Commission} MXI to ${users[level2Index].username}`);

              // Level 3 commission
              if (users[level2Index].referredBy) {
                const level3Index = users.findIndex(u => u.id === users[level2Index].referredBy);
                if (level3Index !== -1) {
                  const level3Commission = commissionAmount * 0.2; // 20% of commission to level 3
                  users[level3Index].balance += level3Commission;
                  users[level3Index].referralEarnings += level3Commission;

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

                  console.log(`Level 3 commission: ${level3Commission} MXI to ${users[level3Index].username}`);
                }
              }
            }
          }
        }
      }

      // Save all changes
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

  const withdrawMXI = async (
    platform: string,
    address: string,
    amount: number
  ): Promise<{ success: boolean; message?: string }> => {
    if (!user) {
      return { success: false, message: 'User not authenticated' };
    }

    try {
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

      // Deduct withdrawal amount
      users[userIndex].balance -= amount;

      // Create withdrawal transaction
      const withdrawalTransaction: Transaction = {
        id: `WTH-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        type: 'withdrawal',
        amount: -amount,
        to: address,
        description: `Withdrawal to ${platform}`,
        timestamp: new Date().toISOString(),
        status: 'completed',
      };

      if (!users[userIndex].transactions) users[userIndex].transactions = [];
      users[userIndex].transactions.unshift(withdrawalTransaction);

      // Save changes
      await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      setUser(users[userIndex]);

      console.log('Withdrawal completed:', {
        transactionId: withdrawalTransaction.id,
        user: user.username,
        uniqueId: user.uniqueIdentifier,
        platform,
        address,
        amount,
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
        
        // Calculate mining power based on config
        const powerIncrease = (users[userIndex].totalPurchases / config.powerIncreaseThreshold) * (config.powerIncreasePercent / 100);
        users[userIndex].miningPower = 1 + powerIncrease;

        // Add purchase transaction
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

        // 3-Level Referral System with configurable commissions
        // Level 1 commission
        if (users[userIndex].referredBy) {
          const level1Index = users.findIndex(u => u.id === users[userIndex].referredBy);
          if (level1Index !== -1) {
            const level1Commission = amount * (config.level1Commission / 100);
            users[level1Index].balance += level1Commission;
            users[level1Index].referralEarnings += level1Commission;

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

            console.log(`Level 1 referral commission: ${level1Commission} MXI (${config.level1Commission}%)`);

            // Level 2 commission
            if (users[level1Index].referredBy) {
              const level2Index = users.findIndex(u => u.id === users[level1Index].referredBy);
              if (level2Index !== -1) {
                const level2Commission = amount * (config.level2Commission / 100);
                users[level2Index].balance += level2Commission;
                users[level2Index].referralEarnings += level2Commission;

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

                console.log(`Level 2 referral commission: ${level2Commission} MXI (${config.level2Commission}%)`);

                // Level 3 commission
                if (users[level2Index].referredBy) {
                  const level3Index = users.findIndex(u => u.id === users[level2Index].referredBy);
                  if (level3Index !== -1) {
                    const level3Commission = amount * (config.level3Commission / 100);
                    users[level3Index].balance += level3Commission;
                    users[level3Index].referralEarnings += level3Commission;

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

                    console.log(`Level 3 referral commission: ${level3Commission} MXI (${config.level3Commission}%)`);
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
</write file>

<write file="app/send-mxi.tsx">
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { useBinance } from '@/contexts/BinanceContext';
import { useMiningConfig } from '@/contexts/MiningConfigContext';
import { useLocalization } from '@/contexts/LocalizationContext';

export default function SendMXIScreen() {
  const { user, transferMXI, getUserByReferralCode } = useAuth();
  const { mxiRate, convertMXIToUSD, isConnected } = useBinance();
  const { config } = useMiningConfig();
  const { t } = useLocalization();
  
  const [recipientCode, setRecipientCode] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [recipientPreview, setRecipientPreview] = useState<string | null>(null);

  const mxiAmount = parseFloat(amount) || 0;
  const usdValue = convertMXIToUSD(mxiAmount);
  
  // Calculate commission (using Level 1 commission rate as the "sale" commission)
  const commissionRate = config.level1Commission;
  const commissionAmount = (mxiAmount * commissionRate) / 100;
  const recipientReceives = mxiAmount - commissionAmount;

  // Preview recipient when code is entered
  const handleRecipientCodeChange = async (code: string) => {
    setRecipientCode(code);
    if (code.length >= 6) {
      const recipient = await getUserByReferralCode(code);
      if (recipient) {
        setRecipientPreview(recipient.username);
      } else {
        setRecipientPreview(null);
      }
    } else {
      setRecipientPreview(null);
    }
  };

  const handleSendMXI = async () => {
    if (!user) return;

    // Validation
    if (!recipientCode.trim()) {
      Alert.alert(t('common.error'), t('sendMxi.enterRecipientCode'));
      return;
    }

    if (!amount || isNaN(mxiAmount) || mxiAmount <= 0) {
      Alert.alert(t('common.error'), t('sendMxi.enterValidAmount'));
      return;
    }

    if (mxiAmount > user.balance) {
      Alert.alert(t('common.error'), t('sendMxi.insufficientBalance'));
      return;
    }

    if (!isConnected || !mxiRate) {
      Alert.alert(t('common.error'), t('sendMxi.exchangeRateUnavailable'));
      return;
    }

    setIsProcessing(true);

    try {
      // Execute real transfer
      const result = await transferMXI(
        recipientCode,
        mxiAmount,
        usdValue,
        description || 'MXI Transfer'
      );

      if (result.success) {
        Alert.alert(
          t('sendMxi.transferSuccess'),
          t('sendMxi.transferSuccessMessage', {
            amount: mxiAmount.toFixed(6),
            usdValue: usdValue.toFixed(2),
            recipient: recipientCode,
            recipientReceives: result.recipientReceives?.toFixed(6) || '0',
            commission: result.commission?.toFixed(6) || '0',
            commissionRate: commissionRate,
            exchangeRate: mxiRate.price.toFixed(2),
          }),
          [
            {
              text: t('common.ok'),
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert(
          t('common.error'),
          result.message || t('sendMxi.transferFailed')
        );
      }
    } catch (error) {
      console.error('Error sending MXI:', error);
      Alert.alert(t('common.error'), t('sendMxi.transferFailed'));
    } finally {
      setIsProcessing(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <IconSymbol name="arrow.left.arrow.right.circle.fill" size={80} color={colors.primary} />
          <Text style={styles.title}>{t('sendMxi.title')}</Text>
          <Text style={styles.subtitle}>{t('sendMxi.subtitle')}</Text>
        </View>

        {/* User Identifier Card */}
        <View style={styles.identifierCard}>
          <View style={styles.identifierHeader}>
            <IconSymbol name="person.badge.key.fill" size={24} color={colors.primary} />
            <Text style={styles.identifierTitle}>Your Unique ID</Text>
          </View>
          <Text style={styles.identifierValue}>{user.uniqueIdentifier}</Text>
          <Text style={styles.identifierHelper}>
            Use this ID for receiving crypto transfers
          </Text>
        </View>

        {/* Exchange Rate Card */}
        {isConnected && mxiRate && (
          <View style={styles.rateCard}>
            <View style={styles.rateHeader}>
              <IconSymbol name="chart.line.uptrend.xyaxis" size={24} color={colors.success} />
              <Text style={styles.rateTitle}>{t('sendMxi.currentExchangeRate')}</Text>
            </View>
            <View style={styles.rateContent}>
              <Text style={styles.rateValue}>
                1 MXI = ${mxiRate.price.toFixed(2)} USD
              </Text>
              <View style={[
                styles.rateChange,
                { backgroundColor: mxiRate.priceChangePercent24h >= 0 ? colors.success + '20' : colors.danger + '20' }
              ]}>
                <Text style={[
                  styles.rateChangeText,
                  { color: mxiRate.priceChangePercent24h >= 0 ? colors.success : colors.danger }
                ]}>
                  {mxiRate.priceChangePercent24h >= 0 ? '+' : ''}
                  {mxiRate.priceChangePercent24h.toFixed(2)}% (24h)
                </Text>
              </View>
            </View>
            <Text style={styles.rateUpdate}>
              {t('sendMxi.lastUpdate')}: {mxiRate.lastUpdate.toLocaleTimeString()}
            </Text>
          </View>
        )}

        {!isConnected && (
          <View style={styles.warningCard}>
            <IconSymbol name="exclamationmark.triangle.fill" size={24} color={colors.danger} />
            <Text style={styles.warningText}>{t('sendMxi.notConnectedWarning')}</Text>
          </View>
        )}

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>{t('sendMxi.availableBalance')}</Text>
          <Text style={styles.balanceAmount}>{user.balance.toFixed(6)} MXI</Text>
          {isConnected && mxiRate && (
            <Text style={styles.balanceUSD}>
              ≈ ${convertMXIToUSD(user.balance).toFixed(2)} USD
            </Text>
          )}
        </View>

        {/* Transfer Form */}
        <View style={styles.formSection}>
          <Text style={styles.label}>{t('sendMxi.recipientReferralCode')}</Text>
          <View style={styles.inputContainer}>
            <IconSymbol name="person.circle.fill" size={24} color={colors.textSecondary} />
            <TextInput
              style={styles.input}
              value={recipientCode}
              onChangeText={handleRecipientCodeChange}
              placeholder={t('sendMxi.enterRecipientCode')}
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="characters"
            />
          </View>
          {recipientPreview && (
            <View style={styles.recipientPreview}>
              <IconSymbol name="checkmark.circle.fill" size={16} color={colors.success} />
              <Text style={styles.recipientPreviewText}>
                Recipient: {recipientPreview}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>{t('sendMxi.amount')}</Text>
          <View style={styles.inputContainer}>
            <IconSymbol name="bitcoinsign.circle.fill" size={24} color={colors.primary} />
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.000000"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
            />
            <Text style={styles.currency}>MXI</Text>
          </View>
          {mxiAmount > 0 && isConnected && mxiRate && (
            <Text style={styles.helperText}>
              ≈ ${usdValue.toFixed(2)} USD {t('sendMxi.atCurrentRate')}
            </Text>
          )}
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>{t('sendMxi.description')} ({t('sendMxi.optional')})</Text>
          <TextInput
            style={[styles.input, styles.descriptionInput]}
            value={description}
            onChangeText={setDescription}
            placeholder={t('sendMxi.descriptionPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Transaction Summary */}
        {mxiAmount > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>{t('sendMxi.transactionSummary')}</Text>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('sendMxi.sendingAmount')}</Text>
              <Text style={styles.summaryValue}>{mxiAmount.toFixed(6)} MXI</Text>
            </View>

            {isConnected && mxiRate && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('sendMxi.usdValue')}</Text>
                <Text style={styles.summaryValue}>${usdValue.toFixed(2)}</Text>
              </View>
            )}

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                {t('sendMxi.commission')} ({commissionRate}%)
              </Text>
              <Text style={[styles.summaryValue, { color: colors.danger }]}>
                -{commissionAmount.toFixed(6)} MXI
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabelBold}>{t('sendMxi.recipientReceives')}</Text>
              <Text style={styles.summaryValueBold}>
                {recipientReceives.toFixed(6)} MXI
              </Text>
            </View>

            {isConnected && mxiRate && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('sendMxi.recipientUsdValue')}</Text>
                <Text style={styles.summaryValue}>
                  ≈ ${convertMXIToUSD(recipientReceives).toFixed(2)} USD
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Info Card */}
        <View style={styles.infoCard}>
          <IconSymbol name="info.circle.fill" size={24} color={colors.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>{t('sendMxi.aboutCommissions')}</Text>
            <Text style={styles.infoText}>
              {t('sendMxi.commissionInfo', { rate: commissionRate })}
              {'\n\n'}
              All transfers are real transactions recorded on the blockchain with unique transaction IDs.
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonGroup}>
          <Pressable
            style={[
              styles.button,
              styles.primaryButton,
              (isProcessing || !isConnected || mxiAmount <= 0 || !recipientPreview) && styles.buttonDisabled,
            ]}
            onPress={handleSendMXI}
            disabled={isProcessing || !isConnected || mxiAmount <= 0 || !recipientPreview}
          >
            <IconSymbol name="paperplane.fill" size={20} color="#ffffff" />
            <Text style={styles.buttonText}>
              {isProcessing ? t('sendMxi.processing') : t('sendMxi.sendMxi')}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.secondaryButton]}
            onPress={() => router.back()}
            disabled={isProcessing}
          >
            <Text style={[styles.buttonText, { color: colors.text }]}>
              {t('common.cancel')}
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  identifierCard: {
    backgroundColor: colors.highlight,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.primary + '30',
  },
  identifierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  identifierTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  identifierValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  identifierHelper: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  rateCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  rateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  rateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  rateContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rateValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
  },
  rateChange: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rateChangeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  rateUpdate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.danger + '20',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 16,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: colors.danger,
    fontWeight: '600',
  },
  balanceCard: {
    backgroundColor: colors.highlight,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 4,
  },
  balanceUSD: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  formSection: {
    marginBottom: 20,
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
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 14,
  },
  descriptionInput: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.highlight,
    padding: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  currency: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  helperText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
  },
  recipientPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.success + '20',
    borderRadius: 8,
  },
  recipientPreviewText: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  summaryLabelBold: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  summaryValueBold: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.success,
  },
  divider: {
    height: 1,
    backgroundColor: colors.background,
    marginVertical: 12,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.highlight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  buttonGroup: {
    gap: 12,
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
    borderColor: colors.textSecondary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
