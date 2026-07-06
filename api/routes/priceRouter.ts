import express from 'express';
import { getPrices, getPriceHistory, getKlineData, getBasePrice } from '../services/priceService';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ success: true, data: getPrices() });
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