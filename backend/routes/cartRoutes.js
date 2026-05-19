import { Router } from 'express';
import optionalAuth from '../middleware/Optional-Auth-Middleware.js';
import { getCart, addToCart, removeFromCart, whatsappCheckout } from '../controllers/cartController.js';

const router = Router();

router.get('/',                   optionalAuth, getCart);
router.post('/add',               optionalAuth, addToCart);
router.post('/remove',            optionalAuth, removeFromCart);
router.post('/whatsapp-checkout',              whatsappCheckout);

export default router;
