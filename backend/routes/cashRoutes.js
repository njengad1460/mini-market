import { Router } from 'express';
import authenticate from '../middleware/Cognito-Auth-Middleware.js';
import authorize from '../middleware/Role-Check-Middleware.js';
import { openSession, closeSession, recordTransaction, getActiveSession, getAllSessions } from '../controllers/cashController.js';

const router = Router();

router.post('/open',         authenticate, authorize('admin', 'staff'), openSession);
router.post('/transaction',  authenticate, authorize('admin', 'staff'), recordTransaction);
router.post('/close',        authenticate, authorize('admin', 'staff'), closeSession);
router.get('/active',        authenticate, authorize('admin', 'staff'), getActiveSession);
router.get('/',              authenticate, authorize('admin'), getAllSessions);

export default router;
