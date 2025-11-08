export class OutputComparator {
  
    /**
     * Compare outputs based on comparison mode
     * @param {string} actualOutput - Output from code execution
     * @param {string} expectedOutput - Expected output from test case
     * @param {string} comparisonMode - Comparison method
     * @param {number} tolerance - Tolerance for numeric comparison
     * @returns {Object} - Comparison result with passed status and details
     */
    static compare(actualOutput, expectedOutput, comparisonMode = 'exact', tolerance = 0) {
      switch (comparisonMode) {
        case 'exact':
          return this.exactMatch(actualOutput, expectedOutput);
        
        case 'whitespace_flexible':
          return this.whitespaceFlexible(actualOutput, expectedOutput);
        
        case 'numeric_tolerance':
          return this.numericTolerance(actualOutput, expectedOutput, tolerance);
        
        case 'line_by_line':
          return this.lineByLine(actualOutput, expectedOutput);
        
        case 'token_based':
          return this.tokenBased(actualOutput, expectedOutput);
        
        case 'array':
          return this.arrayComparison(actualOutput, expectedOutput);
        
        default:
          return this.exactMatch(actualOutput, expectedOutput);
      }
    }
  
    /**
     * Exact string match (after trimming and normalizing line endings)
     */
    static exactMatch(actual, expected) {
      // Normalize line endings (CRLF -> LF) and trim
      const normalize = (str) => str.replace(/\r\n/g, '\n').trim();
      
      const actualTrimmed = normalize(actual);
      const expectedTrimmed = normalize(expected);
      
      return {
        passed: actualTrimmed === expectedTrimmed,
        actual: actualTrimmed,
        expected: expectedTrimmed,
        method: 'exact'
      };
    }
  
    /**
     * Flexible whitespace matching
     * Multiple spaces/tabs treated as single space
     */
    static whitespaceFlexible(actual, expected) {
      const normalizeWhitespace = (str) => {
        return str
          .trim()
          .replace(/\s+/g, ' ')  // Multiple spaces → single space
          .replace(/\n\s+/g, '\n')  // Remove leading spaces on new lines
          .replace(/\s+\n/g, '\n'); // Remove trailing spaces before newlines
      };
      
      const normalizedActual = normalizeWhitespace(actual);
      const normalizedExpected = normalizeWhitespace(expected);
      
      return {
        passed: normalizedActual === normalizedExpected,
        actual: normalizedActual,
        expected: normalizedExpected,
        method: 'whitespace_flexible'
      };
    }
  
    /**
     * Numeric comparison with tolerance
     * For floating point results
     */
    static numericTolerance(actual, expected, tolerance = 1e-6) {
      const actualNum = parseFloat(actual.trim());
      const expectedNum = parseFloat(expected.trim());
      
      if (isNaN(actualNum) || isNaN(expectedNum)) {
        return {
          passed: false,
          actual: actual.trim(),
          expected: expected.trim(),
          error: 'Non-numeric output',
          method: 'numeric_tolerance'
        };
      }
      
      const diff = Math.abs(actualNum - expectedNum);
      const passed = diff <= tolerance;
      
      return {
        passed,
        actual: actualNum.toString(),
        expected: expectedNum.toString(),
        difference: diff,
        tolerance,
        method: 'numeric_tolerance'
      };
    }
  
    /**
     * Line-by-line comparison
     * Each line must match
     */
    static lineByLine(actual, expected) {
      const actualLines = actual.trim().split('\n').map(l => l.trim());
      const expectedLines = expected.trim().split('\n').map(l => l.trim());
      
      if (actualLines.length !== expectedLines.length) {
        return {
          passed: false,
          actual: actualLines,
          expected: expectedLines,
          error: `Line count mismatch: ${actualLines.length} vs ${expectedLines.length}`,
          method: 'line_by_line'
        };
      }
      
      const mismatchedLines = [];
      for (let i = 0; i < actualLines.length; i++) {
        if (actualLines[i] !== expectedLines[i]) {
          mismatchedLines.push({
            lineNumber: i + 1,
            actual: actualLines[i],
            expected: expectedLines[i]
          });
        }
      }
      
      return {
        passed: mismatchedLines.length === 0,
        actual: actualLines.join('\n'),
        expected: expectedLines.join('\n'),
        mismatches: mismatchedLines,
        method: 'line_by_line'
      };
    }
  
    /**
     * Token-based comparison
     * Order matters, but whitespace doesn't
     */
    static tokenBased(actual, expected) {
      const tokenize = (str) => str.trim().split(/\s+/);
      
      const actualTokens = tokenize(actual);
      const expectedTokens = tokenize(expected);
      
      if (actualTokens.length !== expectedTokens.length) {
        return {
          passed: false,
          actual: actualTokens.join(' '),
          expected: expectedTokens.join(' '),
          error: `Token count mismatch: ${actualTokens.length} vs ${expectedTokens.length}`,
          method: 'token_based'
        };
      }
      
      const mismatches = [];
      for (let i = 0; i < actualTokens.length; i++) {
        if (actualTokens[i] !== expectedTokens[i]) {
          mismatches.push({
            position: i + 1,
            actual: actualTokens[i],
            expected: expectedTokens[i]
          });
        }
      }
      
      return {
        passed: mismatches.length === 0,
        actual: actualTokens.join(' '),
        expected: expectedTokens.join(' '),
        mismatches,
        method: 'token_based'
      };
    }
  
    /**
     * Array comparison (for array output problems)
     */
    static arrayComparison(actual, expected) {
      try {
        // Try parsing as JSON first
        let actualArray, expectedArray;
        
        try {
          actualArray = JSON.parse(actual.trim());
          expectedArray = JSON.parse(expected.trim());
        } catch {
          // If JSON parsing fails, try space-separated
          actualArray = actual.trim().split(/\s+/).map(x => {
            const num = Number(x);
            return isNaN(num) ? x : num;
          });
          expectedArray = expected.trim().split(/\s+/).map(x => {
            const num = Number(x);
            return isNaN(num) ? x : num;
          });
        }
        
        if (!Array.isArray(actualArray) || !Array.isArray(expectedArray)) {
          return { 
            passed: false, 
            error: 'Not valid arrays',
            method: 'array'
          };
        }
        
        if (actualArray.length !== expectedArray.length) {
          return {
            passed: false,
            actual: actualArray,
            expected: expectedArray,
            error: `Array length mismatch: ${actualArray.length} vs ${expectedArray.length}`,
            method: 'array'
          };
        }
        
        const passed = JSON.stringify(actualArray) === JSON.stringify(expectedArray);
        
        return {
          passed,
          actual: actualArray,
          expected: expectedArray,
          method: 'array'
        };
      } catch (error) {
        return {
          passed: false,
          error: 'Invalid array format: ' + error.message,
          method: 'array'
        };
      }
    }
  
    /**
     * Multiple line numeric comparison with tolerance
     * For problems with multiple numeric outputs
     */
    static numericLineByLine(actual, expected, tolerance = 1e-6) {
      const actualLines = actual.trim().split('\n');
      const expectedLines = expected.trim().split('\n');
      
      if (actualLines.length !== expectedLines.length) {
        return {
          passed: false,
          error: `Line count mismatch: ${actualLines.length} vs ${expectedLines.length}`,
          method: 'numeric_line_by_line'
        };
      }
      
      const mismatches = [];
      for (let i = 0; i < actualLines.length; i++) {
        const actualNum = parseFloat(actualLines[i].trim());
        const expectedNum = parseFloat(expectedLines[i].trim());
        
        if (isNaN(actualNum) || isNaN(expectedNum)) {
          mismatches.push({
            lineNumber: i + 1,
            error: 'Non-numeric value',
            actual: actualLines[i],
            expected: expectedLines[i]
          });
          continue;
        }
        
        const diff = Math.abs(actualNum - expectedNum);
        if (diff > tolerance) {
          mismatches.push({
            lineNumber: i + 1,
            actual: actualNum,
            expected: expectedNum,
            difference: diff
          });
        }
      }
      
      return {
        passed: mismatches.length === 0,
        actual: actualLines.join('\n'),
        expected: expectedLines.join('\n'),
        mismatches,
        tolerance,
        method: 'numeric_line_by_line'
      };
    }
  }
  