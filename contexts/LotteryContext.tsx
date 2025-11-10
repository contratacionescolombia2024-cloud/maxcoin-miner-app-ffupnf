
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LotteryConfig {
  ticketPrice: number; // Price per ticket in MXI
  minTicketsForDraw: number; // Minimum tickets to trigger draw
  numberOfWinners: number; // Number of winners per draw
  prizePoolPercentage: number; // Percentage of pool for winners (90%)
  adminPercentage: number; // Percentage for admin (10%)
  drawDay: number; // Day of week (5 = Friday)
  drawHour: number; // Hour in UTC (20 = 8 PM)
}

export interface LotteryTicket {
  id: string;
  userId: string;
  username: string;
  uniqueIdentifier: string;
  purchaseDate: string;
  drawId: string;
  ticketNumber: number;
}

export interface LotteryDraw {
  id: string;
  drawDate: string;
  totalTickets: number;
  prizePool: number;
  winners: LotteryWinner[];
  status: 'pending' | 'completed' | 'cancelled';
}

export interface LotteryWinner {
  userId: string;
  username: string;
  uniqueIdentifier: string;
  ticketId: string;
  prizeAmount: number;
  position: number;
}

interface LotteryContextType {
  config: LotteryConfig;
  updateConfig: (newConfig: Partial<LotteryConfig>) => Promise<void>;
  purchaseTickets: (userId: string, username: string, uniqueId: string, quantity: number) => Promise<{ success: boolean; message?: string; tickets?: LotteryTicket[] }>;
  getUserTickets: (userId: string) => Promise<LotteryTicket[]>;
  getCurrentDraw: () => Promise<LotteryDraw | null>;
  getDrawHistory: () => Promise<LotteryDraw[]>;
  getCurrentPrizePool: () => Promise<number>;
  getNextDrawDate: () => Date;
  getTotalTicketsSold: () => Promise<number>;
}

const DEFAULT_CONFIG: LotteryConfig = {
  ticketPrice: 1, // 1 MXI per ticket
  minTicketsForDraw: 1000,
  numberOfWinners: 4,
  prizePoolPercentage: 90,
  adminPercentage: 10,
  drawDay: 5, // Friday
  drawHour: 20, // 8 PM UTC
};

const STORAGE_KEYS = {
  CONFIG: '@maxcoin_lottery_config',
  TICKETS: '@maxcoin_lottery_tickets',
  DRAWS: '@maxcoin_lottery_draws',
};

const LotteryContext = createContext<LotteryContextType | undefined>(undefined);

export const LotteryProvider = ({ children }: { children: ReactNode }) => {
  const [config, setConfig] = useState<LotteryConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const savedConfig = await AsyncStorage.getItem(STORAGE_KEYS.CONFIG);
      if (savedConfig) {
        setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(savedConfig) });
      }
    } catch (error) {
      console.error('Error loading lottery config:', error);
    }
  };

  const updateConfig = async (newConfig: Partial<LotteryConfig>) => {
    try {
      const updatedConfig = { ...config, ...newConfig };
      await AsyncStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(updatedConfig));
      setConfig(updatedConfig);
      console.log('Lottery config updated:', updatedConfig);
    } catch (error) {
      console.error('Error updating lottery config:', error);
    }
  };

  const getCurrentDrawId = (): string => {
    const nextDraw = getNextDrawDate();
    return `DRAW-${nextDraw.toISOString().split('T')[0]}`;
  };

  const getNextDrawDate = (): Date => {
    const now = new Date();
    const nextDraw = new Date(now);
    
    // Set to next Friday at 20:00 UTC
    const daysUntilFriday = (config.drawDay - now.getUTCDay() + 7) % 7;
    nextDraw.setUTCDate(now.getUTCDate() + (daysUntilFriday === 0 ? 7 : daysUntilFriday));
    nextDraw.setUTCHours(config.drawHour, 0, 0, 0);

    // If we're past this week's draw time, move to next week
    if (nextDraw <= now) {
      nextDraw.setUTCDate(nextDraw.getUTCDate() + 7);
    }

    return nextDraw;
  };

  const purchaseTickets = async (
    userId: string,
    username: string,
    uniqueId: string,
    quantity: number
  ): Promise<{ success: boolean; message?: string; tickets?: LotteryTicket[] }> => {
    try {
      const ticketsData = await AsyncStorage.getItem(STORAGE_KEYS.TICKETS);
      const allTickets: LotteryTicket[] = ticketsData ? JSON.parse(ticketsData) : [];

      const drawId = getCurrentDrawId();
      const newTickets: LotteryTicket[] = [];

      // Get current ticket count for this draw
      const drawTickets = allTickets.filter(t => t.drawId === drawId);
      let nextTicketNumber = drawTickets.length + 1;

      for (let i = 0; i < quantity; i++) {
        const ticket: LotteryTicket = {
          id: `TKT-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
          userId,
          username,
          uniqueIdentifier: uniqueId,
          purchaseDate: new Date().toISOString(),
          drawId,
          ticketNumber: nextTicketNumber++,
        };
        newTickets.push(ticket);
        allTickets.push(ticket);
      }

      await AsyncStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(allTickets));

      console.log('Lottery tickets purchased:', {
        userId,
        username,
        quantity,
        drawId,
        totalCost: quantity * config.ticketPrice,
      });

      return { success: true, tickets: newTickets };
    } catch (error) {
      console.error('Error purchasing lottery tickets:', error);
      return { success: false, message: 'Failed to purchase tickets' };
    }
  };

  const getUserTickets = async (userId: string): Promise<LotteryTicket[]> => {
    try {
      const ticketsData = await AsyncStorage.getItem(STORAGE_KEYS.TICKETS);
      if (!ticketsData) return [];

      const allTickets: LotteryTicket[] = JSON.parse(ticketsData);
      const drawId = getCurrentDrawId();
      
      return allTickets.filter(t => t.userId === userId && t.drawId === drawId);
    } catch (error) {
      console.error('Error getting user tickets:', error);
      return [];
    }
  };

  const getCurrentDraw = async (): Promise<LotteryDraw | null> => {
    try {
      const drawsData = await AsyncStorage.getItem(STORAGE_KEYS.DRAWS);
      if (!drawsData) return null;

      const draws: LotteryDraw[] = JSON.parse(drawsData);
      const drawId = getCurrentDrawId();
      
      return draws.find(d => d.id === drawId) || null;
    } catch (error) {
      console.error('Error getting current draw:', error);
      return null;
    }
  };

  const getDrawHistory = async (): Promise<LotteryDraw[]> => {
    try {
      const drawsData = await AsyncStorage.getItem(STORAGE_KEYS.DRAWS);
      if (!drawsData) return [];

      const draws: LotteryDraw[] = JSON.parse(drawsData);
      return draws.sort((a, b) => new Date(b.drawDate).getTime() - new Date(a.drawDate).getTime());
    } catch (error) {
      console.error('Error getting draw history:', error);
      return [];
    }
  };

  const getCurrentPrizePool = async (): Promise<number> => {
    try {
      const totalTickets = await getTotalTicketsSold();
      const totalRevenue = totalTickets * config.ticketPrice;
      return totalRevenue * (config.prizePoolPercentage / 100);
    } catch (error) {
      console.error('Error calculating prize pool:', error);
      return 0;
    }
  };

  const getTotalTicketsSold = async (): Promise<number> => {
    try {
      const ticketsData = await AsyncStorage.getItem(STORAGE_KEYS.TICKETS);
      if (!ticketsData) return 0;

      const allTickets: LotteryTicket[] = JSON.parse(ticketsData);
      const drawId = getCurrentDrawId();
      
      return allTickets.filter(t => t.drawId === drawId).length;
    } catch (error) {
      console.error('Error getting total tickets sold:', error);
      return 0;
    }
  };

  return (
    <LotteryContext.Provider
      value={{
        config,
        updateConfig,
        purchaseTickets,
        getUserTickets,
        getCurrentDraw,
        getDrawHistory,
        getCurrentPrizePool,
        getNextDrawDate,
        getTotalTicketsSold,
      }}
    >
      {children}
    </LotteryContext.Provider>
  );
};

export const useLottery = () => {
  const context = useContext(LotteryContext);
  if (context === undefined) {
    throw new Error('useLottery must be used within a LotteryProvider');
  }
  return context;
};
