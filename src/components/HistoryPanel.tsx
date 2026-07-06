import { PriceHistory } from '../types';
import clsx from 'clsx';

interface HistoryPanelProps {
  data: PriceHistory[];
  productName: string;
  base930Price: number;
  onClose: () => void;
}

function formatTime(timestamp: number) {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
}

const USD_TO_CNY = 7.24;

export function HistoryPanel({ data, productName, base930Price, onClose }: HistoryPanelProps) {
  const recentData = data.slice(-50).reverse();

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl border border-slate-600 w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-white">{productName} - 价格列表</h2>
            <p className="text-slate-400 text-sm mt-1">
              基准价: ${base930Price.toFixed(4)} | ¥{(base930Price * USD_TO_CNY).toFixed(4)}
            </p>
            <p className="text-yellow-400 text-xs mt-1">以早上9:30价格为基准</p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1 rounded-lg bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 transition-colors"
          >
            关闭
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[70vh]">
          <div className="space-y-1">
            {recentData.map((record, index) => {
              const isUp = record.usdPrice >= base930Price;
              const change = record.usdPrice - base930Price;
              const changePercent = (change / base930Price) * 100;
              
              return (
                <div
                  key={record.timestamp}
                  className={clsx(
                    'p-3 rounded-lg transition-all',
                    isUp ? 'bg-red-500/10 hover:bg-red-500/20' : 'bg-green-500/10 hover:bg-green-500/20'
                  )}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">{formatTime(record.timestamp)}</span>
                    <div className="flex items-center gap-4">
                      <span className={clsx('font-mono font-semibold text-lg', isUp ? 'text-red-400' : 'text-green-400')}>
                        ${record.usdPrice.toFixed(4)}
                      </span>
                      <span className={clsx('font-mono text-sm', isUp ? 'text-red-300' : 'text-green-300')}>
                        ¥{record.cnyPrice.toFixed(4)}
                      </span>
                      <span className={clsx(
                        'font-mono text-sm px-2 py-0.5 rounded',
                        isUp ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'
                      )}>
                        {isUp ? '+' : ''}{changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}