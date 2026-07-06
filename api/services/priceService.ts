interface Product {
  id: string;
  name: string;
  symbol: string;
  unit: string;
  toUsd: number;
  toGram: number | null;
  cnyUnit: string;
  basePrice: number;
  sinaCode: string;
}

interface PriceRecord {
  timestamp: number;
  usdPrice: number;
  cnyPrice: number;
}

interface KlineData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

const OZ_TO_GRAM = 31.1035;
const LB_TO_GRAM = 453.592;

const products: Product[] = [
  { id: 'gold', name: '黄金', symbol: 'AU', unit: 'oz', toUsd: 1, toGram: OZ_TO_GRAM, cnyUnit: '元/克', basePrice: 2025, sinaCode: 'hf_XAU' },
  { id: 'crude', name: '原油', symbol: 'CL', unit: 'bbl', toUsd: 1, toGram: null, cnyUnit: '元/桶', basePrice: 78, sinaCode: 'hf_CL' },
  { id: 'electricity', name: '电力', symbol: 'EL', unit: 'MMBtu', toUsd: 1, toGram: null, cnyUnit: '元/MMBtu', basePrice: 2.5, sinaCode: 'hf_NG' },
  { id: 'silver', name: '白银', symbol: 'AG', unit: 'oz', toUsd: 1, toGram: OZ_TO_GRAM, cnyUnit: '元/克', basePrice: 24, sinaCode: 'hf_XAG' },
  { id: 'copper', name: '黄铜', symbol: 'CU', unit: 'lb', toUsd: 0.01, toGram: LB_TO_GRAM, cnyUnit: '元/克', basePrice: 385, sinaCode: 'hf_HG' },
];

const priceHistory: Map<string, PriceRecord[]> = new Map();
const latestPrices: Map<string, number> = new Map();
const basePrices: Map<string, number> = new Map();

const USD_TO_CNY = 7.24;

let cachedGoldPrice = null;
let cachedGoldPriceTime = 0;
const GOLD_CACHE_DURATION = 15000;

function generateRandomChange(basePrice: number): number {
  const volatility = basePrice * 0.001;
  return (Math.random() - 0.5) * volatility * 2;
}

function getToday930Timestamp(): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 30, 0);
  if (now < today) {
    today.setDate(today.getDate() - 1);
  }
  while (today.getDay() === 0 || today.getDay() === 6) {
    today.setDate(today.getDate() - 1);
  }
  return today.getTime();
}

async function fetchRealGoldPrice(): Promise<number> {
  const now = Date.now();
  if (cachedGoldPrice && now - cachedGoldPriceTime < GOLD_CACHE_DURATION) {
    return cachedGoldPrice;
  }

  const sources = [
    async () => {
      const response = await fetch('https://api.gold-api.com/price/XAU');
      const data = await response.json();
      return data.price;
    },
    async () => {
      const response = await fetch('https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=XAU&apikey=demo');
      const data = await response.json();
      return parseFloat(data['Global Quote']['05. price']);
    },
    async () => {
      const response = await fetch(`https://hq.sinajs.cn/list=${products[0].sinaCode}`);
      const text = await response.text();
      const priceStr = text.split(',')[1];
      return parseFloat(priceStr);
    },
  ];

  for (const source of sources) {
    try {
      const price = await source();
      if (price && typeof price === 'number' && !isNaN(price)) {
        cachedGoldPrice = price;
        cachedGoldPriceTime = now;
        return price;
      }
    } catch (error) {
      console.log(`Fetch failed: ${error}`);
    }
  }

  return products.find(p => p.id === 'gold')?.basePrice || 2025;
}

async function fetchSinaPrice(sinaCode: string): Promise<number> {
  try {
    const response = await fetch(`https://hq.sinajs.cn/list=${sinaCode}`);
    const text = await response.text();
    const parts = text.split(',');
    if (parts.length > 1) {
      const price = parseFloat(parts[1]);
      if (!isNaN(price)) return price;
    }
  } catch (error) {
    console.log(`Sina fetch failed: ${error}`);
  }
  return 0;
}

function initPrices() {
  products.forEach(product => {
    latestPrices.set(product.id, product.basePrice);
    basePrices.set(product.id, product.basePrice);
    priceHistory.set(product.id, []);
  });
}

initPrices();

export async function getPrices() {
  const base930Timestamp = getToday930Timestamp();
  
  const results = await Promise.all(products.map(async product => {
    let currentPrice = latestPrices.get(product.id) || product.basePrice;
    
    if (product.id === 'gold') {
      currentPrice = await fetchRealGoldPrice();
    } else {
      const realPrice = await fetchSinaPrice(product.sinaCode);
      if (realPrice > 0) {
        currentPrice = realPrice;
      } else {
        const change = generateRandomChange(currentPrice);
        currentPrice = Math.max(currentPrice + change, 0.01);
      }
    }
    
    latestPrices.set(product.id, currentPrice);
    
    const history = priceHistory.get(product.id) || [];
    const lastRecord = history.length > 0 ? history[history.length - 1] : null;
    
    let cnyPrice = currentPrice * USD_TO_CNY;
    if (product.toGram) {
      cnyPrice = cnyPrice / product.toGram;
    }
    
    if (!lastRecord || Math.abs(currentPrice - lastRecord.usdPrice) > 0.0001) {
      history.push({
        timestamp: Date.now(),
        usdPrice: currentPrice,
        cnyPrice: cnyPrice,
      });
      if (history.length > 500) {
        history.shift();
      }
      priceHistory.set(product.id, history);
    }
    
    let base930Price = product.basePrice;
    for (const record of history) {
      if (record.timestamp >= base930Timestamp) {
        base930Price = record.usdPrice;
        break;
      }
      base930Price = record.usdPrice;
    }
    
    let base930CNY = base930Price * USD_TO_CNY;
    if (product.toGram) {
      base930CNY = base930CNY / product.toGram;
    }
    
    const changeFromBase = currentPrice - base930Price;
    const changePercent = (changeFromBase / base930Price) * 100;
    
    return {
      id: product.id,
      name: product.name,
      symbol: product.symbol,
      unit: product.unit,
      cnyUnit: product.cnyUnit,
      usdPrice: parseFloat(currentPrice.toFixed(4)),
      cnyPrice: parseFloat(cnyPrice.toFixed(4)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      timestamp: Date.now(),
      base930Price: parseFloat(base930Price.toFixed(4)),
      base930CNY: parseFloat(base930CNY.toFixed(4)),
    };
  }));
  
  return results;
}

export function getPriceHistory(id: string): PriceRecord[] {
  return priceHistory.get(id) || [];
}

export function getBasePrice(id: string): { price: number; timestamp: number; cnyPrice: number } {
  const base930Timestamp = getToday930Timestamp();
  const history = priceHistory.get(id) || [];
  const product = products.find(p => p.id === id);
  
  let base930Price = product?.basePrice || 0;
  let base930CNY = base930Price * USD_TO_CNY;
  
  if (product?.toGram) {
    base930CNY = base930CNY / product.toGram;
  }
  
  for (const record of history) {
    if (record.timestamp >= base930Timestamp) {
      base930Price = record.usdPrice;
      base930CNY = record.cnyPrice;
      break;
    }
    base930Price = record.usdPrice;
    base930CNY = record.cnyPrice;
  }
  
  return {
    price: base930Price,
    timestamp: base930Timestamp,
    cnyPrice: base930CNY,
  };
}

export function getKlineData(id: string, type: string): KlineData[] {
  const product = products.find(p => p.id === id);
  if (!product) return [];
  
  const data: KlineData[] = [];
  const basePrice = product.basePrice;
  const now = Date.now();
  let currentPrice = latestPrices.get(id) || basePrice;
  
  const intervals: Record<string, number> = {
    minute: 60000,
    hour: 3600000,
    day: 86400000,
    week: 604800000,
    month: 2592000000,
  };
  
  const interval = intervals[type] || 60000;
  const count = type === 'minute' ? 60 : type === 'hour' ? 24 : 30;
  
  for (let i = count; i >= 0; i--) {
    const timestamp = now - i * interval;
    const open = currentPrice;
    const change = generateRandomChange(basePrice);
    const close = Math.max(open + change, 0.01);
    const high = Math.max(open, close) + Math.random() * basePrice * 0.001;
    const low = Math.min(open, close) - Math.random() * basePrice * 0.001;
    
    data.push({
      timestamp,
      open: parseFloat(open.toFixed(4)),
      high: parseFloat(high.toFixed(4)),
      low: parseFloat(low.toFixed(4)),
      close: parseFloat(close.toFixed(4)),
    });
    
    currentPrice = close;
  }
  
  return data;
}

export function getBase930Timestamp(): number {
  return getToday930Timestamp();
}
