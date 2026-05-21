import express from 'express';
import cors from 'cors';
import { connectDB } from './utils/db.js';
import { ENV } from './config/env.js';

import requestLogger  from './middleware/Logging-Middleware.js';
import errorHandler   from './middleware/Error-Handler-Middleware.js';
import { generalLimiter } from './middleware/Rate-Limiting.js';

import authRoutes         from './routes/authRoutes.js';
import customerRoutes     from './routes/customerRoutes.js';
import productRoutes      from './routes/productRoutes.js';
import orderRoutes        from './routes/orderRoutes.js';
import cartRoutes         from './routes/cartRoutes.js';
import specialOrderRoutes from './routes/specialOrderRoutes.js';
import analyticsRoutes    from './routes/analyticsRoutes.js';
import cashRoutes         from './routes/cashRoutes.js';
import userRoutes         from './routes/userRoutes.js';
import uploadRoutes       from './routes/uploadRoutes.js';
import syncRoutes         from './routes/syncRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

import { startOfflineSyncJob } from './jobs/offlineSyncJob.js';

const app = express();

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost'], credentials: true }));
app.use(express.json());
app.use(requestLogger);
app.use(generalLimiter);

app.use('/health',            (req, res) => res.status(200).send('OK'));
app.use('/api/auth',          authRoutes);
app.use('/api/customers',     customerRoutes);
app.use('/api/products',      productRoutes);
app.use('/api/orders',        orderRoutes);
app.use('/api/cart',          cartRoutes);
app.use('/api/special-orders',specialOrderRoutes);
app.use('/api/analytics',     analyticsRoutes);
app.use('/api/cash',          cashRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/upload',        uploadRoutes);
app.use('/api/sync',          syncRoutes);
app.use('/api/notifications', notificationRoutes);

app.use(errorHandler);

connectDB().then(() => {
  startOfflineSyncJob();
  app.listen(ENV.PORT, () => console.log(`Server running on port ${ENV.PORT}`));
});
