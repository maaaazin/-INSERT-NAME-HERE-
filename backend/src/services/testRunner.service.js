import { executeCode } from './piston.service.js';
import { getTestCases } from './database.service.js';
import { InputFormatter } from './inputFormatter.service.js';
import { OutputComparator } from './outputComparator.service.js';

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
      // Format input based on input_format (default to 'single' if not specified)
      const inputFormat = testCase.input_format || 'single';
      const formattedInput = InputFormatter.format(testCase.input_data, inputFormat);
      
      // Execute code with formatted input
      const result = await executeCode(code, language, formattedInput);
      
      // Compare outputs based on comparison_mode (default to 'exact' if not specified)
      const comparisonMode = testCase.comparison_mode || 'exact';
      const tolerance = testCase.tolerance || 0;
      
      const comparison = OutputComparator.compare(
        result.output,
        testCase.expected_output,
        comparisonMode,
        tolerance
      );
      
      // Test passes if comparison passes AND exit code is 0
      const passed = comparison.passed && result.exitCode === 0;
      
      if (passed) passedTests++;
      
      totalRuntime += result.runtime;
      totalMemory += result.memory;

      results.push({
        testCaseId: testCase.test_case_id,
        input: testCase.input_data,
        formattedInput: formattedInput,
        expectedOutput: testCase.expected_output,
        actualOutput: result.output,
        error: result.error,
        passed: passed,
        runtime: result.runtime,
        memory: result.memory,
        comparisonDetails: {
          method: comparison.method,
          passed: comparison.passed,
          ...(comparison.mismatches && { mismatches: comparison.mismatches }),
          ...(comparison.difference !== undefined && { difference: comparison.difference }),
          ...(comparison.tolerance !== undefined && { tolerance: comparison.tolerance })
        }
      });

    } catch (error) {
      results.push({
        testCaseId: testCase.test_case_id,
        input: testCase.input_data,
        expectedOutput: testCase.expected_output,
        actualOutput: '',
        error: error.message || 'Execution failed',
        passed: false,
        runtime: 0,
        memory: 0,
        comparisonDetails: {
          method: 'error',
          passed: false,
          error: error.message
        }
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
