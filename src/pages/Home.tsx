import { usePriceData } from '../hooks/usePriceData';
import { PriceRow } from '../components/PriceRow';
import { KlineChart } from '../components/KlineChart';
import { HistoryPanel } from '../components/HistoryPanel';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { NotificationSettings } from '../components/NotificationSettings';
import { KlineType, PriceHistory } from '../types';
import usePriceStore from '../store/priceStore';
import { useState, useCallback, useEffect } from 'react';
import { isPlatform } from '@ionic/react';
import { requestNotificationPermission, sendGoldPriceNotification, startLivePriceNotification, stopLivePriceNotification, isLivePriceNotificationEnabled } from '../services/notificationService';
import { LiveActivityPlugin } from '../plugins/LiveActivityPlugin';

export function Home() {
  const { prices, selectedProduct, showHistory, showKline, klineType, klineData, loading, setSelectedProduct, setShowHistory, setShowKline, setKlineType, loadPrices } = usePriceData();
  const base930Price = usePriceStore(state => state.base930Price);

  const [productHistories, setProductHistories] = useState<Record<string, PriceHistory[]>>({});
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [lastGoldPrice, setLastGoldPrice] = useState<number | null>(null);
  const [liveActivityActive, setLiveActivityActive] = useState(false);
  const [notificationActive, setNotificationActive] = useState(false);
  const [supportsDynamicIsland, setSupportsDynamicIsland] = useState(false);

  useEffect(() => {
    if (isPlatform('ios') || isPlatform('android')) {
      requestNotificationPermission();
    }
    
    if (isPlatform('ios')) {
      checkDynamicIslandSupport();
      checkLiveActivityStatus();
    }
  }, []);
  
  const checkDynamicIslandSupport = async () => {
    try {
      const result = await LiveActivityPlugin.supportsDynamicIsland();
      setSupportsDynamicIsland(result.supported);
    } catch (e) {
      setSupportsDynamicIsland(false);
    }
  };
  
  const checkLiveActivityStatus = async () => {
    try {
      const result = await LiveActivityPlugin.isActivityActive({ productId: 'gold' });
      setLiveActivityActive(result.active);
    } catch (e) {
      console.log('Live Activity not available');
    }
  };
  
  const toggleLivePriceDisplay = async () => {
    const goldPrice = prices.find(p => p.id === 'gold');
    if (!goldPrice) return;
    
    if (isPlatform('ios') && supportsDynamicIsland) {
      if (liveActivityActive) {
        await LiveActivityPlugin.endActivity({ productId: 'gold' });
        setLiveActivityActive(false);
      } else {
        await LiveActivityPlugin.startActivity({
          productId: goldPrice.id,
          productName: goldPrice.name,
          usdPrice: goldPrice.usdPrice,
          cnyPrice: goldPrice.cnyPrice,
          changePercent: goldPrice.changePercent,
          isUp: goldPrice.changePercent >= 0,
        });
        setLiveActivityActive(true);
      }
    } else {
      if (notificationActive) {
        await stopLivePriceNotification();
        setNotificationActive(false);
      } else {
        await startLivePriceNotification();
        setNotificationActive(true);
      }
    }
  };

  // 检测价格变动并发送通知
  useEffect(() => {
    const goldPrice = prices.find(p => p.id === 'gold');
    if (!goldPrice || !lastGoldPrice) {
      setLastGoldPrice(goldPrice?.usdPrice || null);
      return;
    }

    // 价格变动超过0.5%时发送通知
    const changePercent = Math.abs((goldPrice.usdPrice - lastGoldPrice) / lastGoldPrice * 100);
    if (changePercent >= 0.5) {
      const isRise = goldPrice.usdPrice > lastGoldPrice;
      sendGoldPriceNotification(
        goldPrice.name,
        goldPrice.usdPrice,
        goldPrice.changePercent,
        isRise
      );
      setLastGoldPrice(goldPrice.usdPrice);
    }
  }, [prices, lastGoldPrice]);

  const updateHistories = useCallback(() => {
    setProductHistories(prev => {
      const newHistories = { ...prev };
      let hasChange = false;
      
      prices.forEach(price => {
        const prevHistory = prev[price.id] || [];
        const lastRecord = prevHistory.length > 0 ? prevHistory[prevHistory.length - 1] : null;
        
        if (!lastRecord || Math.abs(price.usdPrice - lastRecord.usdPrice) > 0.0001) {
          const newRecord: PriceHistory = {
            timestamp: price.timestamp,
            usdPrice: price.usdPrice,
            cnyPrice: price.cnyPrice,
          };
          const newHistory = [...prevHistory, newRecord];
          if (newHistory.length > 200) {
            newHistory.shift();
          }
          newHistories[price.id] = newHistory;
          hasChange = true;
        }
      });
      
      return hasChange ? newHistories : prev;
    });
  }, [prices]);

  useEffect(() => {
    updateHistories();
  }, [updateHistories]);

  const selectedProductData = prices.find(p => p.id === selectedProduct);
  const selectedHistory = selectedProduct ? productHistories[selectedProduct] || [] : [];

  const handlePriceClick = useCallback((id: string) => {
    setSelectedProduct(id);
    setShowHistory(true);
    setShowKline(false);
  }, [setSelectedProduct, setShowHistory, setShowKline]);

  const handleChartClick = useCallback((id: string) => {
    setSelectedProduct(id);
    setShowKline(true);
    setShowHistory(false);
  }, [setSelectedProduct, setShowKline, setShowHistory]);

  const handleKlineTypeChange = useCallback((type: KlineType) => {
    setKlineType(type);
  }, [setKlineType]);

  const handleClose = useCallback(() => {
    setShowHistory(false);
    setShowKline(false);
  }, [setShowHistory, setShowKline]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-3 sm:p-4 md:p-6 lg:p-8">
      {/* 移动端顶部导航 */}
      <header className="mb-4 sm:mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2">
              💰 商品价格监控
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm hidden sm:block">
              实时追踪黄金、原油、电力、煤炭、白银、黄铜价格
            </p>
          </div>
          
          {/* 移动端设置按钮 */}
          <button
            onClick={() => setShowNotificationSettings(true)}
            className="sm:hidden p-2 rounded-lg bg-slate-700/50 text-slate-400"
          >
            ⚙️
          </button>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 sm:mt-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-400">每20秒自动刷新</span>
          </div>
          <button
            onClick={loadPrices}
            className="flex items-center gap-1 px-2 py-1 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-600/50 transition-colors text-xs"
          >
            🔄 手动刷新
          </button>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-red-400">▲ 上涨 - 红色</span>
            <span className="text-green-400">▼ 下跌 - 绿色</span>
          </div>
        </div>

        {/* 桌面端设置入口 */}
        <div className="hidden sm:flex items-center gap-4 mt-3">
          <button
            onClick={loadPrices}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-600/50 transition-colors text-sm"
          >
            🔄 手动刷新
          </button>
          <button
            onClick={() => setShowNotificationSettings(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors text-sm"
          >
            🔔 通知设置
          </button>
          {(isPlatform('ios') || isPlatform('android')) && (
            <button
              onClick={toggleLivePriceDisplay}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm ${
                liveActivityActive || notificationActive
                  ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
              }`}
            >
              📱 {liveActivityActive || notificationActive ? '关闭实时显示' : '开启实时显示'}
            </button>
          )}
        </div>
      </header>

      {/* 桌面端表头 */}
      <div className="mb-2 hidden md:grid grid-cols-4 gap-4 text-slate-400 text-sm font-medium px-3 py-2 bg-slate-800/30 rounded-lg">
        <div>商品</div>
        <div>国际价格 (USD)</div>
        <div>国内价格 (CNY)</div>
        <div>走势图</div>
      </div>

      {/* 价格列表 */}
      <div className="space-y-2">
        {prices.map(price => (
          <PriceRow
            key={price.id}
            price={price}
            history={productHistories[price.id] || []}
            onPriceClick={() => handlePriceClick(price.id)}
            onChartClick={() => handleChartClick(price.id)}
          />
        ))}
      </div>

      <div className="mt-6 text-center text-slate-500 text-xs sm:text-sm">
        <p className="hidden sm:block">点击价格查看详细列表 | 点击图表查看K线图</p>
        <p className="sm:hidden">👆 点击查看详情</p>
      </div>

      {/* K线图弹窗 */}
      {showKline && selectedProductData && (
        <KlineChart
          data={klineData}
          history={selectedHistory}
          klineType={klineType}
          base930Price={selectedProductData.base930Price}
          base930CNY={selectedProductData.base930CNY}
          onKlineTypeChange={handleKlineTypeChange}
          onClose={handleClose}
        />
      )}

      {/* 历史记录弹窗 */}
      {showHistory && selectedProductData && (
        <HistoryPanel
          data={selectedHistory}
          productName={selectedProductData.name}
          base930Price={selectedProductData.base930Price}
          onClose={handleClose}
        />
      )}

      {/* 通知设置弹窗 */}
      {showNotificationSettings && (
        <NotificationSettings
          onClose={() => setShowNotificationSettings(false)}
        />
      )}
    </div>
  );
}
