import { supabase } from '../config/supabase.js';
import { runTestCases } from '../services/testRunner.service.js';
import { executeCode } from '../services/piston.service.js';
import { calculateGrade } from '../services/grading.service.js';

// Get all submissions
export async function getSubmissions(req, res) {
  try {
    const { data, error } = await supabase
      .from('submissions')
      .select(`
        *,
        assignments:assignment_id (
          assignment_id,
          title,
          language
        ),
        students:student_id (
          student_id,
          roll_no,
          users:user_id (
            user_id,
            name,
            email
          )
        )
      `)
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ error: error.message });
  }
}

// Get submission by ID
export async function getSubmissionById(req, res) {
  try {
    const { submissionId } = req.params;
    
    const { data, error } = await supabase
      .from('submissions')
      .select(`
        *,
        assignments:assignment_id (
          assignment_id,
          title,
          description,
          language
        ),
        students:student_id (
          student_id,
          roll_no,
          users:user_id (
            user_id,
            name,
            email
          )
        )
      `)
      .eq('submission_id', submissionId)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    res.json(data);
  } catch (error) {
    console.error('Error fetching submission:', error);
    res.status(500).json({ error: error.message });
  }
}

// Get submissions by assignment
export async function getSubmissionsByAssignment(req, res) {
  try {
    const { assignmentId } = req.params;
    
    const { data, error } = await supabase
      .from('submissions')
      .select(`
        *,
        students:student_id (
          student_id,
          roll_no,
          users:user_id (
            user_id,
            name,
            email
          )
        )
      `)
      .eq('assignment_id', assignmentId)
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching submissions by assignment:', error);
    res.status(500).json({ error: error.message });
  }
}

// Get submissions by student
export async function getSubmissionsByStudent(req, res) {
  try {
    const { studentId } = req.params;
    
    const { data, error } = await supabase
      .from('submissions')
      .select(`
        *,
        assignments:assignment_id (
          assignment_id,
          title,
          language,
          due_date
        )
      `)
      .eq('student_id', studentId)
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching submissions by student:', error);
    res.status(500).json({ error: error.message });
  }
}

// Create submission
export async function createSubmission(req, res) {
  try {
    const { assignment_id, student_id, code, language } = req.body;

    if (!assignment_id || !student_id || !code || !language) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get assignment to get max_score
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .select('max_score')
      .eq('assignment_id', assignment_id)
      .single();

    if (assignmentError) throw assignmentError;

    const { data, error } = await supabase
      .from('submissions')
      .insert({
        assignment_id,
        student_id,
        code,
        language,
        status: 'pending',
        max_score: assignment?.max_score || 100
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating submission:', error);
    res.status(500).json({ error: error.message });
  }
}

// Execute and submit code
export async function executeAndSubmit(req, res) {
  try {
    const { assignment_id, student_id, code, language, runOnly } = req.body;

    if (!assignment_id || !code || !language) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // If runOnly, just execute without saving
    if (runOnly) {
      const result = await executeCode(code, language, '');
      return res.json({
        output: result.output,
        error: result.error,
        runtime: result.runtime,
        memory: result.memory
      });
    }

    // Get assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .select('max_score, assignment_id')
      .eq('assignment_id', assignment_id)
      .single();

    if (assignmentError) throw assignmentError;

    // Run test cases
    const testResults = await runTestCases(code, language, assignment_id);

    // Calculate percentage score based on test results and performance
    const maxScore = assignment.max_score || 100;
    const score = calculateGrade(
      testResults.avgRuntime,
      testResults.avgMemory,
      testResults.passedTests,
      testResults.totalTests,
      maxScore
    );
    
    // Ensure score is between 0 and maxScore
    const finalScore = Math.max(0, Math.min(maxScore, Math.round(score)));

    // Create or update submission
    let submission;
    if (student_id) {
      // Check if submission exists
      const { data: existing } = await supabase
        .from('submissions')
        .select('submission_id')
        .eq('assignment_id', assignment_id)
        .eq('student_id', student_id)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .single();

      if (existing) {
        // Update existing submission
        const { data, error } = await supabase
          .from('submissions')
          .update({
            code,
            language,
            score: finalScore,
            max_score: maxScore,
            status: testResults.status === 'accepted' ? 'graded' : 'error',
            avg_execution_time: testResults.avgRuntime,
            graded_at: new Date().toISOString()
          })
          .eq('submission_id', existing.submission_id)
          .select()
          .single();

        if (error) throw error;
        submission = data;
      } else {
        // Create new submission
        const { data, error } = await supabase
          .from('submissions')
          .insert({
            assignment_id,
            student_id,
            code,
            language,
            score: finalScore,
            max_score: maxScore,
            status: testResults.status === 'accepted' ? 'graded' : 'error',
            avg_execution_time: testResults.avgRuntime
          })
          .select()
          .single();

        if (error) throw error;
        submission = data;
      }

      // Delete old test results before inserting new ones (to prevent duplicates)
      await supabase
        .from('test_results')
        .delete()
        .eq('submission_id', submission.submission_id);

      // Save test results
      const { data: testCases, error: testCasesError } = await supabase
        .from('test_cases')
        .select('test_case_id')
        .eq('assignment_id', assignment_id);

      if (testCasesError) throw testCasesError;

      if (testCases && testCases.length > 0) {
        const testResultsToInsert = testResults.testResults
          .map(testResult => {
            const testCase = testCases.find(tc => tc.test_case_id === testResult.testCaseId);
            if (testCase) {
              return {
                submission_id: submission.submission_id,
                test_case_id: testCase.test_case_id,
                passed: testResult.passed,
                actual_output: testResult.actualOutput,
                execution_time: testResult.runtime,
                memory_used: testResult.memory,
                error_message: testResult.error,
                status: testResult.passed ? 'Accepted' : 'Wrong Answer'
              };
            }
            return null;
          })
          .filter(result => result !== null);

        if (testResultsToInsert.length > 0) {
          const { error: insertError } = await supabase
            .from('test_results')
            .insert(testResultsToInsert);

          if (insertError) throw insertError;
        }
      }
    }

    res.json({
      submission,
      testResults,
      score: finalScore,
      maxScore: maxScore,
      percentage: Math.round((finalScore / maxScore) * 100),
      status: testResults.status
    });
  } catch (error) {
    console.error('Error executing and submitting:', error);
    res.status(500).json({ error: error.message });
  }
}

