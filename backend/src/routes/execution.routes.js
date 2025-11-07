import express from 'express';
import { handleExecution, handleSubmissionExecution } from '../controllers/execution.controller.js';

const router = express.Router();

// Direct code execution
router.post('/execute', handleExecution);

// Execute submission with test cases
router.post('/execute-submission', handleSubmissionExecution);

export default router;