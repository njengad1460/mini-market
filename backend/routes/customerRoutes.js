import { Router } from 'express';
import authenticate from '../middleware/Cognito-Auth-Middleware.js';
import authorize from '../middleware/Role-Check-Middleware.js';
import { registerWalkin, getCustomers, getCustomer, withdrawWallet } from '../controllers/customerController.js';

const router = Router();

router.post('/walkin',       authenticate, authorize('admin', 'staff'), registerWalkin);
router.get('/',              authenticate, authorize('admin', 'staff'), getCustomers);
router.get('/:id',           authenticate, authorize('admin', 'staff'), getCustomer);
router.post('/wallet/withdraw', authenticate, authorize('customer'),    withdrawWallet);

export default router;
