import express from 'express';
import connectDB from './config/db.js';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import adminAuthRoutes from './routes/adminAuthRoutes.js';
import rfqRoutes from './routes/rfqRoutes.js';
import quotationRoutes from './routes/quotationRoutes.js';
import supplierRoutes from './routes/supplierRoutes.js';
import notificationsRoutes from './routes/notificationsRoutes.js';

dotenv.config();

const app = express();

connectDB();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.get('/api/health', (req, res) => {
  return res.status(200).json({
    message: 'Vendor-Pick backend is running.',
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});
app.use('/api/admin', adminAuthRoutes);
app.use('/api/rfq', rfqRoutes);
app.use('/api/quotation', quotationRoutes);
app.use('/api/supplier', supplierRoutes);
app.use('/api/notifications', notificationsRoutes);

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});

