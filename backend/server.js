import express from 'express';
import connectDB from './config/db.js';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import adminAuthRoutes from './routes/adminAuthRoutes.js';
import rfqRoutes from './routes/rfqRoutes.js';
import quotationRoutes from './routes/quotationRoutes.js';
import supplierRoutes from './routes/supplierRoutes.js';

dotenv.config();

const app = express();

connectDB();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use('/api/admin', adminAuthRoutes);
app.use('/api/rfq', rfqRoutes);
app.use('/api/quotation', quotationRoutes);
app.use('/api/supplier', supplierRoutes);

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});

