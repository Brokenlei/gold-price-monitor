import { LocalNotifications } from '@capacitor/local-notifications';

const CHANNEL_ID = 'gold-price-alerts';
const LIVE_PRICE_NOTIFICATION_ID = 1000;

export interface PriceAlert {
  productId: string;
  productName: string;
  price: number;
  type: 'above' | 'below';
  threshold: number;
}

let lastNotificationTime = 0;
const NOTIFICATION_COOLDOWN = 60000;

let livePriceNotificationEnabled = false;

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const result = await LocalNotifications.requestPermissions();
    const status = (result as any).granted;
    return status === true || status === 'granted' || status === 1;
  } catch (error) {
    console.error('Failed to request notification permission:', error);
    return false;
  }
}

export async function checkNotificationPermission(): Promise<boolean> {
  try {
    const result = await LocalNotifications.checkPermissions();
    const status = (result as any).granted;
    return status === true || status === 'granted' || status === 1;
  } catch (error) {
    console.error('Failed to check notification permission:', error);
    return false;
  }
}

export async function sendGoldPriceNotification(
  productName: string,
  price: number,
  changePercent: number,
  isRise: boolean
): Promise<void> {
  const now = Date.now();
  if (now - lastNotificationTime < NOTIFICATION_COOLDOWN) {
    return;
  }

  try {
    const direction = isRise ? '📈 上涨' : '📉 下跌';
    const changeSign = isRise ? '+' : '';
    
    await LocalNotifications.schedule({
      notifications: [
        {
          title: `💰 ${productName}价格提醒`,
          body: `当前价格: $${price.toFixed(2)}\n${direction} ${changeSign}${changePercent.toFixed(2)}%`,
          id: Math.floor(Math.random() * 100000),
          channelId: CHANNEL_ID,
          smallIcon: 'ic_notification',
          sound: 'default',
        },
      ],
    });
    
    lastNotificationTime = now;
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}

export async function updateLivePriceNotification(
  productName: string,
  usdPrice: number,
  cnyPrice: number,
  changePercent: number,
  isRise: boolean
): Promise<void> {
  if (!livePriceNotificationEnabled) return;

  try {
    const direction = isRise ? '↑' : '↓';
    const changeSign = isRise ? '+' : '';
    
    await LocalNotifications.schedule({
      notifications: [
        {
          id: LIVE_PRICE_NOTIFICATION_ID,
          title: `💰 ${productName} ${direction} ${changeSign}${changePercent.toFixed(2)}%`,
          body: `¥${cnyPrice.toFixed(2)}/克 | $${usdPrice.toFixed(2)}`,
          channelId: CHANNEL_ID,
          smallIcon: 'ic_notification',
          ongoing: true,
          autoCancel: false,
        },
      ],
    });
  } catch (error) {
    console.error('Failed to update live price notification:', error);
  }
}

export async function startLivePriceNotification(): Promise<void> {
  try {
    const hasPermission = await checkNotificationPermission();
    if (!hasPermission) {
      await requestNotificationPermission();
    }
    
    livePriceNotificationEnabled = true;
    console.log('Live price notification enabled');
  } catch (error) {
    console.error('Failed to start live price notification:', error);
  }
}

export async function stopLivePriceNotification(): Promise<void> {
  try {
    livePriceNotificationEnabled = false;
    await LocalNotifications.cancel({ notifications: [{ id: LIVE_PRICE_NOTIFICATION_ID }] });
    console.log('Live price notification stopped');
  } catch (error) {
    console.error('Failed to stop live price notification:', error);
  }
}

export async function sendPriceAlertNotification(alert: PriceAlert): Promise<void> {
  try {
    const direction = alert.type === 'above' ? '突破' : '跌破';
    
    await LocalNotifications.schedule({
      notifications: [
        {
          title: `⚠️ ${alert.productName}价格提醒`,
          body: `价格${direction}设定值 $${alert.threshold.toFixed(2)}\n当前价格: $${alert.price.toFixed(2)}`,
          id: Math.floor(Math.random() * 100000),
          channelId: CHANNEL_ID,
          smallIcon: 'ic_notification',
          sound: 'default',
        },
      ],
    });
  } catch (error) {
    console.error('Failed to send alert notification:', error);
  }
}

export function setupNotificationListeners(
  onNotificationReceived?: (notification: any) => void
): void {
  LocalNotifications.addListener('localNotificationReceived', (notification) => {
    console.log('Notification received:', notification);
    if (onNotificationReceived) {
      onNotificationReceived(notification);
    }
  });

  LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
    console.log('Notification action performed:', notification);
  });
}

export function isLivePriceNotificationEnabled(): boolean {
  return livePriceNotificationEnabled;
}
