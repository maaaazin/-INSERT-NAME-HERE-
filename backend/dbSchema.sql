-- Users
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL, -- 'teacher' or 'student'
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Batches
CREATE TABLE batches (
    batch_id SERIAL PRIMARY KEY,
    batch_name VARCHAR(100) NOT NULL,
    instructor_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    academic_year VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students
CREATE TABLE students (
    student_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    roll_no VARCHAR(50) UNIQUE NOT NULL,
    batch_id INT REFERENCES batches(batch_id) ON DELETE SET NULL,
    class VARCHAR(50)
);

-- Assignments
CREATE TABLE assignments (
    assignment_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    batch_id INT REFERENCES batches(batch_id) ON DELETE CASCADE,
    instructor_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    language VARCHAR(50) NOT NULL,
    due_date TIMESTAMP NOT NULL,
    assign_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'active', 'closed'
    max_score INT DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Test Cases
CREATE TABLE test_cases (
    test_case_id SERIAL PRIMARY KEY,
    assignment_id INT REFERENCES assignments(assignment_id) ON DELETE CASCADE,
    input_data TEXT NOT NULL,
    expected_output TEXT NOT NULL,
    points INT DEFAULT 10,
    is_public BOOLEAN DEFAULT TRUE,
    time_limit FLOAT DEFAULT 2.0,
    memory_limit INT DEFAULT 128000,
    input_format VARCHAR(50) DEFAULT 'single', -- 'single', 'multiple', 'multiline', 'array', 'matrix'
    comparison_mode VARCHAR(50) DEFAULT 'exact', -- 'exact', 'whitespace_flexible', 'numeric_tolerance', 'line_by_line', 'token_based', 'array'
    tolerance FLOAT DEFAULT 0, -- For numeric_tolerance comparison mode
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Submissions
CREATE TABLE submissions (
    submission_id SERIAL PRIMARY KEY,
    assignment_id INT REFERENCES assignments(assignment_id) ON DELETE CASCADE,
    student_id INT REFERENCES students(student_id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    language VARCHAR(50) NOT NULL,
    score INT DEFAULT 0,
    max_score INT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'graded', 'error'
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    graded_at TIMESTAMP,
    avg_execution_time FLOAT
);

-- Test Results
CREATE TABLE test_results (
    result_id SERIAL PRIMARY KEY,
    submission_id INT REFERENCES submissions(submission_id) ON DELETE CASCADE,
    test_case_id INT REFERENCES test_cases(test_case_id) ON DELETE CASCADE,
    passed BOOLEAN NOT NULL,
    actual_output TEXT,
    execution_time FLOAT,
    memory_used INT,
    error_message TEXT,
    status VARCHAR(50), -- 'Accepted', 'Wrong Answer', 'TLE', 'Runtime Error'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_assignments_batch ON assignments(batch_id);
CREATE INDEX idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX idx_submissions_student ON submissions(student_id);
CREATE INDEX idx_test_results_submission ON test_results(submission_id);