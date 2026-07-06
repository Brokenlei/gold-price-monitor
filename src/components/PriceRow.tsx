import { PriceData, PriceHistory } from '../types';
import { MiniChart } from './MiniChart';
import { Flame, Droplets, Zap, Mountain, CircleDot, Box } from 'lucide-react';
import clsx from 'clsx';

interface PriceRowProps {
  price: PriceData;
  history: PriceHistory[];
  onPriceClick: () => void;
  onChartClick: () => void;
}

const iconMap: Record<string, any> = {
  gold: CircleDot,
  crude: Droplets,
  electricity: Zap,
  coal: Mountain,
  silver: Box,
  copper: Flame,
};

const iconColorMap: Record<string, string> = {
  gold: 'text-yellow-500',
  crude: 'text-orange-400',
  electricity: 'text-yellow-300',
  coal: 'text-stone-500',
  silver: 'text-gray-300',
  copper: 'text-amber-600',
};

const USD_TO_CNY = 7.24;

export function PriceRow({ price, history, onPriceClick, onChartClick }: PriceRowProps) {
  const Icon = iconMap[price.id] || CircleDot;
  const iconColor = iconColorMap[price.id] || 'text-white';
  const isUp = price.changePercent >= 0;

  return (
    <div className="grid grid-cols-4 gap-4 items-center p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800/70 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-slate-700/50 ${iconColor}`}>
          <Icon size={18} />
        </div>
        <div>
          <h3 className="text-white font-medium">{price.name}</h3>
          <p className="text-slate-400 text-xs">{price.symbol}</p>
        </div>
      </div>
      
      <div 
        onClick={onPriceClick}
        className="cursor-pointer p-2 -m-2 rounded-lg hover:bg-slate-700/30 transition-colors"
      >
        <div className={clsx('text-lg font-mono font-bold', isUp ? 'text-red-400' : 'text-green-400')}>
          ${price.usdPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
        </div>
        <div className={clsx('text-sm font-mono', isUp ? 'text-red-300' : 'text-green-300')}>
          {isUp ? '+' : ''}{price.changePercent}%
        </div>
      </div>
      
      <div 
        onClick={onPriceClick}
        className="cursor-pointer p-2 -m-2 rounded-lg hover:bg-slate-700/30 transition-colors"
      >
        <div className={clsx('text-lg font-mono font-bold', isUp ? 'text-red-400' : 'text-green-400')}>
          ¥{price.cnyPrice.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="text-xs text-slate-400">{price.cnyUnit}</div>
      </div>
      
      <div 
        onClick={onChartClick}
        className="cursor-pointer p-2 -m-2 rounded-lg hover:bg-slate-700/30 transition-colors"
      >
        <MiniChart data={history} isUp={isUp} />
      </div>
    </div>
  );
}