import { Router } from 'express';
import multer from 'multer';
import authenticate from '../middleware/Cognito-Auth-Middleware.js';
import authorize from '../middleware/Role-Check-Middleware.js';
import { uploadImage } from '../controllers/uploadController.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

router.post(
  '/',
  upload.single('file'),
  uploadImage
);

export default router;
