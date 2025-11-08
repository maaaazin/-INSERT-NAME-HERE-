const API_BASE_URL = 'http://localhost:3000/api';

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  try {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers,
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API call failed: ${endpoint}`, error);
    throw error;
  }
}

// Assignments API
export const assignmentsAPI = {
  getAll: () => apiCall('/assignments'),
  getById: (id) => apiCall(`/assignments/${id}`),
  getByBatch: (batchId) => apiCall(`/assignments/batch/${batchId}`),
  getByInstructor: (instructorId) => apiCall(`/assignments/instructor/${instructorId}`),
  create: (data) => apiCall('/assignments', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => apiCall(`/assignments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => apiCall(`/assignments/${id}`, {
    method: 'DELETE',
  }),
};

// Test Cases API
export const testCasesAPI = {
  getAll: () => apiCall('/testcases'),
  getById: (id) => apiCall(`/testcases/${id}`),
  getByAssignment: (assignmentId) => apiCall(`/testcases/assignment/${assignmentId}`),
  create: (data) => apiCall('/testcases', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => apiCall(`/testcases/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => apiCall(`/testcases/${id}`, {
    method: 'DELETE',
  }),
};

// Submissions API
export const submissionsAPI = {
  getAll: () => apiCall('/submissions'),
  getById: (id) => apiCall(`/submissions/${id}`),
  getByAssignment: (assignmentId) => apiCall(`/submissions/assignment/${assignmentId}`),
  getByStudent: (studentId) => apiCall(`/submissions/student/${studentId}`),
  getStatus: (submissionId) => apiCall(`/submissions/status/${submissionId}`),
  create: (data) => apiCall('/submissions', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  executeAndSubmit: (data) => apiCall('/submissions/execute', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// Stats API
export const statsAPI = {
  getTeacherStats: (instructorId) => {
    return apiCall(`/stats/teacher/${instructorId}`);
  },
  getStudentStats: (studentId) => apiCall(`/stats/student/${studentId}`),
  getAssignmentStats: (assignmentId) => apiCall(`/stats/assignment/${assignmentId}`),
  getLeaderboard: () => {
    return apiCall('/stats/leaderboard');
  },
};

// Batches API
export const batchesAPI = {
  getAll: () => apiCall('/batches'),
  getById: (id) => apiCall(`/batches/${id}`),
  getByInstructor: (instructorId) => apiCall(`/batches/instructor/${instructorId}`),
  create: (data) => apiCall('/batches', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// Execution API
export const executionAPI = {
  execute: (data) => apiCall('/execute/execute', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  executeSubmission: (data) => apiCall('/execute/execute-submission', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// Plagiarism API
export const plagiarismAPI = {
  compare: (submissionId1, submissionId2) => 
    apiCall(`/plagiarism/compare/${submissionId1}/${submissionId2}`),
  checkAssignment: (assignmentId, threshold = 80) => 
    apiCall(`/plagiarism/assignment/${assignmentId}?threshold=${threshold}`),
};

export default {
  assignments: assignmentsAPI,
  testCases: testCasesAPI,
  submissions: submissionsAPI,
  stats: statsAPI,
  batches: batchesAPI,
  execution: executionAPI,
  plagiarism: plagiarismAPI,
};

