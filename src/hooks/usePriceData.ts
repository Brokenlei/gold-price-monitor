import { useEffect, useCallback } from 'react';
import usePriceStore from '../store/priceStore';
import { fetchPrices, fetchPriceHistory, fetchKlineData, fetchBasePrice } from '../utils/api';
import { LiveActivityPlugin } from '../plugins/LiveActivityPlugin';
import { updateLivePriceNotification, isLivePriceNotificationEnabled } from '../services/notificationService';

export function usePriceData() {
  const { prices, selectedProduct, showHistory, showKline, klineType, history, klineData, loading, setPrices, setSelectedProduct, setShowHistory, setShowKline, setKlineType, setHistory, setKlineData, setLoading, setBase930Price } = usePriceStore();

  const loadPrices = useCallback(async () => {
    try {
      const data = await fetchPrices();
      setPrices(data);
      setLoading(false);
      
      const goldPrice = data.find(p => p.id === 'gold');
      if (goldPrice) {
        try {
          const isActivityActive = await LiveActivityPlugin.isActivityActive({ productId: 'gold' });
          if (isActivityActive.active) {
            await LiveActivityPlugin.updateActivity({
              productId: goldPrice.id,
              productName: goldPrice.name,
              usdPrice: goldPrice.usdPrice,
              cnyPrice: goldPrice.cnyPrice,
              changePercent: goldPrice.changePercent,
              isUp: goldPrice.changePercent >= 0,
            });
          }
        } catch (e) {
          console.log('Live Activity not available:', e);
        }
        
        if (isLivePriceNotificationEnabled()) {
          await updateLivePriceNotification(
            goldPrice.name,
            goldPrice.usdPrice,
            goldPrice.cnyPrice,
            goldPrice.changePercent,
            goldPrice.changePercent >= 0
          );
        }
      }
    } catch (error) {
      console.error('Failed to fetch prices:', error);
    }
  }, [setPrices, setLoading]);

  const loadHistory = useCallback(async (id: string) => {
    try {
      const data = await fetchPriceHistory(id);
      setHistory(data);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  }, [setHistory]);

  const loadKlineData = useCallback(async (id: string, type: string) => {
    try {
      const data = await fetchKlineData(id, type as any);
      setKlineData(data);
    } catch (error) {
      console.error('Failed to fetch kline data:', error);
    }
  }, [setKlineData]);

  const loadBasePrice = useCallback(async (id: string) => {
    try {
      const data = await fetchBasePrice(id);
      setBase930Price(data.price);
    } catch (error) {
      console.error('Failed to fetch base price:', error);
    }
  }, [setBase930Price]);

  useEffect(() => {
    loadPrices();
    const interval = setInterval(loadPrices, 20000);
    return () => clearInterval(interval);
  }, [loadPrices]);

  useEffect(() => {
    if (selectedProduct && showHistory) {
      loadHistory(selectedProduct);
    }
  }, [selectedProduct, showHistory, loadHistory]);

  useEffect(() => {
    if (selectedProduct && showKline) {
      loadKlineData(selectedProduct, klineType);
    }
  }, [selectedProduct, showKline, klineType, loadKlineData]);

  return {
    prices,
    selectedProduct,
    showHistory,
    showKline,
    klineType,
    history,
    klineData,
    loading,
    setSelectedProduct,
    setShowHistory,
    setShowKline,
    setKlineType,
    loadPrices,
  };
}