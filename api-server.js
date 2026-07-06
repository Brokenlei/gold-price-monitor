const express = require('express');
const cors = require('cors');

const products = [
  { id: 'gold', name: '黄金', symbol: 'AU', basePrice: 2025 },
  { id: 'crude', name: '原油', symbol: 'CL', basePrice: 78 },
  { id: 'electricity', name: '电力', symbol: 'EL', basePrice: 0.15 },
  { id: 'coal', name: '煤炭', symbol: 'CO', basePrice: 120 },
  { id: 'silver', name: '白银', symbol: 'AG', basePrice: 24 },
  { id: 'copper', name: '黄铜', symbol: 'CU', basePrice: 3.85 },
];

const priceHistory = new Map();
const latestPrices = new Map();

const USD_TO_CNY = 7.24;

function generateRandomChange(basePrice) {
  const volatility = basePrice * 0.001;
  return (Math.random() - 0.5) * volatility * 2;
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

products.forEach(product => {
  latestPrices.set(product.id, product.basePrice);
  priceHistory.set(product.id, []);
});

function getPrices() {
  const base930Timestamp = getToday930Timestamp();
  
  return products.map(product => {
    const currentPrice = latestPrices.get(product.id) || product.basePrice;
    const change = generateRandomChange(currentPrice);
    const newPrice = Math.max(currentPrice + change, 0.01);
    
    latestPrices.set(product.id, newPrice);
    
    const history = priceHistory.get(product.id) || [];
    const lastRecord = history.length > 0 ? history[history.length - 1] : null;
    
    if (!lastRecord || Math.abs(newPrice - lastRecord.usdPrice) > 0.0001) {
      history.push({
        timestamp: Date.now(),
        usdPrice: newPrice,
        cnyPrice: newPrice * USD_TO_CNY,
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
    
    const changeFromBase = newPrice - base930Price;
    const changePercent = (changeFromBase / base930Price) * 100;
    
    return {
      id: product.id,
      name: product.name,
      symbol: product.symbol,
      usdPrice: parseFloat(newPrice.toFixed(4)),
      cnyPrice: parseFloat((newPrice * USD_TO_CNY).toFixed(4)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      timestamp: Date.now(),
      base930Price: parseFloat(base930Price.toFixed(4)),
      base930CNY: parseFloat((base930Price * USD_TO_CNY).toFixed(4)),
    };
  });
}

function getPriceHistory(id) {
  return priceHistory.get(id) || [];
}

function getBasePrice(id) {
  const base930Timestamp = getToday930Timestamp();
  const history = priceHistory.get(id) || [];
  const product = products.find(p => p.id === id);
  
  let base930Price = product?.basePrice || 0;
  
  for (const record of history) {
    if (record.timestamp >= base930Timestamp) {
      base930Price = record.usdPrice;
      break;
    }
    base930Price = record.usdPrice;
  }
  
  return {
    price: base930Price,
    timestamp: base930Timestamp,
  };
}

function getKlineData(id, type) {
  const product = products.find(p => p.id === id);
  if (!product) return [];
  
  const data = [];
  const basePrice = product.basePrice;
  const now = Date.now();
  let currentPrice = basePrice;
  
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

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/prices', (req, res) => {
  res.json({ success: true, data: getPrices() });
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

app.listen(PORT, () => {
  console.log('Server running on http://localhost:' + PORT);
});