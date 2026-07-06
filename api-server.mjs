import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USE_SIMULATED_DATA = false;

const OZ_TO_GRAM = 31.1035;
const LB_TO_GRAM = 453.592;

const products = [
  { id: 'gold', name: '黄金', symbol: 'AU', sinaCode: 'hf_XAU', unit: 'oz', toUsd: 1, toGram: OZ_TO_GRAM, cnyUnit: '元/克' },
  { id: 'crude', name: '原油', symbol: 'CL', sinaCode: 'hf_CL', unit: 'bbl', toUsd: 1, toGram: null, cnyUnit: '元/桶' },
  { id: 'electricity', name: '电力', symbol: 'EL', sinaCode: 'hf_NG', unit: 'MMBtu', toUsd: 1, toGram: null, cnyUnit: '元/MMBtu' },
  { id: 'silver', name: '白银', symbol: 'AG', sinaCode: 'hf_XAG', unit: 'oz', toUsd: 1, toGram: OZ_TO_GRAM, cnyUnit: '元/克' },
  { id: 'copper', name: '黄铜', symbol: 'CU', sinaCode: 'hf_HG', unit: 'lb', toUsd: 0.01, toGram: LB_TO_GRAM, cnyUnit: '元/克' },
];

const priceHistory = new Map();
const latestPrices = new Map();

const USD_TO_CNY = 7.24;

const HISTORY_FILE = path.join(__dirname, 'price-history.json');
const BASE_PRICES_FILE = path.join(__dirname, 'base-prices.json');

let cachedGoldPrice = null;
let cachedGoldPriceTime = 0;
const GOLD_CACHE_DURATION = 15000;

let autoRefreshInterval = null;

async function fetchRealGoldPrice() {
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
      const response = await fetch('https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=XAU&to_currency=USD&apikey=demo', { timeout: 5000 });
      const data = await response.json();
      return parseFloat(data['Realtime Currency Exchange Rate']?.['5. Exchange Rate']);
    },
    async () => {
      const response = await fetch('http://hq.sinajs.cn/list=hf_XAU', {
        headers: { 'Referer': 'http://finance.sina.com.cn' },
        timeout: 5000
      });
      const text = await response.text();
      const match = text.match(/"([^"]+)"/);
      if (match) {
        const data = match[1].split(',');
        return parseFloat(data[0]);
      }
      return null;
    },
  ];
  
  for (const source of sources) {
    try {
      const price = await source();
      if (price && !isNaN(price)) {
        cachedGoldPrice = price;
        cachedGoldPriceTime = now;
        return price;
      }
    } catch (error) {
      console.error('Failed to fetch from source:', error.message);
    }
  }
  
  return cachedGoldPrice || 4090;
}

async function fetchSinaCommodityPrices() {
  const codes = products.filter(p => p.sinaCode && p.id !== 'gold').map(p => p.sinaCode).join(',');
  
  if (!codes) return {};
  
  const sources = [
    async () => {
      const response = await fetch(`http://hq.sinajs.cn/list=${codes}`, {
        headers: { 'Referer': 'http://finance.sina.com.cn' },
        timeout: 8000
      });
      const text = await response.text();
      const prices = {};
      const lines = text.split('\n');
      for (const line of lines) {
        const match = line.match(/hq_str_hf_(\w+)="([^"]+)"/);
        if (match) {
          const code = match[1];
          const data = match[2].split(',');
          const price = parseFloat(data[0]);
          if (!isNaN(price)) {
            prices[code] = price;
          }
        }
      }
      return prices;
    },
    async () => {
      const prices = {};
      const futuresUrl = 'https://stock.xueqiu.com/v5/stock/realtime/quote.json?symbol=SHFE.ag,SHFE.cu,INE.sc,DCE.i';
      try {
        const response = await fetch(futuresUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          timeout: 8000
        });
        const data = await response.json();
        if (data.data?.items) {
          data.data.items.forEach(item => {
            const symbol = item.symbol;
            const price = item.current;
            if (symbol.includes('ag')) prices['XAG'] = price;
            if (symbol.includes('cu')) prices['HG'] = price * 100;
            if (symbol.includes('sc')) prices['CL'] = price;
            if (symbol.includes('i')) prices['NG'] = price;
          });
        }
      } catch (e) {
        console.error('Xueqiu API failed:', e.message);
      }
      return prices;
    },
  ];
  
  let result = {};
  for (const source of sources) {
    try {
      const prices = await source();
      result = { ...result, ...prices };
      if (Object.keys(result).length >= 4) break;
    } catch (error) {
      console.error('Failed to fetch commodity prices:', error.message);
    }
  }
  
  return result;
}

function getToday930Timestamp() {
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

function loadHistoryFromFile() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const data = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
      for (const [id, history] of Object.entries(data)) {
        priceHistory.set(id, history);
      }
    }
  } catch (error) {
    console.error('Failed to load history from file:', error.message);
  }
}

function saveHistoryToFile() {
  try {
    const data = Object.fromEntries(priceHistory);
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Failed to save history to file:', error.message);
  }
}

function loadBasePricesFromFile() {
  try {
    if (fs.existsSync(BASE_PRICES_FILE)) {
      const data = JSON.parse(fs.readFileSync(BASE_PRICES_FILE, 'utf-8'));
      return data;
    }
  } catch (error) {
    console.error('Failed to load base prices from file:', error.message);
  }
  return { prices: {}, timestamp: null };
}

function saveBasePricesToFile(prices, timestamp) {
  try {
    fs.writeFileSync(BASE_PRICES_FILE, JSON.stringify({ prices, timestamp }, null, 2));
  } catch (error) {
    console.error('Failed to save base prices to file:', error.message);
  }
}

products.forEach(product => {
  if (product.id === 'gold') {
    latestPrices.set(product.id, USE_SIMULATED_DATA ? 4176 : 4090);
  } else if (product.id === 'silver') {
    latestPrices.set(product.id, USE_SIMULATED_DATA ? 62 : 58);
  } else if (product.id === 'crude') {
    latestPrices.set(product.id, USE_SIMULATED_DATA ? 69 : 70);
  } else if (product.id === 'copper') {
    latestPrices.set(product.id, USE_SIMULATED_DATA ? 6.3 : 4.5);
  } else {
    latestPrices.set(product.id, USE_SIMULATED_DATA ? 3.14 : 3.2);
  }
  priceHistory.set(product.id, []);
});

loadHistoryFromFile();

const savedBaseData = loadBasePricesFromFile();
let basePrices = new Map(Object.entries(savedBaseData.prices || {}));
let basePricesTime = savedBaseData.timestamp;

let saveInterval = null;

function generateSimulatedPrice(basePrice, volatility = 0.0005) {
  const change = (Math.random() - 0.5) * volatility * basePrice * 2;
  return Math.max(basePrice + change, basePrice * 0.99);
}

async function getPrices() {
  const now = Date.now();
  const base930Timestamp = getToday930Timestamp();
  
  let realGoldPrice = latestPrices.get('gold') || 4176;
  let sinaPrices = {};
  
  if (!USE_SIMULATED_DATA) {
    realGoldPrice = await fetchRealGoldPrice();
    sinaPrices = await fetchSinaCommodityPrices();
  }
  
  if (basePricesTime !== base930Timestamp) {
    basePrices.clear();
    basePrices.set('gold', realGoldPrice);
    basePrices.set('silver', USE_SIMULATED_DATA ? 62 : (sinaPrices['XAG'] || 58));
    basePrices.set('crude', USE_SIMULATED_DATA ? 69 : (sinaPrices['CL'] || 70));
    basePrices.set('copper', USE_SIMULATED_DATA ? 6.3 : ((sinaPrices['HG'] || 450) * 0.01));
    basePrices.set('electricity', USE_SIMULATED_DATA ? 3.14 : (sinaPrices['NG'] || 3.2));
    basePricesTime = base930Timestamp;
    saveBasePricesToFile(Object.fromEntries(basePrices), basePricesTime);
  }
  
  return products.map(product => {
    let currentPrice;
    let useRealPrice = false;
    
    if (USE_SIMULATED_DATA) {
      const base = latestPrices.get(product.id);
      currentPrice = generateSimulatedPrice(base);
      useRealPrice = false;
    } else if (product.id === 'gold') {
      currentPrice = realGoldPrice;
      useRealPrice = true;
    } else if (product.sinaCode) {
      const sinaCode = product.sinaCode.replace('hf_', '').toUpperCase();
      const sinaPrice = sinaPrices[sinaCode];
      if (sinaPrice !== undefined) {
        currentPrice = sinaPrice * product.toUsd;
        useRealPrice = true;
      } else {
        currentPrice = latestPrices.get(product.id);
      }
    } else {
      const prev = latestPrices.get(product.id);
      const change = (Math.random() - 0.5) * 0.002 * prev;
      currentPrice = Math.max(prev + change, 0.01);
    }
    
    latestPrices.set(product.id, currentPrice);
    
    let cnyPrice;
    if (product.toGram) {
      cnyPrice = (currentPrice * USD_TO_CNY) / product.toGram;
    } else {
      cnyPrice = currentPrice * USD_TO_CNY;
    }
    
    const history = priceHistory.get(product.id) || [];
    const lastRecord = history.length > 0 ? history[history.length - 1] : null;
    
    if (!lastRecord || Math.abs(currentPrice - lastRecord.usdPrice) > 0.0001) {
      history.push({
        timestamp: now,
        usdPrice: currentPrice,
        cnyPrice: cnyPrice,
      });
      if (history.length > 1000) {
        history.shift();
      }
      priceHistory.set(product.id, history);
    }
    
    const base930Price = basePrices.get(product.id) || currentPrice;
    
    let base930CNY;
    if (product.toGram) {
      base930CNY = (base930Price * USD_TO_CNY) / product.toGram;
    } else {
      base930CNY = base930Price * USD_TO_CNY;
    }
    
    const changeFromBase = currentPrice - base930Price;
    const changePercent = base930Price > 0 ? (changeFromBase / base930Price) * 100 : 0;
    
    return {
      id: product.id,
      name: product.name,
      symbol: product.symbol,
      unit: product.unit,
      cnyUnit: product.cnyUnit,
      usdPrice: parseFloat(currentPrice.toFixed(4)),
      cnyPrice: parseFloat(cnyPrice.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      timestamp: now,
      base930Price: parseFloat(base930Price.toFixed(4)),
      base930CNY: parseFloat(base930CNY.toFixed(2)),
      useRealPrice,
    };
  });
}

function getPriceHistory(id) {
  return priceHistory.get(id) || [];
}

function getBasePrice(id) {
  const base930Timestamp = getToday930Timestamp();
  const base = basePrices.get(id) || 0;
  
  return {
    price: base,
    timestamp: basePricesTime || base930Timestamp,
  };
}

function getKlineData(id, type) {
  const product = products.find(p => p.id === id);
  if (!product) return [];
  
  const data = [];
  const history = priceHistory.get(id) || [];
  const now = Date.now();
  
  const intervals = {
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
    const startIdx = Math.max(0, history.length - count - 1 + (count - i));
    const endIdx = Math.max(0, history.length - count + (count - i));
    
    const slice = history.slice(startIdx, endIdx + 1);
    
    if (slice.length > 0) {
      const prices = slice.map(r => r.usdPrice);
      const open = prices[0];
      const close = prices[prices.length - 1];
      const high = Math.max(...prices);
      const low = Math.min(...prices);
      
      data.push({
        timestamp,
        open: parseFloat(open.toFixed(4)),
        high: parseFloat(high.toFixed(4)),
        low: parseFloat(low.toFixed(4)),
        close: parseFloat(close.toFixed(4)),
      });
    } else {
      const basePrice = latestPrices.get(id) || product.id === 'gold' ? 4090 : 100;
      const open = basePrice;
      const close = basePrice * (1 + (Math.random() - 0.5) * 0.002);
      const high = Math.max(open, close) * 1.001;
      const low = Math.min(open, close) * 0.999;
      
      data.push({
        timestamp,
        open: parseFloat(open.toFixed(4)),
        high: parseFloat(high.toFixed(4)),
        low: parseFloat(low.toFixed(4)),
        close: parseFloat(close.toFixed(4)),
      });
    }
  }
  
  return data;
}

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/prices', async (req, res) => {
  try {
    const prices = await getPrices();
    res.json({ success: true, data: prices });
  } catch (error) {
    console.error('Error getting prices:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/prices/:id/history', (req, res) => {
  res.json({ success: true, data: getPriceHistory(req.params.id) });
});

app.get('/api/prices/:id/kline', (req, res) => {
  res.json({ success: true, data: getKlineData(req.params.id, req.query.type || 'minute') });
});

app.get('/api/prices/:id/base-price', (req, res) => {
  res.json({ success: true, data: getBasePrice(req.params.id) });
});

app.get('/api/simulated', (req, res) => {
  res.json({ success: true, data: USE_SIMULATED_DATA });
});

app.listen(PORT, () => {
  console.log('Server running on http://localhost:' + PORT);
  console.log('Data mode:', USE_SIMULATED_DATA ? 'SIMULATED' : 'REAL');
  console.log('Data sources:');
  console.log('  - Gold: gold-api.com (real-time)');
  console.log('  - Silver, Crude Oil, Copper, Electricity: Sina Finance (real-time)');
  
  saveInterval = setInterval(saveHistoryToFile, 30000);
  
  autoRefreshInterval = setInterval(async () => {
    try {
      await getPrices();
    } catch (error) {
      console.error('Auto refresh error:', error);
    }
  }, 5000);
  
  process.on('SIGINT', () => {
    saveHistoryToFile();
    if (saveInterval) clearInterval(saveInterval);
    if (autoRefreshInterval) clearInterval(autoRefreshInterval);
    process.exit();
  });
});