import { create } from 'zustand';
import { PriceData, PriceHistory, KlineData, KlineType } from '../types';

interface PriceState {
  prices: PriceData[];
  selectedProduct: string | null;
  showKline: boolean;
  showHistory: boolean;
  klineType: KlineType;
  history: PriceHistory[];
  klineData: KlineData[];
  loading: boolean;
  base930Price: number;

  setPrices: (prices: PriceData[]) => void;
  setSelectedProduct: (id: string | null) => void;
  setShowKline: (show: boolean) => void;
  setShowHistory: (show: boolean) => void;
  setKlineType: (type: KlineType) => void;
  setHistory: (history: PriceHistory[]) => void;
  setKlineData: (data: KlineData[]) => void;
  setLoading: (loading: boolean) => void;
  setBase930Price: (price: number) => void;
}

const usePriceStore = create<PriceState>((set) => ({
  prices: [],
  selectedProduct: null,
  showKline: false,
  showHistory: false,
  klineType: 'minute',
  history: [],
  klineData: [],
  loading: true,
  base930Price: 0,

  setPrices: (prices: PriceData[]) => set({ prices }),
  setSelectedProduct: (id: string | null) => set({ selectedProduct: id }),
  setShowKline: (show: boolean) => set({ showKline: show }),
  setShowHistory: (show: boolean) => set({ showHistory: show }),
  setKlineType: (type: KlineType) => set({ klineType: type }),
  setHistory: (history: PriceHistory[]) => set({ history }),
  setKlineData: (data: KlineData[]) => set({ klineData: data }),
  setLoading: (loading: boolean) => set({ loading }),
  setBase930Price: (price: number) => set({ base930Price: price }),
}));

export default usePriceStore;