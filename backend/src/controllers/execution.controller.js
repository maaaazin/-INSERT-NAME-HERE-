import { executeCode } from '../services/piston.service.js';
import { validateExecutionRequest, validateSubmissionRequest } from '../utils/validation.js';
import { getSubmission, updateSubmissionResults } from '../services/database.service.js';
import { runTestCases } from '../services/testRunner.service.js';

// Direct code execution (original endpoint)
export async function handleExecution(req, res) {
  try {
    const validation = validateExecutionRequest(req);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error });
    }

    const { code, language, stdin = '' } = req.body;
    const result = await executeCode(code, language, stdin);

    res.json(result);

  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({
      error: 'Execution failed',
      message: error.message
    });
  }
}

// Execute submission with test cases
export async function handleSubmissionExecution(req, res) {
  try {
    const validation = validateSubmissionRequest(req);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error });
    }

    const { submissionId } = req.body;

    // Fetch submission from database
    const submission = await getSubmission(submissionId);

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Run test cases
    const results = await runTestCases(
      submission.code,
      submission.language,
      submission.problem_id
    );

    // Update submission in database
    await updateSubmissionResults(submissionId, results);

    res.json({
      submissionId,
      ...results
    });

  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({
      error: 'Submission execution failed',
      message: error.message
    });
  }
}
