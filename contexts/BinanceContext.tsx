
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export interface ExchangeRate {
  symbol: string;
  price: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  lastUpdate: Date;
}

interface BinanceContextType {
  mxiRate: ExchangeRate | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  connectToBinance: () => Promise<void>;
  disconnectFromBinance: () => void;
  refreshRate: () => Promise<void>;
  convertMXIToUSD: (mxiAmount: number) => number;
  convertUSDToMXI: (usdAmount: number) => number;
}

const BinanceContext = createContext<BinanceContextType | undefined>(undefined);

const REFERENCE_SYMBOL = 'BTCUSDT';
const MXI_MULTIPLIER = 0.0001;
const UPDATE_INTERVAL = 10000;

export const BinanceProvider = ({ children }: { children: ReactNode }) => {
  const [mxiRate, setMxiRate] = useState<ExchangeRate | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExchangeRate = useCallback(async (): Promise<ExchangeRate | null> => {
    try {
      const priceResponse = await fetch(
        `https://api.binance.com/api/v3/ticker/price?symbol=${REFERENCE_SYMBOL}`
      );
      
      if (!priceResponse.ok) {
        throw new Error('Failed to fetch price data');
      }

      const priceData = await priceResponse.json();
      const btcPrice = parseFloat(priceData.price);

      const statsResponse = await fetch(
        `https://api.binance.com/api/v3/ticker/24hr?symbol=${REFERENCE_SYMBOL}`
      );

      if (!statsResponse.ok) {
        throw new Error('Failed to fetch statistics');
      }

      const statsData = await statsResponse.json();
      
      const mxiPrice = btcPrice * MXI_MULTIPLIER;
      const priceChange = parseFloat(statsData.priceChange) * MXI_MULTIPLIER;
      const priceChangePercent = parseFloat(statsData.priceChangePercent);

      const exchangeRate: ExchangeRate = {
        symbol: 'MXIUSDT',
        price: mxiPrice,
        priceChange24h: priceChange,
        priceChangePercent24h: priceChangePercent,
        lastUpdate: new Date(),
      };

      console.log('Exchange rate updated:', exchangeRate);
      return exchangeRate;
    } catch (err) {
      console.error('Error fetching exchange rate:', err);
      throw err;
    }
  }, []);

  const connectToBinance = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const rate = await fetchExchangeRate();
      setMxiRate(rate);
      setIsConnected(true);
    } catch (err) {
      setError('Failed to connect to Binance. Please check your internet connection.');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [fetchExchangeRate]);

  useEffect(() => {
    connectToBinance();

    const interval = setInterval(async () => {
      try {
        const updatedRate = await fetchExchangeRate();
        setMxiRate(updatedRate);
      } catch (err) {
        console.error('Error updating exchange rate:', err);
      }
    }, UPDATE_INTERVAL);

    return () => {
      clearInterval(interval);
    };
  }, [connectToBinance, fetchExchangeRate]);

  const disconnectFromBinance = useCallback(() => {
    setIsConnected(false);
    setMxiRate(null);
    console.log('Disconnected from Binance');
  }, []);

  const refreshRate = useCallback(async () => {
    if (!isConnected) {
      await connectToBinance();
      return;
    }

    try {
      const rate = await fetchExchangeRate();
      setMxiRate(rate);
      setError(null);
    } catch (err) {
      setError('Failed to refresh exchange rate');
    }
  }, [isConnected, connectToBinance, fetchExchangeRate]);

  const convertMXIToUSD = useCallback((mxiAmount: number): number => {
    if (!mxiRate) return 0;
    return mxiAmount * mxiRate.price;
  }, [mxiRate]);

  const convertUSDToMXI = useCallback((usdAmount: number): number => {
    if (!mxiRate || mxiRate.price === 0) return 0;
    return usdAmount / mxiRate.price;
  }, [mxiRate]);

  return (
    <BinanceContext.Provider
      value={{
        mxiRate,
        isConnected,
        isLoading,
        error,
        connectToBinance,
        disconnectFromBinance,
        refreshRate,
        convertMXIToUSD,
        convertUSDToMXI,
      }}
    >
      {children}
    </BinanceContext.Provider>
  );
};

export const useBinance = () => {
  const context = useContext(BinanceContext);
  if (context === undefined) {
    throw new Error('useBinance must be used within a BinanceProvider');
  }
  return context;
};
