import { Router } from 'express';
import authenticate from '../middleware/Cognito-Auth-Middleware.js';
import authorize from '../middleware/Role-Check-Middleware.js';
import { createSpecialOrder, getSpecialOrders, getMySpecialOrders, updateSpecialOrderStatus } from '../controllers/specialOrderController.js';

const router = Router();

router.post('/',          authenticate, authorize('customer'), createSpecialOrder);
router.get('/my',         authenticate, authorize('customer'), getMySpecialOrders);
router.get('/',           authenticate, authorize('admin', 'staff'), getSpecialOrders);
router.patch('/:id',      authenticate, authorize('admin', 'staff'), updateSpecialOrderStatus);

export default router;
