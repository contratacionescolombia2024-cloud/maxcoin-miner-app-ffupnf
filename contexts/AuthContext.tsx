
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
  uniqueIdentifier: string;
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

      users[senderIndex].balance -= amount;

      const recipientIndex = users.findIndex(u => u.id === recipient.id);
      users[recipientIndex].balance += recipientReceives;

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

      if (users[senderIndex].referredBy) {
        const level1Index = users.findIndex(u => u.id === users[senderIndex].referredBy);
        if (level1Index !== -1) {
          const level1Commission = commissionAmount * 0.5;
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

          if (users[level1Index].referredBy) {
            const level2Index = users.findIndex(u => u.id === users[level1Index].referredBy);
            if (level2Index !== -1) {
              const level2Commission = commissionAmount * 0.3;
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

              if (users[level2Index].referredBy) {
                const level3Index = users.findIndex(u => u.id === users[level2Index].referredBy);
                if (level3Index !== -1) {
                  const level3Commission = commissionAmount * 0.2;
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

      users[userIndex].balance -= amount;

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
