import { PriceData, PriceHistory, KlineData, KlineType } from '../types';

const isDev = import.meta.env.DEV;
const BASE_URL = isDev ? '/api' : 'https://gold-price-monitor.vercel.app/api';

export async function fetchPrices(): Promise<PriceData[]> {
  const response = await fetch(`${BASE_URL}/prices`);
  const data = await response.json();
  return data.data;
}

export async function fetchPriceHistory(id: string): Promise<PriceHistory[]> {
  const response = await fetch(`${BASE_URL}/prices/${id}/history`);
  const data = await response.json();
  return data.data;
}

export async function fetchKlineData(id: string, type: KlineType): Promise<KlineData[]> {
  const response = await fetch(`${BASE_URL}/prices/${id}/kline?type=${type}`);
  const data = await response.json();
  return data.data;
}

export async function fetchBasePrice(id: string): Promise<{ price: number; timestamp: number }> {
  const response = await fetch(`${BASE_URL}/prices/${id}/base-price`);
  const data = await response.json();
  return data.data;
}