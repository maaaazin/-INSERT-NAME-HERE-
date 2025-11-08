import express from 'express';
import {
  getSubmissions,
  getSubmissionById,
  createSubmission,
  getSubmissionsByAssignment,
  getSubmissionsByStudent,
  executeAndSubmit
} from '../controllers/submissions.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// Get all submissions (teacher only - to view all submissions)
router.get('/', authenticateToken, requireRole('teacher'), getSubmissions);

// Get submissions by assignment (teacher only)
router.get('/assignment/:assignmentId', authenticateToken, requireRole('teacher'), getSubmissionsByAssignment);

// Get submissions by student (student can view their own, teacher can view any)
router.get('/student/:studentId', authenticateToken, getSubmissionsByStudent);

// Get submission by ID (authenticated users)
router.get('/:submissionId', authenticateToken, getSubmissionById);

// Create submission (authenticated users - students submit)
router.post('/', authenticateToken, createSubmission);

// Execute and submit code (authenticated users - students submit)
router.post('/execute', authenticateToken, executeAndSubmit);

export default router;

