import { Router } from 'express';
import authenticate from '../middleware/Cognito-Auth-Middleware.js';
import authorize from '../middleware/Role-Check-Middleware.js';
import {
  registerWalkin,
  getCustomers,
  getCustomer,
  getMyProfile,
  updateMyProfile,
  updateCustomerBalance,
  withdrawWallet,
} from '../controllers/customerController.js';

const router = Router();

router.get('/me',             authenticate, authorize('customer'), getMyProfile);
router.patch('/me',           authenticate, authorize('customer'), updateMyProfile);
router.post('/wallet/withdraw', authenticate, authorize('customer'), withdrawWallet);
router.post('/walkin',       authenticate, authorize('admin', 'staff'), registerWalkin);
router.get('/',              authenticate, authorize('admin', 'staff'), getCustomers);
router.patch('/:id/balance', authenticate, authorize('admin', 'staff'), updateCustomerBalance);
router.get('/:id',           authenticate, authorize('admin', 'staff'), getCustomer);

export default router;
