export interface PriceData {
  id: string;
  name: string;
  symbol: string;
  unit: string;
  cnyUnit: string;
  usdPrice: number;
  cnyPrice: number;
  changePercent: number;
  timestamp: number;
  base930Price: number;
  base930CNY: number;
}

export interface PriceHistory {
  timestamp: number;
  usdPrice: number;
  cnyPrice: number;
}

export interface KlineData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export type KlineType = 'minute' | 'hour' | 'day' | 'week' | 'month';