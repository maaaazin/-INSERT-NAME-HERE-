import express from 'express';
import {
  getTestCases,
  getTestCaseById,
  createTestCase,
  updateTestCase,
  deleteTestCase,
  getTestCasesByAssignment
} from '../controllers/testcases.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// Get test cases by assignment (authenticated - students can see public test cases)
router.get('/assignment/:assignmentId', authenticateToken, getTestCasesByAssignment);

// Get all test cases (teacher only)
router.get('/', authenticateToken, requireRole('teacher'), getTestCases);

// Get test case by ID (authenticated)
router.get('/:testCaseId', authenticateToken, getTestCaseById);

// Create test case (teacher only)
router.post('/', authenticateToken, requireRole('teacher'), createTestCase);

// Update test case (teacher only)
router.put('/:testCaseId', authenticateToken, requireRole('teacher'), updateTestCase);

// Delete test case (teacher only)
router.delete('/:testCaseId', authenticateToken, requireRole('teacher'), deleteTestCase);

export default router;

