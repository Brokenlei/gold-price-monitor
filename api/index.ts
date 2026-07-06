import express from 'express';
import cors from 'cors';
import priceRouter from './routes/priceRouter';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/prices', priceRouter);

export default app;
