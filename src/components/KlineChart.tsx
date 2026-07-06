import React from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, AreaChart, Area } from 'recharts';
import { KlineData, KlineType, PriceHistory } from '../types';
import clsx from 'clsx';

interface KlineChartProps {
  data: KlineData[];
  history: PriceHistory[];
  klineType: KlineType;
  base930Price: number;
  base930CNY: number;
  onKlineTypeChange: (type: KlineType) => void;
  onClose: () => void;
}

type CurrencyType = 'cny' | 'usd';

const klineTypeLabels: Record<KlineType, string> = {
  minute: '分时',
  hour: '时K',
  day: '日K',
  week: '周K',
  month: '月K',
};

function formatTime(timestamp: number, type: KlineType) {
  const date = new Date(timestamp);
  switch (type) {
    case 'minute':
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    case 'hour':
      return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}h`;
    case 'day':
      return `${date.getMonth() + 1}/${date.getDate()}`;
    case 'week':
      return `${date.getMonth() + 1}/${date.getDate()}`;
    case 'month':
      return `${date.getFullYear()}/${date.getMonth() + 1}`;
    default:
      return '';
  }
}

function formatDateTime(timestamp: number) {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
}

const USD_TO_CNY = 7.24;

export function KlineChart({ data, history, klineType, base930Price, base930CNY, onKlineTypeChange, onClose }: KlineChartProps) {
  const [currency, setCurrency] = React.useState<CurrencyType>('cny');
  const recentHistory = history.slice(-20).reverse();
  
  const chartData = currency === 'cny' 
    ? history.slice(-60).map(h => ({ timestamp: h.timestamp, close: h.cnyPrice }))
    : data.map(d => ({ timestamp: d.timestamp, close: d.close }));
  
  const base930DisplayPrice = currency === 'cny' ? base930CNY : base930Price;
  const currencySymbol = currency === 'cny' ? '¥' : '$';
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      const isUp = d.close >= base930DisplayPrice;
      
      let usdPrice, cnyPrice;
      if (currency === 'cny') {
        const historyItem = history.find(h => h.timestamp === d.timestamp);
        usdPrice = historyItem ? historyItem.usdPrice : d.close;
        cnyPrice = d.close;
      } else {
        usdPrice = d.close;
        cnyPrice = d.close * USD_TO_CNY;
      }
      
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
          <p className="text-slate-300 text-xs mb-1">{formatDateTime(d.timestamp)}</p>
          <p className={clsx('text-sm font-mono font-semibold', isUp ? 'text-red-400' : 'text-green-400')}>
            ${usdPrice.toFixed(4)}
          </p>
          <p className={clsx('text-xs font-mono', isUp ? 'text-red-300' : 'text-green-300')}>
            ¥{cnyPrice.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  const firstPrice = chartData.length > 0 ? chartData[0].close : 0;
  const lastPrice = chartData.length > 0 ? chartData[chartData.length - 1].close : 0;
  const isOverallUp = lastPrice >= firstPrice;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl border border-slate-600 w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">K线图</h2>
          <div className="flex gap-2">
            {(Object.keys(klineTypeLabels) as KlineType[]).map(type => (
              <button
                key={type}
                onClick={() => onKlineTypeChange(type)}
                className={clsx(
                  'px-3 py-1 rounded-lg text-sm transition-all',
                  klineType === type
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 border border-transparent'
                )}
              >
                {klineTypeLabels[type]}
              </button>
            ))}
          </div>
          <div className="flex gap-2 ml-4">
            <button
              onClick={() => setCurrency('cny')}
              className={clsx(
                'px-3 py-1 rounded-lg text-sm transition-all',
                currency === 'cny'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 border border-transparent'
              )}
            >
              ¥ 人民币
            </button>
            <button
              onClick={() => setCurrency('usd')}
              className={clsx(
                'px-3 py-1 rounded-lg text-sm transition-all',
                currency === 'usd'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 border border-transparent'
              )}
            >
              $ 美元
            </button>
          </div>
          <button
            onClick={onClose}
            className="ml-4 px-4 py-1 rounded-lg bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 transition-colors"
          >
            关闭
          </button>
        </div>
        
        <div className="flex">
          <div className="flex-1 p-4">
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={isOverallUp ? '#ff4757' : '#00d4aa'} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={isOverallUp ? '#ff4757' : '#00d4aa'} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={(t) => formatTime(t, klineType)} 
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    domain={['auto', 'auto']}
                    tickFormatter={(v) => `${currencySymbol}${v.toFixed(2)}`}
                    orientation="right"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine 
                    y={base930DisplayPrice} 
                    stroke="#fbbf24" 
                    strokeDasharray="5 5" 
                    strokeWidth={2}
                    label={{ value: '9:30基准', fill: '#fbbf24', fontSize: 12, position: 'right' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="close" 
                    stroke={isOverallUp ? '#ff4757' : '#00d4aa'} 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 2 }}
                    fill="url(#colorPrice)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="w-64 border-l border-slate-700 p-4 overflow-y-auto max-h-96">
            <h3 className="text-white font-semibold mb-3">最近20条记录</h3>
            <div className="space-y-1">
              {recentHistory.map((record, index) => {
                const isUp = record.usdPrice >= base930Price;
                return (
                  <div
                    key={record.timestamp}
                    className={clsx(
                      'p-2 rounded text-xs',
                      isUp ? 'bg-red-500/10' : 'bg-green-500/10'
                    )}
                  >
                    <div className="text-slate-400 text-xs">{formatDateTime(record.timestamp)}</div>
                    <div className="flex justify-between items-center mt-1">
                      <span className={clsx('font-mono font-semibold', isUp ? 'text-red-400' : 'text-green-400')}>
                        ${record.usdPrice.toFixed(4)}
                      </span>
                      <span className={clsx('font-mono text-xs', isUp ? 'text-red-300' : 'text-green-300')}>
                        ¥{record.cnyPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}