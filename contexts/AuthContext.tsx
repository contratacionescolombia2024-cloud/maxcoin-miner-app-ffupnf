
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CURRENT_USER: '@maxcoin_current_user',
  USERS: '@maxcoin_users',
};

const generateReferralCode = (username: string): string => {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${username.substring(0, 3).toUpperCase()}${random}`;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const purchaseMaxcoin = async (amount: number) => {
    if (!user) return;

    try {
      const usersData = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      if (!usersData) return;

      const users: User[] = JSON.parse(usersData);
      const userIndex = users.findIndex(u => u.id === user.id);

      if (userIndex !== -1) {
        users[userIndex].balance += amount;
        users[userIndex].totalPurchases += amount;
        users[userIndex].miningPower = 1 + (users[userIndex].totalPurchases / 10) * 0.1;

        // 3-Level Referral System
        // Level 1: 5% commission
        if (users[userIndex].referredBy) {
          const level1Index = users.findIndex(u => u.id === users[userIndex].referredBy);
          if (level1Index !== -1) {
            const level1Commission = amount * 0.05;
            users[level1Index].balance += level1Commission;
            users[level1Index].referralEarnings += level1Commission;
            console.log(`Level 1 referral commission: ${level1Commission} MXI`);

            // Level 2: 2% commission
            if (users[level1Index].referredBy) {
              const level2Index = users.findIndex(u => u.id === users[level1Index].referredBy);
              if (level2Index !== -1) {
                const level2Commission = amount * 0.02;
                users[level2Index].balance += level2Commission;
                users[level2Index].referralEarnings += level2Commission;
                console.log(`Level 2 referral commission: ${level2Commission} MXI`);

                // Level 3: 1% commission
                if (users[level2Index].referredBy) {
                  const level3Index = users.findIndex(u => u.id === users[level2Index].referredBy);
                  if (level3Index !== -1) {
                    const level3Commission = amount * 0.01;
                    users[level3Index].balance += level3Commission;
                    users[level3Index].referralEarnings += level3Commission;
                    console.log(`Level 3 referral commission: ${level3Commission} MXI`);
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
