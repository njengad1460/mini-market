import { Router } from 'express';
import authenticate from '../middleware/Cognito-Auth-Middleware.js';
import { getNotifications, markAsRead, markAllAsRead } from '../controllers/notificationController.js';

const router = Router();

router.use(authenticate);

router.get('/', getNotifications);
router.post('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);

export default router;
