import express from 'express';
import {
  getBatches,
  getBatchById,
  getBatchesByInstructor,
  createBatch
} from '../controllers/batches.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// Create batch (teacher only - must be before parameterized routes)
router.post('/', authenticateToken, requireRole('teacher'), createBatch);

// Get batches by instructor (authenticated)
router.get('/instructor/:instructorId', authenticateToken, getBatchesByInstructor);

// Get all batches (authenticated)
router.get('/', authenticateToken, getBatches);

// Get batch by ID (authenticated - must be last)
router.get('/:batchId', authenticateToken, getBatchById);

export default router;
