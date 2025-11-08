import axios from 'axios';
import { PISTON_URL, LANGUAGE_MAP, FILE_NAMES } from '../config/constants.js';

export async function executeCode(code, language, stdin = '') {
  const langConfig = LANGUAGE_MAP[language.toLowerCase()];
  
  if (!langConfig) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const startTime = Date.now();
  
  try {
    const response = await axios.post(
      `${PISTON_URL}/api/v2/execute`,
      {
        language: langConfig.language,
        version: langConfig.version,
        files: [{
          name: FILE_NAMES[language.toLowerCase()],
          content: code
        }],
        stdin: stdin
      },
      {
        timeout: 10000 // 10 second timeout
      }
    );

    const runtime = Date.now() - startTime;

    return {
      output: response.data.run.stdout ? response.data.run.stdout.trim() : '',
      error: response.data.run.stderr || '',
      exitCode: response.data.run.code || 0,
      runtime: runtime,
      // Note: Piston doesn't provide memory usage, we'll estimate based on output size
      memory: estimateMemoryUsage(response.data.run.stdout || '', response.data.run.stderr || '')
    };
  } catch (error) {
    const runtime = Date.now() - startTime;
    
    if (error.code === 'ECONNREFUSED' || error.message.includes('connect')) {
      throw new Error('Code execution service is not available. Please check if Piston is running.');
    }
    
    if (error.response) {
      // Piston API returned an error
      return {
        output: '',
        error: error.response.data?.message || 'Execution failed',
        exitCode: 1,
        runtime: runtime,
        memory: 0
      };
    }
    
    throw error;
  }
}

// Estimate memory usage (rough approximation)
function estimateMemoryUsage(stdout, stderr) {
  const outputSize = (stdout.length + stderr.length) / 1024; // KB
  const baseMemory = 5; // Base memory in MB
  return baseMemory + (outputSize / 1024); // Convert to MB
}
