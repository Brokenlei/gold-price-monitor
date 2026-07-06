import express from 'express';
import { getPrices, getPriceHistory, getKlineData, getBasePrice } from '../services/priceService';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const prices = await getPrices();
    res.json({ success: true, data: prices });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch prices' });
  }
});

router.get('/:id/history', (req, res) => {
  const { id } = req.params;
  res.json({ success: true, data: getPriceHistory(id) });
});

router.get('/:id/kline', (req, res) => {
  const { id } = req.params;
  const { type } = req.query as { type?: string };
  res.json({ success: true, data: getKlineData(id, type || 'minute') });
});

router.get('/:id/base-price', (req, res) => {
  const { id } = req.params;
  res.json({ success: true, data: getBasePrice(id) });
});

export default router;
