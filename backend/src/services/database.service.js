import { supabase } from '../config/supabase.js';

export async function checkSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    const { data, error } = await supabase.from('users').select('*').limit(1);
    
    if (error) {
      console.error('❌ Supabase connection failed:');
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      return false;
    }
    
    console.log('✅ Supabase connection successful!');
    console.log('Connection test passed - can query the database.');
    return true;
  } catch (err) {
    console.error('❌ Supabase connection error:', err.message);
    return false;
  }
}

// Fetch submission by ID
export async function getSubmission(submissionId) {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('id', submissionId)
    .single();

  if (error) throw new Error(`Failed to fetch submission: ${error.message}`);
  return data;
}

// Fetch test cases for a problem
export async function getTestCases(problemId) {
  const { data, error } = await supabase
    .from('test_cases')
    .select('*')
    .eq('problem_id', problemId)
    .order('id', { ascending: true });

  if (error) throw new Error(`Failed to fetch test cases: ${error.message}`);
  return data;
}

// Update submission with results
export async function updateSubmissionResults(submissionId, results) {
  const { data, error } = await supabase
    .from('submissions')
    .update({
      status: results.status,
      passed_tests: results.passedTests,
      total_tests: results.totalTests,
      runtime_ms: results.avgRuntime,
      memory_mb: results.avgMemory,
      grade: results.grade,
      test_results: results.testResults,
      updated_at: new Date().toISOString()
    })
    .eq('id', submissionId)
    .select();

  if (error) throw new Error(`Failed to update submission: ${error.message}`);
  return data;
}