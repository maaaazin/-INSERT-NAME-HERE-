export class InputFormatter {
  
    /**
     * Format input for execution
     * @param {string|Array|Object} input - Raw input data
     * @param {string} inputFormat - Format type (single, multiple, multiline, array, matrix)
     * @returns {string} - Formatted input string ready for stdin
     */
    static format(input, inputFormat) {
      if (!input && input !== 0) return '';
      
      switch (inputFormat) {
        case 'single':
          return this.formatSingle(input);
        
        case 'multiple':
          return this.formatMultiple(input);
        
        case 'multiline':
          return this.formatMultiline(input);
        
        case 'array':
          return this.formatArray(input);
        
        case 'matrix':
          return this.formatMatrix(input);
        
        default:
          return input.toString();
      }
    }
  
    /**
     * Single value input: "5"
     * Example: Just one number or string
     */
    static formatSingle(input) {
      return input.toString().trim();
    }
  
    /**
     * Multiple values on one line: "5 3 7"
     * Example: Space-separated values
     */
    static formatMultiple(input) {
      if (Array.isArray(input)) {
        return input.join(' ');
      }
      return input.toString().trim();
    }
  
    /**
     * Multiple lines: "5\n3\n7"
     * Example: Each value on separate line
     */
    static formatMultiline(input) {
      if (Array.isArray(input)) {
        return input.join('\n');
      }
      return input.toString().trim();
    }
  
    /**
     * Array format: "5\n1 2 3 4 5"
     * First line: size, Second line: elements
     */
    static formatArray(input) {
      if (typeof input === 'string') {
        return input.trim();
      }
      
      if (Array.isArray(input)) {
        return `${input.length}\n${input.join(' ')}`;
      }
      
      if (input.size !== undefined && input.elements !== undefined) {
        return `${input.size}\n${input.elements.join(' ')}`;
      }
      
      return input.toString();
    }
  
    /**
     * Matrix format: "3 3\n1 2 3\n4 5 6\n7 8 9"
     * First line: rows cols, Following lines: matrix rows
     */
    static formatMatrix(input) {
      if (typeof input === 'string') {
        return input.trim();
      }
      
      if (Array.isArray(input) && Array.isArray(input[0])) {
        const rows = input.length;
        const cols = input[0].length;
        const matrixRows = input.map(row => row.join(' ')).join('\n');
        return `${rows} ${cols}\n${matrixRows}`;
      }
      
      if (input.rows && input.cols && input.data) {
        return `${input.rows} ${input.cols}\n${input.data.map(row => row.join(' ')).join('\n')}`;
      }
      
      return input.toString();
    }
  
    /**
     * Validate input format
     */
    static validate(input, inputFormat) {
      try {
        this.format(input, inputFormat);
        return { valid: true };
      } catch (error) {
        return { valid: false, error: error.message };
      }
    }
  
    /**
     * Ensure input ends with newline if multiple inputs expected
     */
    static ensureNewline(input) {
      if (!input) return '';
      const str = input.toString();
      if (str.includes('\n') && !str.endsWith('\n')) {
        return str + '\n';
      }
      return str;
    }
  }
  
  