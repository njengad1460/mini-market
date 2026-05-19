import { Router } from 'express';
import authenticate from '../middleware/Cognito-Auth-Middleware.js';
import authorize from '../middleware/Role-Check-Middleware.js';
import { placeOrder, payInstallment, recordDelivery, applyDiscount, getOrders, getMyOrders } from '../controllers/orderController.js';

const router = Router();

router.post('/',                    authenticate, placeOrder);                                    // any logged-in user
router.get('/',                     authenticate, authorize('admin', 'staff'), getOrders);        // staff/admin
router.get('/my',                   authenticate, authorize('customer'), getMyOrders);            // customer
router.post('/:id/installment',     authenticate, payInstallment);                               // any logged-in user
router.post('/:id/delivery',        authenticate, authorize('admin', 'staff'), recordDelivery);  // staff/admin
router.patch('/:id/discount',       authenticate, authorize('admin', 'staff'), applyDiscount);   // staff/admin

export default router;
