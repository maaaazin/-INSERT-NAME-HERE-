/**
 * Plagiarism Detection Service
 * Simple plagiarism checker using code normalization and similarity comparison
 */

/**
 * Normalize code for comparison
 * - Remove comments (single-line and multi-line)
 * - Remove extra whitespace
 * - Normalize variable names (optional - can be enabled for stricter checking)
 * - Convert to lowercase
 */
function normalizeCode(code, language) {
  if (!code) return '';

  let normalized = code;

  // Remove single-line comments
  if (language === 'python' || language === 'javascript') {
    normalized = normalized.replace(/\/\/.*$/gm, ''); // JavaScript style
    normalized = normalized.replace(/#.*$/gm, ''); // Python style
  }

  // Remove multi-line comments
  normalized = normalized.replace(/\/\*[\s\S]*?\*\//g, '');
  normalized = normalized.replace(/""".*?"""/gs, ''); // Python docstrings
  normalized = normalized.replace(/'''.*?'''/gs, ''); // Python docstrings

  // Remove extra whitespace and newlines
  normalized = normalized.replace(/\s+/g, ' ').trim();

  // Convert to lowercase for case-insensitive comparison
  normalized = normalized.toLowerCase();

  return normalized;
}

/**
 * Calculate similarity between two code strings using Levenshtein distance
 * Returns a percentage (0-100)
 */
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 100;

  const len1 = str1.length;
  const len2 = str2.length;

  // Create a matrix for dynamic programming
  const matrix = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0));

  // Initialize first row and column
  for (let i = 0; i <= len1; i++) {
    matrix[i][0] = i;
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill the matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // deletion
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j - 1] + 1 // substitution
        );
      }
    }
  }

  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  const similarity = ((maxLen - distance) / maxLen) * 100;

  return Math.round(similarity * 100) / 100;
}

/**
 * Compare two code submissions for plagiarism
 * @param {string} code1 - First submission code
 * @param {string} code2 - Second submission code
 * @param {string} language - Programming language
 * @returns {Object} Comparison result with similarity percentage and details
 */
export function checkPlagiarism(code1, code2, language = 'python') {
  if (!code1 || !code2) {
    return {
      similarity: 0,
      isPlagiarized: false,
      message: 'One or both submissions are empty',
    };
  }

  // Normalize both codes
  const normalized1 = normalizeCode(code1, language);
  const normalized2 = normalizeCode(code2, language);

  // Calculate similarity
  const similarity = calculateSimilarity(normalized1, normalized2);

  // Threshold for plagiarism (configurable, default 80%)
  const PLAGIARISM_THRESHOLD = 80;

  return {
    similarity,
    isPlagiarized: similarity >= PLAGIARISM_THRESHOLD,
    threshold: PLAGIARISM_THRESHOLD,
    normalizedCode1: normalized1.substring(0, 200), // Preview
    normalizedCode2: normalized2.substring(0, 200), // Preview
    message: similarity >= PLAGIARISM_THRESHOLD
      ? `High similarity detected (${similarity}%). Possible plagiarism.`
      : `Similarity: ${similarity}%`,
  };
}

/**
 * Compare multiple submissions and find pairs with high similarity
 * @param {Array} submissions - Array of submissions with code
 * @param {string} language - Programming language
 * @param {number} threshold - Similarity threshold (default 80)
 * @returns {Array} Array of plagiarism pairs
 */
export function findPlagiarismPairs(submissions, language = 'python', threshold = 80) {
  const pairs = [];
  const checked = new Set();

  for (let i = 0; i < submissions.length; i++) {
    for (let j = i + 1; j < submissions.length; j++) {
      const sub1 = submissions[i];
      const sub2 = submissions[j];

      // Skip if already checked
      const pairKey = `${Math.min(sub1.submission_id, sub2.submission_id)}-${Math.max(sub1.submission_id, sub2.submission_id)}`;
      if (checked.has(pairKey)) continue;
      checked.add(pairKey);

      const result = checkPlagiarism(sub1.code, sub2.code, language);

      if (result.similarity >= threshold) {
        pairs.push({
          submission1: {
            submission_id: sub1.submission_id,
            student_id: sub1.student_id,
            student_name: sub1.student_name || 'Unknown',
            submitted_at: sub1.submitted_at,
          },
          submission2: {
            submission_id: sub2.submission_id,
            student_id: sub2.student_id,
            student_name: sub2.student_name || 'Unknown',
            submitted_at: sub2.submitted_at,
          },
          similarity: result.similarity,
          isPlagiarized: result.isPlagiarized,
        });
      }
    }
  }

  // Sort by similarity (highest first)
  pairs.sort((a, b) => b.similarity - a.similarity);

  return pairs;
}

