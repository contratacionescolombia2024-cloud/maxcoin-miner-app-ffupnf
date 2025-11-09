
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface MiningConfig {
  miningRatePerMinute: number; // Base mining rate in MXI per minute
  minPurchase: number; // Minimum MXI purchase amount
  maxPurchase: number; // Maximum MXI purchase amount per transaction
  powerIncreasePercent: number; // Percentage increase per threshold
  powerIncreaseThreshold: number; // MXI amount needed for power increase
  level1Commission: number; // Level 1 referral commission percentage
  level2Commission: number; // Level 2 referral commission percentage
  level3Commission: number; // Level 3 referral commission percentage
}

interface MiningConfigContextType {
  config: MiningConfig;
  updateConfig: (newConfig: Partial<MiningConfig>) => Promise<void>;
  resetConfig: () => Promise<void>;
}

const DEFAULT_CONFIG: MiningConfig = {
  miningRatePerMinute: 0.0002,
  minPurchase: 0.02,
  maxPurchase: 10000,
  powerIncreasePercent: 1,
  powerIncreaseThreshold: 10,
  level1Commission: 5,
  level2Commission: 2,
  level3Commission: 1,
};

const STORAGE_KEY = '@maxcoin_mining_config';

const MiningConfigContext = createContext<MiningConfigContextType | undefined>(undefined);

export const MiningConfigProvider = ({ children }: { children: ReactNode }) => {
  const [config, setConfig] = useState<MiningConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const savedConfig = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig({ ...DEFAULT_CONFIG, ...parsedConfig });
        console.log('Mining config loaded:', parsedConfig);
      }
    } catch (error) {
      console.error('Error loading mining config:', error);
    }
  };

  const updateConfig = async (newConfig: Partial<MiningConfig>) => {
    try {
      const updatedConfig = { ...config, ...newConfig };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedConfig));
      setConfig(updatedConfig);
      console.log('Mining config updated:', updatedConfig);
    } catch (error) {
      console.error('Error updating mining config:', error);
    }
  };

  const resetConfig = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CONFIG));
      setConfig(DEFAULT_CONFIG);
      console.log('Mining config reset to defaults');
    } catch (error) {
      console.error('Error resetting mining config:', error);
    }
  };

  return (
    <MiningConfigContext.Provider value={{ config, updateConfig, resetConfig }}>
      {children}
    </MiningConfigContext.Provider>
  );
};

export const useMiningConfig = () => {
  const context = useContext(MiningConfigContext);
  if (context === undefined) {
    throw new Error('useMiningConfig must be used within a MiningConfigProvider');
  }
  return context;
};
