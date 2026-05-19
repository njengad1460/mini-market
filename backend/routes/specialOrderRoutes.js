import { Router } from 'express';
import authenticate from '../middleware/Cognito-Auth-Middleware.js';
import authorize from '../middleware/Role-Check-Middleware.js';
import { createSpecialOrder, getSpecialOrders, updateSpecialOrderStatus } from '../controllers/specialOrderController.js';

const router = Router();

router.post('/',          authenticate, authorize('customer'), createSpecialOrder);
router.get('/',           authenticate, authorize('admin', 'staff'), getSpecialOrders);
router.patch('/:id',      authenticate, authorize('admin', 'staff'), updateSpecialOrderStatus);

export default router;
