import { Router } from 'express';
import authenticate from '../middleware/Cognito-Auth-Middleware.js';
import authorize from '../middleware/Role-Check-Middleware.js';
import { listUsers, assignRole, disableUser, enableUser } from '../controllers/userController.js';

const router = Router();

router.get('/',                    authenticate, authorize('admin'), listUsers);
router.post('/assign-role',        authenticate, authorize('admin'), assignRole);
router.patch('/:username/disable', authenticate, authorize('admin'), disableUser);
router.patch('/:username/enable',  authenticate, authorize('admin'), enableUser);

export default router;
