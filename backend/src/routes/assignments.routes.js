import express from 'express';
import {
  getAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignmentsByBatch,
  getAssignmentsByInstructor
} from '../controllers/assignments.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// Get all assignments (public - students and teachers can view)
router.get('/', authenticateToken, getAssignments);

// Get assignments by batch (public)
router.get('/batch/:batchId', authenticateToken, getAssignmentsByBatch);

// Get assignments by instructor (public)
router.get('/instructor/:instructorId', authenticateToken, getAssignmentsByInstructor);

// Get assignment by ID (public)
router.get('/:assignmentId', authenticateToken, getAssignmentById);

// Create assignment (teacher only)
router.post('/', authenticateToken, requireRole('teacher'), createAssignment);

// Update assignment (teacher only)
router.put('/:assignmentId', authenticateToken, requireRole('teacher'), updateAssignment);

// Delete assignment (teacher only)
router.delete('/:assignmentId', authenticateToken, requireRole('teacher'), deleteAssignment);

export default router;

