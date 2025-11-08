import express from 'express';
import {
  getTeacherDashboardStats,
  getStudentDashboardStats,
  getAssignmentStats,
  getLeaderboard
} from '../controllers/stats.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Get teacher dashboard stats (teacher only)
router.get('/teacher/:instructorId', authenticateToken, getTeacherDashboardStats);

// Get student dashboard stats (student can view their own)
router.get('/student/:studentId', authenticateToken, getStudentDashboardStats);

// Get assignment stats (authenticated)
router.get('/assignment/:assignmentId', authenticateToken, getAssignmentStats);

// Get leaderboard (authenticated - batchId is optional via query param)
router.get('/leaderboard', authenticateToken, getLeaderboard);
router.get('/leaderboard/:batchId', authenticateToken, getLeaderboard);

export default router;

