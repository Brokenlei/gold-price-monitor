import express from 'express';
import cors from 'cors';
import priceRouter from './routes/priceRouter';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api/prices', priceRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});