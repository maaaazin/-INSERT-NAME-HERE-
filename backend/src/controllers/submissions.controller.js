import { supabase } from '../config/supabase.js';
import { executeCode } from '../services/piston.service.js';
import { runTestCases } from '../services/testRunner.service.js';
import { calculateGrade } from '../services/grading.service.js';
import { submissionQueue } from '../services/queue.service.js';

// Get all submissions
export async function getSubmissions(req, res) {
  try {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
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
      .select('*')
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

    // Fetch test results for each submission
    const submissionIds = data?.map(s => s.submission_id) || [];
    let testResultsMap = {};
    
    if (submissionIds.length > 0) {
      const { data: testResults, error: testResultsError } = await supabase
        .from('test_results')
        .select('*')
        .in('submission_id', submissionIds)
        .order('test_case_id', { ascending: true });

      if (!testResultsError && testResults) {
        // Group test results by submission_id
        testResults.forEach(tr => {
          if (!testResultsMap[tr.submission_id]) {
            testResultsMap[tr.submission_id] = [];
          }
          testResultsMap[tr.submission_id].push(tr);
        });
      }
    }

    // Calculate average scores per assignment
    const assignmentSubmissions = new Map();
    data?.forEach(sub => {
      const assignmentId = sub.assignment_id;
      if (!assignmentSubmissions.has(assignmentId)) {
        assignmentSubmissions.set(assignmentId, []);
      }
      assignmentSubmissions.get(assignmentId).push(sub);
    });

    // Calculate averages
    const assignmentAverages = new Map();
    assignmentSubmissions.forEach((subs, assignmentId) => {
      const gradedSubs = subs.filter(s => s.status === 'graded' && s.score !== null);
      if (gradedSubs.length > 0) {
        const totalScore = gradedSubs.reduce((sum, s) => sum + (s.score || 0), 0);
        const maxScore = gradedSubs[0].max_score || 100;
        const avgScore = Math.round(totalScore / gradedSubs.length);
        const avgPercentage = Math.round((avgScore / maxScore) * 100);
        assignmentAverages.set(assignmentId, {
          averageScore: avgPercentage,
          totalSubmissions: gradedSubs.length,
          latestSubmission: subs.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))[0]
        });
      }
    });

    // Add average info and test results to each submission
    const enrichedData = data?.map(sub => ({
      ...sub,
      assignmentAverage: assignmentAverages.get(sub.assignment_id)?.averagePercentage || null,
      totalSubmissionsForAssignment: assignmentAverages.get(sub.assignment_id)?.totalSubmissions || 1,
      testResults: testResultsMap[sub.submission_id] || []
    }));

    res.json(enrichedData || data);
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

// Execute and submit code (with queue support)
export async function executeAndSubmit(req, res) {
  try {
    const { assignment_id, student_id, code, language, runOnly, useQueue = true } = req.body;

    if (!assignment_id || !code || !language) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // If runOnly, just execute without saving (no queue needed)
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

    // Check deadline and resubmission limit if student_id is provided
    if (student_id) {
      const { data: assignmentWithDeadline, error: deadlineError } = await supabase
        .from('assignments')
        .select('due_date, status')
        .eq('assignment_id', assignment_id)
        .single();

      if (deadlineError) throw deadlineError;

      // Check if assignment is active and deadline hasn't passed
      if (assignmentWithDeadline.status !== 'active') {
        return res.status(400).json({ error: 'Assignment is not active' });
      }

      const dueDate = new Date(assignmentWithDeadline.due_date);
      const now = new Date();
      
      if (now > dueDate) {
        return res.status(400).json({ 
          error: 'Assignment deadline has passed. Resubmissions are no longer allowed.' 
        });
      }

      // Check resubmission limit (max 3 submissions per assignment)
      const { data: existingSubmissions, error: countError } = await supabase
        .from('submissions')
        .select('submission_id')
        .eq('assignment_id', assignment_id)
        .eq('student_id', student_id);

      if (countError) throw countError;

      const submissionCount = existingSubmissions?.length || 0;
      const MAX_SUBMISSIONS = 3;

      if (submissionCount >= MAX_SUBMISSIONS) {
        return res.status(400).json({ 
          error: `Maximum resubmission limit reached. You have already submitted ${submissionCount} time(s). Maximum allowed: ${MAX_SUBMISSIONS} submissions per assignment.` 
        });
      }
    }

    const maxScore = assignment.max_score || 100;

    // Create submission record first (with pending status)
    let submission;
    if (student_id) {
      const { data, error } = await supabase
        .from('submissions')
        .insert({
          assignment_id,
          student_id,
          code,
          language,
          score: 0,
          max_score: maxScore,
          status: 'pending', // Will be updated by worker
          avg_execution_time: null
        })
        .select()
        .single();

      if (error) throw error;
      submission = data;

      // Use queue for async processing (only if explicitly enabled)
      // Default to synchronous mode for backward compatibility with frontend
      if (useQueue === true && process.env.USE_QUEUE === 'true') {
        try {
          // Add job to queue
          const job = await submissionQueue.add({
            submission_id: submission.submission_id,
            assignment_id,
            code,
            language,
            student_id,
            max_score: maxScore,
          }, {
            priority: 1, // Normal priority
            jobId: `submission-${submission.submission_id}`, // Unique job ID
          });

          // Return immediately with job info (frontend can poll for status)
          return res.json({
            submission,
            jobId: job.id,
            status: 'queued',
            message: 'Submission queued for processing. Check status later.',
            queuePosition: await submissionQueue.getJobCounts(),
            // Include submission_id for frontend to poll status
            submission_id: submission.submission_id,
          });
        } catch (queueError) {
          console.error('Queue error, falling back to synchronous processing:', queueError);
          // Fall through to synchronous processing if queue fails
        }
      }
    }

    // Synchronous processing (fallback or for testing)
    // Run test cases
    const testResults = await runTestCases(code, language, assignment_id);

    // Calculate percentage score based on test results and performance
    const score = calculateGrade(
      testResults.avgRuntime,
      testResults.avgMemory,
      testResults.passedTests,
      testResults.totalTests,
      maxScore
    );
    
    // Ensure score is between 0 and maxScore
    const finalScore = Math.max(0, Math.min(maxScore, Math.round(score)));

    if (student_id && submission) {
      // Update submission
      const { data: updatedSubmission, error: updateError } = await supabase
        .from('submissions')
        .update({
          score: finalScore,
          max_score: maxScore,
          status: testResults.status === 'accepted' ? 'graded' : 'error',
          avg_execution_time: testResults.avgRuntime,
          graded_at: new Date().toISOString()
        })
        .eq('submission_id', submission.submission_id)
        .select()
        .single();

      if (updateError) throw updateError;
      submission = updatedSubmission;

      // Delete old test results before inserting new ones
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
                memory_used: Math.round(testResult.memory || 0),
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

      // Calculate average score from all submissions for this assignment
      const { data: allSubmissions, error: avgError } = await supabase
        .from('submissions')
        .select('score, max_score')
        .eq('assignment_id', assignment_id)
        .eq('student_id', student_id)
        .eq('status', 'graded');

      if (avgError) throw avgError;

      let averageScore = finalScore;
      let averagePercentage = Math.round((finalScore / maxScore) * 100);
      
      if (allSubmissions && allSubmissions.length > 0) {
        const totalScore = allSubmissions.reduce((sum, s) => sum + (s.score || 0), 0);
        averageScore = Math.round(totalScore / allSubmissions.length);
        averagePercentage = Math.round((averageScore / maxScore) * 100);
      }

      res.json({
        submission,
        testResults,
        score: finalScore,
        maxScore: maxScore,
        percentage: Math.round((finalScore / maxScore) * 100),
        status: testResults.status,
        averageScore: averageScore,
        averagePercentage: averagePercentage,
        totalSubmissions: allSubmissions?.length || 1,
        message: allSubmissions && allSubmissions.length > 1 
          ? `Resubmission successful! Average score: ${averagePercentage}% (from ${allSubmissions.length} submissions)`
          : 'Submission successful!'
      });
    } else {
      // No student_id (just testing)
      res.json({
        submission: null,
        testResults,
        score: finalScore,
        maxScore: maxScore,
        percentage: Math.round((finalScore / maxScore) * 100),
        status: testResults.status
      });
    }
  } catch (error) {
    console.error('Error executing and submitting:', error);
    res.status(500).json({ error: error.message });
  }
}

// Get submission status (for queue-based submissions)
export async function getSubmissionStatus(req, res) {
  try {
    const { submissionId } = req.params;
    
    // Get submission from database
    const { data: submission, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('submission_id', submissionId)
      .single();

    if (error) throw error;
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Check if job exists in queue
    const job = await submissionQueue.getJob(`submission-${submissionId}`);
    
    let queueStatus = null;
    if (job) {
      const state = await job.getState();
      queueStatus = {
        jobId: job.id,
        state,
        progress: job.progress,
        attemptsMade: job.attemptsMade,
      };
    }

    res.json({
      submission,
      queueStatus,
    });
  } catch (error) {
    console.error('Error getting submission status:', error);
    res.status(500).json({ error: error.message });
  }
}
