import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './utils/db.js';
import { ENV } from './config/env.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

app.use(cors({ origin: function(origin, callback) { callback(null, true); }, credentials: true }));
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

// Serve built React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'frontend', 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'));
  });
}

connectDB().then(() => {
  startOfflineSyncJob();
  app.listen(ENV.PORT, () => console.log(`Server running on port ${ENV.PORT}`));
});
