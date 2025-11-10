
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface MiningAccessData {
  userId: string;
  hasAccess: boolean;
  purchaseDate?: string;
  expiryDate?: string;
  renewalCount: number;
  totalMined: number;
  totalWithdrawn: number;
  miningHistory: MiningHistoryEntry[];
}

export interface MiningHistoryEntry {
  id: string;
  date: string;
  amount: number;
  type: 'mining' | 'withdrawal';
}

interface MiningAccessContextType {
  getMiningAccess: (userId: string) => Promise<MiningAccessData | null>;
  purchaseMiningAccess: (userId: string, paymentMethod: string) => Promise<{ success: boolean; message?: string }>;
  renewMiningAccess: (userId: string) => Promise<{ success: boolean; message?: string }>;
  checkAccessExpiry: (userId: string) => Promise<boolean>;
  updateMiningMetrics: (userId: string, mined: number, withdrawn: number) => Promise<void>;
  getMiningAccessCost: () => number;
}

const STORAGE_KEY = '@maxcoin_mining_access';
const MINING_ACCESS_COST_USDT = 50;

const MiningAccessContext = createContext<MiningAccessContextType | undefined>(undefined);

export const MiningAccessProvider = ({ children }: { children: ReactNode }) => {
  const [miningAccessData, setMiningAccessData] = useState<{ [userId: string]: MiningAccessData }>({});

  useEffect(() => {
    loadMiningAccessData();
  }, []);

  const loadMiningAccessData = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        setMiningAccessData(JSON.parse(data));
        console.log('Mining access data loaded');
      }
    } catch (error) {
      console.error('Error loading mining access data:', error);
    }
  };

  const saveMiningAccessData = async (data: { [userId: string]: MiningAccessData }) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setMiningAccessData(data);
    } catch (error) {
      console.error('Error saving mining access data:', error);
    }
  };

  const getMiningAccess = async (userId: string): Promise<MiningAccessData | null> => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const allData = JSON.parse(data);
        return allData[userId] || null;
      }
      return null;
    } catch (error) {
      console.error('Error getting mining access:', error);
      return null;
    }
  };

  const purchaseMiningAccess = async (
    userId: string,
    paymentMethod: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      const allData = data ? JSON.parse(data) : {};

      const purchaseDate = new Date();
      const expiryDate = new Date(purchaseDate);
      expiryDate.setDate(expiryDate.getDate() + 30);

      const newAccess: MiningAccessData = {
        userId,
        hasAccess: true,
        purchaseDate: purchaseDate.toISOString(),
        expiryDate: expiryDate.toISOString(),
        renewalCount: 0,
        totalMined: 0,
        totalWithdrawn: 0,
        miningHistory: [],
      };

      allData[userId] = newAccess;
      await saveMiningAccessData(allData);

      console.log('Mining access purchased:', {
        userId,
        paymentMethod,
        cost: MINING_ACCESS_COST_USDT,
        expiryDate: expiryDate.toISOString(),
      });

      return { success: true };
    } catch (error) {
      console.error('Error purchasing mining access:', error);
      return { success: false, message: 'Failed to purchase mining access' };
    }
  };

  const renewMiningAccess = async (userId: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (!data) {
        return { success: false, message: 'No mining access found' };
      }

      const allData = JSON.parse(data);
      const userAccess = allData[userId];

      if (!userAccess) {
        return { success: false, message: 'No mining access found for user' };
      }

      const renewalDate = new Date();
      const expiryDate = new Date(renewalDate);
      expiryDate.setDate(expiryDate.getDate() + 30);

      userAccess.hasAccess = true;
      userAccess.purchaseDate = renewalDate.toISOString();
      userAccess.expiryDate = expiryDate.toISOString();
      userAccess.renewalCount += 1;

      allData[userId] = userAccess;
      await saveMiningAccessData(allData);

      console.log('Mining access renewed:', {
        userId,
        renewalCount: userAccess.renewalCount,
        expiryDate: expiryDate.toISOString(),
      });

      return { success: true };
    } catch (error) {
      console.error('Error renewing mining access:', error);
      return { success: false, message: 'Failed to renew mining access' };
    }
  };

  const checkAccessExpiry = async (userId: string): Promise<boolean> => {
    try {
      const access = await getMiningAccess(userId);
      if (!access || !access.hasAccess) return false;

      if (access.expiryDate) {
        const expiryDate = new Date(access.expiryDate);
        const now = new Date();
        
        if (now > expiryDate) {
          // Access expired, update status
          const data = await AsyncStorage.getItem(STORAGE_KEY);
          if (data) {
            const allData = JSON.parse(data);
            if (allData[userId]) {
              allData[userId].hasAccess = false;
              await saveMiningAccessData(allData);
            }
          }
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error checking access expiry:', error);
      return false;
    }
  };

  const updateMiningMetrics = async (userId: string, mined: number, withdrawn: number) => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (!data) return;

      const allData = JSON.parse(data);
      const userAccess = allData[userId];

      if (!userAccess) return;

      if (mined > 0) {
        userAccess.totalMined += mined;
        userAccess.miningHistory.push({
          id: `MIN-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          date: new Date().toISOString(),
          amount: mined,
          type: 'mining',
        });
      }

      if (withdrawn > 0) {
        userAccess.totalWithdrawn += withdrawn;
        userAccess.miningHistory.push({
          id: `WTH-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          date: new Date().toISOString(),
          amount: withdrawn,
          type: 'withdrawal',
        });
      }

      allData[userId] = userAccess;
      await saveMiningAccessData(allData);
    } catch (error) {
      console.error('Error updating mining metrics:', error);
    }
  };

  const getMiningAccessCost = () => MINING_ACCESS_COST_USDT;

  return (
    <MiningAccessContext.Provider
      value={{
        getMiningAccess,
        purchaseMiningAccess,
        renewMiningAccess,
        checkAccessExpiry,
        updateMiningMetrics,
        getMiningAccessCost,
      }}
    >
      {children}
    </MiningAccessContext.Provider>
  );
};

export const useMiningAccess = () => {
  const context = useContext(MiningAccessContext);
  if (context === undefined) {
    throw new Error('useMiningAccess must be used within a MiningAccessProvider');
  }
  return context;
};
