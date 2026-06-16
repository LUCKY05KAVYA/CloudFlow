import express from 'express';
import { getTasks, createTask, completeTask, getMetrics } from '../controllers/task.controller';
import multer from 'multer';
import path from 'path';
import {requireRole,} from '../middleware/role.middleware';
import {
  authMiddleware,
} from '../middleware/auth.middleware';

const router = express.Router();

const storage = multer.diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

router.get('/', getTasks);
router.post('/', upload.single('file'), createTask);
router.put(
  '/:id/complete',

  authMiddleware,

  requireRole([
    'MANAGER',
    'ADMIN',
  ]),
router.get('/metrics', getMetrics));

export default router;