
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { colors } from '@/styles/commonStyles';
import { useBinance } from '@/contexts/BinanceContext';

interface PriceData {
  time: string;
  price: number;
}

export default function PriceChart() {
  const { mxiRate, isConnected } = useBinance();
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected) {
      fetchInitialData();
      const interval = setInterval(fetchPriceUpdate, 5000); // Update every 5 seconds

      return () => clearInterval(interval);
    }
  }, [isConnected]);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch historical data from Binance API (using BTCUSDT as example)
      const response = await fetch(
        'https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=20'
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch price data');
      }

      const data = await response.json();
      
      const formattedData: PriceData[] = data.map((item: any) => ({
        time: new Date(item[0]).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        price: parseFloat(item[4]), // Close price
      }));

      setPriceData(formattedData);
      
      if (formattedData.length > 0) {
        const latestPrice = formattedData[formattedData.length - 1].price;
        const firstPrice = formattedData[0].price;
        setCurrentPrice(latestPrice);
        setPriceChange(((latestPrice - firstPrice) / firstPrice) * 100);
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching initial price data:', err);
      setError('Unable to load price data');
      setIsLoading(false);
    }
  };

  const fetchPriceUpdate = async () => {
    try {
      // Fetch latest price from Binance API
      const response = await fetch(
        'https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT'
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch price update');
      }

      const data = await response.json();
      const newPrice = parseFloat(data.price);
      
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });

      setPriceData(prevData => {
        const newData = [...prevData, { time: timeString, price: newPrice }];
        // Keep only last 20 data points
        if (newData.length > 20) {
          newData.shift();
        }
        
        // Calculate price change
        if (newData.length > 0) {
          const firstPrice = newData[0].price;
          setPriceChange(((newPrice - firstPrice) / firstPrice) * 100);
        }
        
        return newData;
      });
      
      setCurrentPrice(newPrice);
    } catch (err) {
      console.error('Error fetching price update:', err);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading price data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.errorSubtext}>
          Please check your internet connection
        </Text>
      </View>
    );
  }

  const screenWidth = Dimensions.get('window').width - 32;

  return (
    <View style={styles.container}>
      <View style={styles.priceHeader}>
        <View>
          <Text style={styles.priceLabel}>MXI/USDT</Text>
          <Text style={styles.currentPrice}>
            ${mxiRate ? mxiRate.price.toFixed(2) : currentPrice.toLocaleString('en-US', { 
              minimumFractionDigits: 2,
              maximumFractionDigits: 2 
            })}
          </Text>
        </View>
        <View style={[
          styles.changeContainer,
          { backgroundColor: (mxiRate ? mxiRate.priceChangePercent24h : priceChange) >= 0 ? colors.success + '20' : colors.danger + '20' }
        ]}>
          <Text style={[
            styles.changeText,
            { color: (mxiRate ? mxiRate.priceChangePercent24h : priceChange) >= 0 ? colors.success : colors.danger }
          ]}>
            {(mxiRate ? mxiRate.priceChangePercent24h : priceChange) >= 0 ? '+' : ''}
            {(mxiRate ? mxiRate.priceChangePercent24h : priceChange).toFixed(2)}%
          </Text>
        </View>
      </View>

      {priceData.length > 0 && (
        <LineChart
          data={{
            labels: priceData.map((_, index) => 
              index % 4 === 0 ? priceData[index].time : ''
            ),
            datasets: [{
              data: priceData.map(d => d.price),
            }],
          }}
          width={screenWidth}
          height={220}
          chartConfig={{
            backgroundColor: colors.card,
            backgroundGradientFrom: colors.card,
            backgroundGradientTo: colors.card,
            decimalPlaces: 0,
            color: (opacity = 1) => priceChange >= 0 
              ? `rgba(76, 175, 80, ${opacity})`
              : `rgba(244, 67, 54, ${opacity})`,
            labelColor: (opacity = 1) => colors.textSecondary,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '3',
              strokeWidth: '2',
              stroke: priceChange >= 0 ? colors.success : colors.danger,
            },
            propsForBackgroundLines: {
              strokeDasharray: '',
              stroke: colors.border || '#e0e0e0',
              strokeWidth: 1,
            },
          }}
          bezier
          style={styles.chart}
          withInnerLines={true}
          withOuterLines={true}
          withVerticalLines={false}
          withHorizontalLines={true}
          withVerticalLabels={true}
          withHorizontalLabels={true}
          fromZero={false}
        />
      )}

      <Text style={styles.updateText}>
        {mxiRate && `Last update: ${mxiRate.lastUpdate.toLocaleTimeString()} • `}
        Powered by Binance
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.danger,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  priceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  priceLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  currentPrice: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  changeContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  changeText: {
    fontSize: 16,
    fontWeight: '700',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  updateText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
});
