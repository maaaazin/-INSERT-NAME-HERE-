import express from 'express';
import {
  checkPlagiarismBetweenSubmissions,
  findPlagiarismInAssignment,
} from '../controllers/plagiarism.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// Check plagiarism between two specific submissions (teacher only)
router.get(
  '/compare/:submissionId1/:submissionId2',
  authenticateToken,
  requireRole('teacher'),
  checkPlagiarismBetweenSubmissions
);

// Find all plagiarism pairs in an assignment (teacher only)
router.get(
  '/assignment/:assignmentId',
  authenticateToken,
  requireRole('teacher'),
  findPlagiarismInAssignment
);

export default router;

