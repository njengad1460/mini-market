import express from 'express';
import { syncOfflineData } from '../controllers/syncController.js';

const router = express.Router();

// POST /api/sync/offline
router.post('/offline', syncOfflineData);

export default router;
