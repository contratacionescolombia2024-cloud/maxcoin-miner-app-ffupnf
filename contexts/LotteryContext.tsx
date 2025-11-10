
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/app/integrations/supabase/client';

export interface LotteryConfig {
  ticketPrice: number;
  minTicketsForDraw: number;
  numberOfWinners: number;
  prizePoolPercentage: number;
  adminPercentage: number;
  drawDay: number;
  drawHour: number;
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
  ticketPrice: 1,
  minTicketsForDraw: 1000,
  numberOfWinners: 4,
  prizePoolPercentage: 90,
  adminPercentage: 10,
  drawDay: 5,
  drawHour: 20,
};

const LotteryContext = createContext<LotteryContextType | undefined>(undefined);

export const LotteryProvider = ({ children }: { children: ReactNode }) => {
  const [config, setConfig] = useState<LotteryConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('lottery_config')
        .select('*')
        .single();

      if (error) {
        console.error('Error loading lottery config:', error);
        return;
      }

      if (data) {
        setConfig({
          ticketPrice: parseFloat(data.ticket_price),
          minTicketsForDraw: data.min_tickets_for_draw,
          numberOfWinners: data.number_of_winners,
          prizePoolPercentage: parseFloat(data.prize_pool_percentage),
          adminPercentage: parseFloat(data.admin_percentage),
          drawDay: data.draw_day,
          drawHour: data.draw_hour,
        });
        console.log('Lottery config loaded from database');
      }
    } catch (error) {
      console.error('Error loading lottery config:', error);
    }
  };

  const updateConfig = async (newConfig: Partial<LotteryConfig>) => {
    try {
      const updatedConfig = { ...config, ...newConfig };
      
      const { error } = await supabase
        .from('lottery_config')
        .update({
          ticket_price: updatedConfig.ticketPrice,
          min_tickets_for_draw: updatedConfig.minTicketsForDraw,
          number_of_winners: updatedConfig.numberOfWinners,
          prize_pool_percentage: updatedConfig.prizePoolPercentage,
          admin_percentage: updatedConfig.adminPercentage,
          draw_day: updatedConfig.drawDay,
          draw_hour: updatedConfig.drawHour,
        })
        .eq('id', (await supabase.from('lottery_config').select('id').single()).data?.id);

      if (error) {
        console.error('Error updating lottery config:', error);
        return;
      }

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
    
    const daysUntilFriday = (config.drawDay - now.getUTCDay() + 7) % 7;
    nextDraw.setUTCDate(now.getUTCDate() + (daysUntilFriday === 0 ? 7 : daysUntilFriday));
    nextDraw.setUTCHours(config.drawHour, 0, 0, 0);

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
      const drawId = getCurrentDrawId();

      // Get current ticket count for this draw
      const { count } = await supabase
        .from('lottery_tickets')
        .select('*', { count: 'exact', head: true })
        .eq('draw_id', drawId);

      let nextTicketNumber = (count || 0) + 1;
      const newTickets: LotteryTicket[] = [];

      // Insert tickets
      for (let i = 0; i < quantity; i++) {
        const ticketId = `TKT-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
        
        const { data, error } = await supabase
          .from('lottery_tickets')
          .insert({
            ticket_id: ticketId,
            user_id: userId,
            username,
            unique_identifier: uniqueId,
            draw_id: drawId,
            ticket_number: nextTicketNumber++,
          })
          .select()
          .single();

        if (error) {
          console.error('Error inserting ticket:', error);
          continue;
        }

        if (data) {
          newTickets.push({
            id: data.ticket_id,
            userId: data.user_id,
            username: data.username,
            uniqueIdentifier: data.unique_identifier,
            purchaseDate: data.purchase_date,
            drawId: data.draw_id,
            ticketNumber: data.ticket_number,
          });
        }
      }

      // Update or create draw record
      const totalCost = quantity * config.ticketPrice;
      const prizePoolAmount = totalCost * (config.prizePoolPercentage / 100);

      const { data: existingDraw } = await supabase
        .from('lottery_draws')
        .select('*')
        .eq('draw_id', drawId)
        .single();

      if (existingDraw) {
        await supabase
          .from('lottery_draws')
          .update({
            total_tickets: existingDraw.total_tickets + quantity,
            prize_pool: parseFloat(existingDraw.prize_pool) + prizePoolAmount,
          })
          .eq('draw_id', drawId);
      } else {
        await supabase
          .from('lottery_draws')
          .insert({
            draw_id: drawId,
            draw_date: getNextDrawDate().toISOString(),
            total_tickets: quantity,
            prize_pool: prizePoolAmount,
            status: 'pending',
          });
      }

      console.log('Lottery tickets purchased:', {
        userId,
        username,
        quantity,
        drawId,
        totalCost,
      });

      return { success: true, tickets: newTickets };
    } catch (error) {
      console.error('Error purchasing lottery tickets:', error);
      return { success: false, message: 'Failed to purchase tickets' };
    }
  };

  const getUserTickets = async (userId: string): Promise<LotteryTicket[]> => {
    try {
      const drawId = getCurrentDrawId();
      
      const { data, error } = await supabase
        .from('lottery_tickets')
        .select('*')
        .eq('user_id', userId)
        .eq('draw_id', drawId)
        .order('ticket_number', { ascending: true });

      if (error) {
        console.error('Error getting user tickets:', error);
        return [];
      }

      return (data || []).map(ticket => ({
        id: ticket.ticket_id,
        userId: ticket.user_id,
        username: ticket.username,
        uniqueIdentifier: ticket.unique_identifier,
        purchaseDate: ticket.purchase_date,
        drawId: ticket.draw_id,
        ticketNumber: ticket.ticket_number,
      }));
    } catch (error) {
      console.error('Error getting user tickets:', error);
      return [];
    }
  };

  const getCurrentDraw = async (): Promise<LotteryDraw | null> => {
    try {
      const drawId = getCurrentDrawId();
      
      const { data, error } = await supabase
        .from('lottery_draws')
        .select('*')
        .eq('draw_id', drawId)
        .single();

      if (error || !data) {
        return null;
      }

      // Get winners for this draw
      const { data: winnersData } = await supabase
        .from('lottery_winners')
        .select('*')
        .eq('draw_id', drawId)
        .order('position', { ascending: true });

      const winners: LotteryWinner[] = (winnersData || []).map(winner => ({
        userId: winner.user_id,
        username: winner.username,
        uniqueIdentifier: winner.unique_identifier,
        ticketId: winner.ticket_id,
        prizeAmount: parseFloat(winner.prize_amount),
        position: winner.position,
      }));

      return {
        id: data.draw_id,
        drawDate: data.draw_date,
        totalTickets: data.total_tickets,
        prizePool: parseFloat(data.prize_pool),
        winners,
        status: data.status,
      };
    } catch (error) {
      console.error('Error getting current draw:', error);
      return null;
    }
  };

  const getDrawHistory = async (): Promise<LotteryDraw[]> => {
    try {
      const { data, error } = await supabase
        .from('lottery_draws')
        .select('*')
        .order('draw_date', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error getting draw history:', error);
        return [];
      }

      const draws: LotteryDraw[] = [];

      for (const draw of data || []) {
        const { data: winnersData } = await supabase
          .from('lottery_winners')
          .select('*')
          .eq('draw_id', draw.draw_id)
          .order('position', { ascending: true });

        const winners: LotteryWinner[] = (winnersData || []).map(winner => ({
          userId: winner.user_id,
          username: winner.username,
          uniqueIdentifier: winner.unique_identifier,
          ticketId: winner.ticket_id,
          prizeAmount: parseFloat(winner.prize_amount),
          position: winner.position,
        }));

        draws.push({
          id: draw.draw_id,
          drawDate: draw.draw_date,
          totalTickets: draw.total_tickets,
          prizePool: parseFloat(draw.prize_pool),
          winners,
          status: draw.status,
        });
      }

      return draws;
    } catch (error) {
      console.error('Error getting draw history:', error);
      return [];
    }
  };

  const getCurrentPrizePool = async (): Promise<number> => {
    try {
      const drawId = getCurrentDrawId();
      
      const { data, error } = await supabase
        .from('lottery_draws')
        .select('prize_pool')
        .eq('draw_id', drawId)
        .single();

      if (error || !data) {
        return 0;
      }

      return parseFloat(data.prize_pool);
    } catch (error) {
      console.error('Error calculating prize pool:', error);
      return 0;
    }
  };

  const getTotalTicketsSold = async (): Promise<number> => {
    try {
      const drawId = getCurrentDrawId();
      
      const { count, error } = await supabase
        .from('lottery_tickets')
        .select('*', { count: 'exact', head: true })
        .eq('draw_id', drawId);

      if (error) {
        console.error('Error getting total tickets sold:', error);
        return 0;
      }

      return count || 0;
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
