export const PISTON_URL = 'http://localhost:2000';

export const LANGUAGE_MAP = {
  'python': { language: 'python', version: '3.12.0' },
  'javascript': { language: 'javascript', version: '20.11.1' },
  'cpp': { language: 'c++', version: '10.2.0' },
  'java': { language: 'java', version: '15.0.2' },
  'c': { language: 'c', version: '10.2.0' }
};

export const FILE_NAMES = {
  'python': 'main.py',
  'javascript': 'main.js',
  'cpp': 'main.cpp',
  'java': 'Main.java',
  'c': 'main.c'
};

export const GRADING_THRESHOLDS = {
    runtime: {
      excellent: 200,    // < 100ms = A+
      good: 500,         // < 500ms = A
      average: 1000,     // < 1000ms = B
      belowAverage: 2000 // < 2000ms = C
      // > 2000ms = D
    },
    memory: {
      excellent: 10,     // < 10MB = A+
      good: 50,          // < 50MB = A
      average: 100,      // < 100MB = B
      belowAverage: 200  // < 200MB = C
      // > 200MB = D
    }
  };
  