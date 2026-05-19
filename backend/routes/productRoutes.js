import { Router } from 'express';
import authenticate from '../middleware/Cognito-Auth-Middleware.js';
import authorize from '../middleware/Role-Check-Middleware.js';
import { addProduct, approveProduct, getProducts, getProductsAdmin, getProduct, updateProduct } from '../controllers/productController.js';

const router = Router();

router.get('/',              getProducts);                                              // public
router.get('/admin',         authenticate, authorize('admin', 'staff'), getProductsAdmin);       // staff/admin inventory view
router.get('/:id',           getProduct);                                               // public
router.post('/',             authenticate, authorize('admin', 'staff'), addProduct);    // staff/admin
router.patch('/:id/approve', authenticate, authorize('admin'), approveProduct);         // admin only
router.patch('/:id',         authenticate, authorize('admin', 'staff'), updateProduct);  // stock update

export default router;
