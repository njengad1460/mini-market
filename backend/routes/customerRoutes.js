import { Router } from 'express';
import multer from 'multer';
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
  uploadProfileImage,
} from '../controllers/customerController.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

router.get('/me',             authenticate, authorize('customer'), getMyProfile);
router.patch('/me',           authenticate, authorize('customer'), updateMyProfile);
router.post('/me/profile-image', authenticate, authorize('customer'), upload.single('file'), uploadProfileImage);
router.post('/wallet/withdraw', authenticate, authorize('customer'), withdrawWallet);
router.post('/walkin',       authenticate, authorize('admin', 'staff'), registerWalkin);
router.get('/',              authenticate, authorize('admin', 'staff'), getCustomers);
router.patch('/:id/balance', authenticate, authorize('admin', 'staff'), updateCustomerBalance);
router.get('/:id',           authenticate, authorize('admin', 'staff'), getCustomer);

export default router;
