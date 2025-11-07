import { GRADING_THRESHOLDS } from '../config/constants.js';

export function calculateGrade(avgRuntime, avgMemory, passedTests, totalTests) {
  // If not all tests passed, grade is based on pass rate
  const passRate = passedTests / totalTests;
  
  if (passRate < 0.5) return 'F';
  if (passRate < 0.7) return 'D';
  if (passRate < 0.85) return 'C';
  
  // If all tests passed, grade based on performance
  if (passRate === 1) {
    const runtimeGrade = getRuntimeGrade(avgRuntime);
    const memoryGrade = getMemoryGrade(avgMemory);
    
    // Average the two grades
    return averageGrades(runtimeGrade, memoryGrade);
  }
  
  return 'B'; // 85-99% pass rate
}

function getRuntimeGrade(runtime) {
  const thresholds = GRADING_THRESHOLDS.runtime;
  
  if (runtime < thresholds.excellent) return 'A+';
  if (runtime < thresholds.good) return 'A';
  if (runtime < thresholds.average) return 'B';
  if (runtime < thresholds.belowAverage) return 'C';
  return 'D';
}

function getMemoryGrade(memory) {
  const thresholds = GRADING_THRESHOLDS.memory;
  
  if (memory < thresholds.excellent) return 'A+';
  if (memory < thresholds.good) return 'A';
  if (memory < thresholds.average) return 'B';
  if (memory < thresholds.belowAverage) return 'C';
  return 'D';
}

function averageGrades(grade1, grade2) {
  const gradeValues = {
    'A+': 4.3,
    'A': 4.0,
    'B': 3.0,
    'C': 2.0,
    'D': 1.0,
    'F': 0.0
  };
  
  const avg = (gradeValues[grade1] + gradeValues[grade2]) / 2;
  
  if (avg >= 4.15) return 'A+';
  if (avg >= 3.5) return 'A';
  if (avg >= 2.5) return 'B';
  if (avg >= 1.5) return 'C';
  if (avg >= 0.5) return 'D';
  return 'F';
}
