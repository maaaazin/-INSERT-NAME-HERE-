import { supabase } from '../config/supabase.js';
import { checkPlagiarism, findPlagiarismPairs } from '../services/plagiarism.service.js';

/**
 * Check plagiarism between two specific submissions
 */
export async function checkPlagiarismBetweenSubmissions(req, res) {
  try {
    const { submissionId1, submissionId2 } = req.params;

    if (!submissionId1 || !submissionId2) {
      return res.status(400).json({ error: 'Both submission IDs are required' });
    }

    // Fetch both submissions
    const { data: submission1, error: error1 } = await supabase
      .from('submissions')
      .select(`
        *,
        students:student_id (
          student_id,
          roll_no,
          users:user_id (
            name,
            email
          )
        ),
        assignments:assignment_id (
          language
        )
      `)
      .eq('submission_id', submissionId1)
      .single();

    if (error1 || !submission1) {
      return res.status(404).json({ error: 'Submission 1 not found' });
    }

    const { data: submission2, error: error2 } = await supabase
      .from('submissions')
      .select(`
        *,
        students:student_id (
          student_id,
          roll_no,
          users:user_id (
            name,
            email
          )
        ),
        assignments:assignment_id (
          language
        )
      `)
      .eq('submission_id', submissionId2)
      .single();

    if (error2 || !submission2) {
      return res.status(404).json({ error: 'Submission 2 not found' });
    }

    // Check if they're from the same assignment
    if (submission1.assignment_id !== submission2.assignment_id) {
      return res.status(400).json({ error: 'Submissions must be from the same assignment' });
    }

    // Get language from assignment - handle both object and array formats
    const assignment1 = Array.isArray(submission1.assignments) 
      ? submission1.assignments[0] 
      : submission1.assignments;
    const language = assignment1?.language || submission1.language || 'python';
    const result = checkPlagiarism(submission1.code, submission2.code, language);

    res.json({
      ...result,
      submission1: {
        submission_id: submission1.submission_id,
        student_name: submission1.students?.users?.name || 'Unknown',
        student_email: submission1.students?.users?.email || 'Unknown',
        roll_no: submission1.students?.roll_no || 'N/A',
        submitted_at: submission1.submitted_at,
      },
      submission2: {
        submission_id: submission2.submission_id,
        student_name: submission2.students?.users?.name || 'Unknown',
        student_email: submission2.students?.users?.email || 'Unknown',
        roll_no: submission2.students?.roll_no || 'N/A',
        submitted_at: submission2.submitted_at,
      },
    });
  } catch (error) {
    console.error('Error checking plagiarism:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Find all plagiarism pairs in an assignment
 */
export async function findPlagiarismInAssignment(req, res) {
  try {
    const { assignmentId } = req.params;
    const { threshold = 80 } = req.query;

    // Fetch all submissions for this assignment
    const { data: submissions, error } = await supabase
      .from('submissions')
      .select(`
        submission_id,
        student_id,
        code,
        submitted_at,
        students:student_id (
          student_id,
          roll_no,
          users:user_id (
            name,
            email
          )
        ),
        assignments:assignment_id (
          language
        )
      `)
      .eq('assignment_id', assignmentId);

    if (error) throw error;

    if (!submissions || submissions.length < 2) {
      return res.json({
        pairs: [],
        message: 'Need at least 2 submissions to check for plagiarism',
      });
    }

    // Get language from assignment - handle both object and array formats
    const firstAssignment = Array.isArray(submissions[0]?.assignments)
      ? submissions[0].assignments[0]
      : submissions[0]?.assignments;
    const language = firstAssignment?.language || submissions[0]?.language || 'python';

    // Prepare submissions for comparison
    const submissionsForCheck = submissions.map((sub) => ({
      submission_id: sub.submission_id,
      student_id: sub.student_id,
      code: sub.code,
      submitted_at: sub.submitted_at,
      student_name: sub.students?.users?.name || 'Unknown',
    }));

    const pairs = findPlagiarismPairs(submissionsForCheck, language, parseInt(threshold));

    res.json({
      assignment_id: assignmentId,
      total_submissions: submissions.length,
      pairs_found: pairs.length,
      threshold: parseInt(threshold),
      pairs,
    });
  } catch (error) {
    console.error('Error finding plagiarism:', error);
    res.status(500).json({ error: error.message });
  }
}

