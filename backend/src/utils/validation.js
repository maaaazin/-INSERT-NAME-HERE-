export function validateExecutionRequest(req) {
    const { code, language } = req.body;
    
    if (!code || !language) {
      return {
        isValid: false,
        error: 'Missing code or language'
      };
    }
    
    return { isValid: true };
  }
  
  export function validateSubmissionRequest(req) {
    const { submissionId } = req.body;
    
    if (!submissionId) {
      return {
        isValid: false,
        error: 'Missing submission ID'
      };
    }
    
    return { isValid: true };
  }
  