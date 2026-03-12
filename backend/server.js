import express from 'express';
import connectDB from './config/db.js';
import dotenv from 'dotenv';
import cors from 'cors';
import adminAuthRoutes from './routes/adminAuthRoutes.js';
import rfqRoutes from './routes/rfqRoutes.js';

dotenv.config();

const app = express();

connectDB();
app.use(cors());
app.use(express.json());
app.use('/api/admin', adminAuthRoutes);
app.use('/api/rfq', rfqRoutes);

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});

