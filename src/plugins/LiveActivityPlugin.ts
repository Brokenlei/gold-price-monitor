import { registerPlugin } from '@capacitor/core';

export interface PriceData {
  productId: string;
  productName: string;
  usdPrice: number;
  cnyPrice: number;
  changePercent: number;
  isUp: boolean;
}

export interface LiveActivityPlugin {
  startActivity(options: PriceData): Promise<{ success: boolean; activityId?: string }>;
  updateActivity(options: PriceData): Promise<{ success: boolean }>;
  endActivity(options: { productId: string }): Promise<{ success: boolean }>;
  isActivityActive(options: { productId: string }): Promise<{ active: boolean }>;
  supportsDynamicIsland(): Promise<{ supported: boolean }>;
}

export const LiveActivityPlugin = registerPlugin<LiveActivityPlugin>('LiveActivityPlugin', {
  web: {
    startActivity: () => Promise.resolve({ success: false }),
    updateActivity: () => Promise.resolve({ success: false }),
    endActivity: () => Promise.resolve({ success: false }),
    isActivityActive: () => Promise.resolve({ active: false }),
    supportsDynamicIsland: () => Promise.resolve({ supported: false }),
  },
});
