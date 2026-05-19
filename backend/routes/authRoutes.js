import { Router } from 'express';
import authenticate from '../middleware/Cognito-Auth-Middleware.js';
import { syncUser, completeProfile } from '../controllers/authController.js';
import { authLimiter } from '../middleware/Rate-Limiting.js';

const router = Router();

router.post('/sync',            authLimiter, authenticate, syncUser);
router.put('/complete-profile', authenticate, completeProfile);

export default router;
