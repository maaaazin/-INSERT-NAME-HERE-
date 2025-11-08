import express from 'express';
import { handleExecution, handleSubmissionExecution } from '../controllers/execution.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Direct code execution (authenticated users)
router.post('/execute', authenticateToken, handleExecution);

// Execute submission with test cases (authenticated users)
router.post('/execute-submission', authenticateToken, handleSubmissionExecution);

export default router;