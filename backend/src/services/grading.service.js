import { GRADING_THRESHOLDS } from '../config/constants.js';

/**
 * Calculate percentage score based on test case results and performance
 * @param {number} avgRuntime - Average runtime in milliseconds
 * @param {number} avgMemory - Average memory usage in MB
 * @param {number} passedTests - Number of passed test cases
 * @param {number} totalTests - Total number of test cases
 * @param {number} maxScore - Maximum possible score (default 100)
 * @returns {number} Percentage score (0-100)
 */
export function calculateGrade(avgRuntime, avgMemory, passedTests, totalTests, maxScore = 100) {
  if (totalTests === 0) return 0;
  
  // Base score: percentage of tests passed
  const passRate = passedTests / totalTests;
  let baseScore = passRate * maxScore;
  
  // If all tests passed, apply performance bonuses/penalties
  if (passRate === 1) {
    const performanceBonus = calculatePerformanceBonus(avgRuntime, avgMemory, maxScore);
    baseScore = Math.min(maxScore, baseScore + performanceBonus);
  }
  
  // Round to 2 decimal places
  return Math.round(baseScore * 100) / 100;
}

/**
 * Calculate performance bonus based on runtime and memory
 * Excellent performance gets small bonus, poor performance gets penalty
 * @param {number} avgRuntime - Average runtime in milliseconds
 * @param {number} avgMemory - Average memory usage in MB
 * @param {number} maxScore - Maximum possible score
 * @returns {number} Bonus/penalty percentage points (-5 to +5)
 */
function calculatePerformanceBonus(avgRuntime, avgMemory, maxScore) {
  const thresholds = GRADING_THRESHOLDS;
  let bonus = 0;
  
  // Runtime bonus/penalty (max ±2.5%)
  if (avgRuntime < thresholds.runtime.excellent) {
    bonus += 2.5; // Excellent runtime
  } else if (avgRuntime < thresholds.runtime.good) {
    bonus += 1.5; // Good runtime
  } else if (avgRuntime < thresholds.runtime.average) {
    bonus += 0; // Average runtime
  } else if (avgRuntime < thresholds.runtime.belowAverage) {
    bonus -= 1; // Below average runtime
  } else {
    bonus -= 2.5; // Poor runtime
  }
  
  // Memory bonus/penalty (max ±2.5%)
  if (avgMemory < thresholds.memory.excellent) {
    bonus += 2.5; // Excellent memory
  } else if (avgMemory < thresholds.memory.good) {
    bonus += 1.5; // Good memory
  } else if (avgMemory < thresholds.memory.average) {
    bonus += 0; // Average memory
  } else if (avgMemory < thresholds.memory.belowAverage) {
    bonus -= 1; // Below average memory
  } else {
    bonus -= 2.5; // Poor memory
  }
  
  // Cap bonus/penalty between -5% and +5%
  return Math.max(-5, Math.min(5, bonus));
}
