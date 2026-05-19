import { Router } from 'express';
import authenticate from '../middleware/Cognito-Auth-Middleware.js';
import authorize from '../middleware/Role-Check-Middleware.js';
import { getOverview, getStaffPerformance, getAuditLogs } from '../controllers/analyticsController.js';

const router = Router();

router.get('/overview',          authenticate, authorize('admin'), getOverview);
router.get('/staff-performance', authenticate, authorize('admin'), getStaffPerformance);
router.get('/audit-logs',        authenticate, authorize('admin'), getAuditLogs);

export default router;
