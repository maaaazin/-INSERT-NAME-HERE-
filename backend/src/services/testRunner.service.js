import { executeCode } from './piston.service.js';
import { getTestCases } from './database.service.js';
import { calculateGrade } from './grading.service.js';

export async function runTestCases(code, language, assignmentId) {
  // Fetch test cases from database
  const testCases = await getTestCases(assignmentId);
  
  if (!testCases || testCases.length === 0) {
    throw new Error('No test cases found for this assignment');
  }

  const results = [];
  let totalRuntime = 0;
  let totalMemory = 0;
  let passedTests = 0;

  // Run each test case
  for (const testCase of testCases) {
    try {
      const result = await executeCode(code, language, testCase.input_data);
      
      const passed = result.output.trim() === testCase.expected_output.trim() && result.exitCode === 0;
      
      if (passed) passedTests++;
      
      totalRuntime += result.runtime;
      totalMemory += result.memory;

      results.push({
        testCaseId: testCase.test_case_id,
        input: testCase.input_data,
        expectedOutput: testCase.expected_output,
        actualOutput: result.output,
        error: result.error,
        passed: passed,
        runtime: result.runtime,
        memory: result.memory
      });

    } catch (error) {
      results.push({
        testCaseId: testCase.test_case_id,
        input: testCase.input_data,
        expectedOutput: testCase.expected_output,
        actualOutput: '',
        error: error.message,
        passed: false,
        runtime: 0,
        memory: 0
      });
    }
  }

  const avgRuntime = totalRuntime / testCases.length;
  const avgMemory = totalMemory / testCases.length;

  return {
    status: passedTests === testCases.length ? 'accepted' : 'failed',
    passedTests,
    totalTests: testCases.length,
    avgRuntime: Math.round(avgRuntime * 100) / 100,
    avgMemory: Math.round(avgMemory * 100) / 100,
    testResults: results
  };
}
