# Codemia - Automated Code Grading Platform
---

## 📋 Project Overview

**Codemia** is a scalable, production-ready automated coding assignment grading platform designed for educational institutions. It enables teachers to create programming assignments with test cases, and students to submit code solutions that are automatically graded based on correctness and performance metrics.

### Key Highlights
- ✅ **Multi-language Support**: Python, JavaScript, C++, Java, C
- ✅ **Intelligent Grading**: Performance-based scoring with runtime and memory analysis
- ✅ **Plagiarism Detection**: Built-in similarity checking between submissions
- ✅ **Horizontal Scalability**: Load-balanced architecture with queue-based processing
- ✅ **Real-time Analytics**: Comprehensive dashboards for teachers and students

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER (React)                      │
│  • Teacher Dashboard  • Student Dashboard                    │
│  • Assignment Management  • Code Editor (Monaco)             │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        │ HTTPS/HTTP
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              LOAD BALANCER (Nginx)                          │
│  • Least Connections Algorithm                              │
│  • Rate Limiting (Per IP/Endpoint)                          │
│  • Health Checks & Failover                                 │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        │ Proxy Pass
                        ▼
┌─────────────────────────────────────────────────────────────┐
│          APPLICATION LAYER (Node.js/Express)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │Backend 1 │  │Backend 2 │  │Backend N │  (Scalable)       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                   │
│       │             │             │                          │
│       └─────────────┴─────────────┘                          │
│                    │                                          │
│                    │ Job Queue                                │
│                    ▼                                          │
│       ┌──────────────────────────┐                           │
│       │   Redis Queue (Bull)     │                           │
│       └───────────┬──────────────┘                           │
│                   │                                           │
│                   │ Job Processing                            │
│                   ▼                                           │
│       ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│       │ Worker 1 │  │ Worker 2 │  │ Worker N│  (Scalable)   │
│       └────┬─────┘  └────┬─────┘  └────┬─────┘               │
└────────────┼─────────────┼─────────────┼─────────────────────┘
             │             │             │
             └─────────────┴─────────────┘
                           │
                           │ Code Execution
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              EXECUTION LAYER (Piston API)                   │
│  • Multi-language Code Execution                            │
│  • Sandboxed Environment                                    │
│  • Resource Limits (Time/Memory)                             │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        │ Data Persistence
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              DATA LAYER (Supabase/PostgreSQL)               │
│  • User Management  • Assignments & Test Cases              │
│  • Submissions & Results  • Analytics & Statistics          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Backend Architecture (Deep Dive)

### 1. **Core Framework & Structure**

#### Entry Point: `backend/index.js`
```javascript
// Express.js 5 application
// Modular route organization
// Middleware pipeline
// Health checks & monitoring
```

**Key Features:**
- Express.js 5 web framework
- ES6 modules (import/export)
- Environment-based configuration
- Graceful error handling

#### Directory Structure
```
backend/src/
├── config/          # Configuration files
│   ├── constants.js    # Grading thresholds, language mappings
│   ├── redis.js        # Redis connection
│   └── supabase.js     # Database connection
├── controllers/     # Request handlers (MVC pattern)
│   ├── auth.controller.js
│   ├── assignments.controller.js
│   ├── submissions.controller.js
│   ├── testcases.controller.js
│   ├── stats.controller.js
│   ├── plagiarism.controller.js
│   └── ...
├── middleware/      # Express middleware
│   ├── auth.middleware.js      # JWT authentication
│   ├── rateLimiter.middleware.js  # Rate limiting
│   └── index.js                # Middleware setup
├── routes/          # API route definitions
│   ├── auth.routes.js
│   ├── assignments.routes.js
│   ├── submissions.routes.js
│   └── ...
├── services/        # Business logic layer
│   ├── grading.service.js      # Score calculation
│   ├── testRunner.service.js   # Test execution
│   ├── piston.service.js       # Code execution
│   ├── queue.service.js        # Job queue management
│   ├── plagiarism.service.js   # Similarity detection
│   ├── inputFormatter.service.js
│   ├── outputComparator.service.js
│   └── database.service.js
├── workers/         # Background job processors
│   └── submission.worker.js
└── utils/           # Utility functions
    └── validation.js
```

---

### 2. **Authentication & Authorization**

#### JWT-Based Authentication (`auth.middleware.js`)
```javascript
// Token-based authentication
// Role-based access control (RBAC)
// Secure password hashing (bcrypt)
```

**Flow:**
1. User logs in → Backend validates credentials
2. JWT token generated with user info (user_id, role, instructor_id/student_id)
3. Token sent to client, stored in localStorage
4. Subsequent requests include token in `Authorization: Bearer <token>` header
5. Middleware validates token and extracts user info

**Security Features:**
- bcrypt password hashing (10 salt rounds)
- JWT token expiration (7 days default)
- Role-based route protection (`requireRole('teacher')`)
- Token validation on every protected route

---

### 3. **Request Processing Pipeline**

```
Client Request
    ↓
Nginx (Load Balancer)
    ↓
Rate Limiter Middleware
    ├─ General API: 100 req/15min per IP
    ├─ Auth: 5 req/15min per IP
    └─ Submissions: 10 req/min per user
    ↓
Authentication Middleware
    ├─ Extract JWT token
    ├─ Verify signature
    └─ Attach user to req.user
    ↓
Role Check (if required)
    └─ Verify user has required role
    ↓
Route Handler (Controller)
    ├─ Validate input
    ├─ Call service layer
    └─ Return response
    ↓
Service Layer
    ├─ Business logic
    ├─ Database operations
    └─ External API calls
```

---

### 4. **Core Services (Backend Logic)**

#### A. **Grading Service** (`grading.service.js`)

**Purpose:** Calculate scores based on test results and performance

**Algorithm:**
```javascript
Base Score = (Passed Tests / Total Tests) × Max Score

If All Tests Pass:
  Performance Bonus = Runtime Bonus + Memory Bonus
  
  Runtime Bonus:
    - Excellent (< 200ms): +2.5%
    - Good (< 500ms): +1.5%
    - Average (< 1000ms): 0%
    - Below Average (< 2000ms): -1%
    - Poor (≥ 2000ms): -2.5%
  
  Memory Bonus:
    - Excellent (< 10MB): +2.5%
    - Good (< 50MB): +1.5%
    - Average (< 100MB): 0%
    - Below Average (< 200MB): -1%
    - Poor (≥ 200MB): -2.5%

Final Score = Base Score + Performance Bonus
Final Score = clamp(Final Score, 0, Max Score)
```

**Key Features:**
- Performance-based scoring (not just pass/fail)
- Configurable thresholds
- Bonus/penalty system (±5% max)
- Encourages efficient code

---

#### B. **Test Runner Service** (`testRunner.service.js`)

**Purpose:** Execute code against test cases and collect results

**Process:**
1. Fetch test cases from database
2. For each test case:
   - Format input based on `input_format` (single, multiline, array, matrix)
   - Execute code via Piston API
   - Compare output using `comparison_mode` (exact, whitespace_flexible, numeric_tolerance, etc.)
   - Record runtime, memory, pass/fail status
3. Aggregate results (avg runtime, avg memory, pass rate)
4. Return comprehensive test results

**Input Format Support:**
- `single`: Single line input
- `multiple`: Multiple space-separated values
- `multiline`: Multi-line input
- `array`: Array format
- `matrix`: Matrix format

**Comparison Modes:**
- `exact`: Exact string match
- `whitespace_flexible`: Ignores leading/trailing whitespace
- `numeric_tolerance`: Numeric comparison with tolerance
- `line_by_line`: Line-by-line comparison
- `token_based`: Token-based comparison
- `array`: Array comparison

---

#### C. **Code Execution Service** (`piston.service.js`)

**Purpose:** Execute student code in a sandboxed environment

**Integration:** Piston API (https://github.com/engineer-man/piston)

**Supported Languages:**
- Python 3.12.0
- JavaScript 20.11.1
- C++ 10.2.0
- Java 15.0.2
- C 10.2.0

**Features:**
- Sandboxed execution (isolated containers)
- Timeout protection (10 seconds)
- Memory usage estimation
- Error handling and capture
- Multi-language support

---

#### D. **Queue Service** (`queue.service.js`)

**Purpose:** Manage asynchronous job processing using Redis/Bull

**Technology:** Bull Queue (Redis-based)

**Configuration:**
- Retry: 3 attempts with exponential backoff
- Job retention:
  - Completed: 1 hour or last 1000 jobs
  - Failed: 24 hours
- Concurrency: 5 jobs per worker
- Priority-based processing

**Benefits:**
- Non-blocking API responses
- Horizontal scaling
- Job retry on failure
- Job status tracking
- Queue statistics monitoring

**Queue Events:**
- `waiting`: Job queued
- `active`: Job processing
- `completed`: Job finished
- `failed`: Job failed
- `stalled`: Job timeout

---

#### E. **Plagiarism Detection Service** (`plagiarism.service.js`)

**Purpose:** Detect code similarity between submissions

**Algorithm:**
1. **Code Normalization:**
   - Remove comments (single-line, multi-line)
   - Remove extra whitespace
   - Convert to lowercase
   - Normalize formatting

2. **Similarity Calculation:**
   - Levenshtein Distance algorithm
   - Calculates minimum edit distance
   - Converts to similarity percentage: `((maxLen - distance) / maxLen) × 100`

3. **Plagiarism Detection:**
   - Threshold: 80% (configurable)
   - Flags pairs above threshold
   - Returns similarity percentage and details

**Features:**
- Pair-wise comparison
- Bulk assignment checking
- Configurable threshold
- Detailed comparison results

---

#### F. **Input Formatter Service** (`inputFormatter.service.js`)

**Purpose:** Format test case inputs based on specified format

**Supported Formats:**
- `single`: Single value
- `multiple`: Space-separated values
- `multiline`: Multi-line input
- `array`: Array representation
- `matrix`: Matrix representation

**Example:**
```javascript
Input: "5\n3 7 2 9 1"
Format: "multiline"
Output: "5\n3 7 2 9 1" (formatted for stdin)
```

---

#### G. **Output Comparator Service** (`outputComparator.service.js`)

**Purpose:** Compare actual output with expected output using various modes

**Comparison Modes:**
1. **exact**: Exact string match
2. **whitespace_flexible**: Ignores leading/trailing whitespace
3. **numeric_tolerance**: Numeric comparison with tolerance
4. **line_by_line**: Compares line by line
5. **token_based**: Token-based comparison
6. **array**: Array comparison

**Features:**
- Flexible comparison strategies
- Tolerance support for numeric values
- Detailed mismatch reporting
- Error handling

---

### 5. **Worker Process** (`submission.worker.js`)

**Purpose:** Process submission jobs asynchronously from the queue

**Process Flow:**
1. Worker picks up job from Redis queue
2. Runs test cases using `testRunner.service`
3. Calculates grade using `grading.service`
4. Updates submission status in database
5. Saves test results
6. Calculates average scores
7. Returns job result

**Configuration:**
- Concurrency: 5 jobs per worker
- Automatic retry on failure
- Exponential backoff
- Graceful shutdown handling

**Benefits:**
- Offloads heavy processing from API servers
- Enables horizontal scaling
- Better resource utilization
- Improved response times

---

### 6. **Database Layer** (Supabase/PostgreSQL)

#### Schema Overview
```sql
users          → User accounts (teachers/students)
batches        → Class batches/groups
students       → Student profiles
assignments    → Programming assignments
test_cases     → Test cases for assignments
submissions    → Student code submissions
test_results   → Individual test case results
```

#### Key Relationships
- `users` 1:1 `students` (for student role)
- `batches` 1:N `students`
- `batches` 1:N `assignments`
- `assignments` 1:N `test_cases`
- `assignments` 1:N `submissions`
- `submissions` 1:N `test_results`
- `test_cases` 1:N `test_results`

#### Database Service (`database.service.js`)
- Connection management
- Query helpers
- Error handling
- Connection health checks

---

### 7. **API Endpoints**

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `GET /api/auth/me` - Get current user

#### Assignments
- `GET /api/assignments` - List all assignments
- `GET /api/assignments/:id` - Get assignment
- `POST /api/assignments` - Create assignment (teacher)
- `PUT /api/assignments/:id` - Update assignment (teacher)
- `DELETE /api/assignments/:id` - Delete assignment (teacher)

#### Submissions
- `POST /api/submissions/execute` - Execute and submit code
- `GET /api/submissions` - List submissions (teacher)
- `GET /api/submissions/:id` - Get submission
- `GET /api/submissions/assignment/:id` - Get by assignment (teacher)
- `GET /api/submissions/student/:id` - Get by student
- `GET /api/submissions/status/:id` - Get submission status

#### Test Cases
- `GET /api/testcases/assignment/:id` - Get test cases
- `POST /api/testcases` - Create test case (teacher)
- `PUT /api/testcases/:id` - Update test case (teacher)
- `DELETE /api/testcases/:id` - Delete test case (teacher)

#### Plagiarism
- `GET /api/plagiarism/compare/:id1/:id2` - Compare two submissions (teacher)
- `GET /api/plagiarism/assignment/:id` - Find plagiarism pairs (teacher)

#### Statistics
- `GET /api/stats/teacher/:id` - Teacher dashboard stats
- `GET /api/stats/student/:id` - Student dashboard stats
- `GET /api/stats/assignment/:id` - Assignment statistics
- `GET /api/stats/leaderboard` - Leaderboard data

---

### 8. **Middleware Stack**

#### Authentication Middleware
- JWT token validation
- User extraction from token
- Role verification

#### Rate Limiting Middleware
- Per-IP rate limiting
- Per-user rate limiting
- Endpoint-specific limits
- Burst handling

#### General Middleware
- CORS configuration
- JSON body parsing
- Error handling
- Request logging

---

### 9. **Error Handling**

**Strategy:**
- Try-catch blocks in all async operations
- Centralized error handling
- Meaningful error messages
- HTTP status code mapping
- Error logging

**Error Types:**
- Validation errors (400)
- Authentication errors (401)
- Authorization errors (403)
- Not found errors (404)
- Server errors (500)

---

### 10. **Performance Optimizations**

1. **Database:**
   - Indexed queries
   - Connection pooling
   - Efficient joins

2. **Caching:**
   - Redis for queue management
   - Potential for result caching

3. **Async Processing:**
   - Queue-based job processing
   - Non-blocking API responses

4. **Load Balancing:**
   - Nginx least-connections algorithm
   - Health checks
   - Automatic failover

---

## 🚀 Deployment & Scalability

### Docker Architecture
- **Backend**: Scalable containers (default 3, can scale to N)
- **Workers**: Scalable containers (default 5, can scale to N)
- **Redis**: Single instance (can be clustered)
- **Nginx**: Load balancer and reverse proxy

### Scaling Commands
```bash
# Scale backend to 5 instances
docker-compose up -d --scale backend=5

# Scale workers to 10 instances
docker-compose up -d --scale worker=10
```

### Performance Metrics
- **Throughput**: 1000+ concurrent submissions
- **Latency**: 
  - Synchronous: 2-5 seconds
  - Asynchronous: < 100ms response time
- **Scalability**: Linear scaling with worker count

---

## 🔐 Security Features

1. **Authentication:**
   - JWT-based token authentication
   - Secure password hashing (bcrypt)
   - Token expiration

2. **Authorization:**
   - Role-based access control
   - Route-level protection

3. **Rate Limiting:**
   - Per-IP limits
   - Per-user limits
   - Endpoint-specific limits

4. **Input Validation:**
   - Server-side validation
   - SQL injection protection (parameterized queries)
   - XSS protection

5. **Security Headers:**
   - X-Frame-Options
   - X-Content-Type-Options
   - X-XSS-Protection

---

## 📊 Key Backend Features

### 1. **Intelligent Grading System**
- Not just pass/fail
- Performance-based scoring
- Configurable thresholds
- Bonus/penalty system

### 2. **Flexible Test Case System**
- Multiple input formats
- Multiple comparison modes
- Public/hidden test cases
- Point-based scoring

### 3. **Asynchronous Processing**
- Queue-based job processing
- Non-blocking API
- Horizontal scaling
- Job retry mechanism

### 4. **Plagiarism Detection**
- Code normalization
- Similarity calculation
- Bulk checking
- Detailed reports

### 5. **Multi-language Support**
- Python, JavaScript, C++, Java, C
- Language-specific execution
- Extensible language support

---

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js 5
- **Database**: Supabase (PostgreSQL)
- **Queue**: Bull (Redis)
- **Authentication**: JWT
- **Password Hashing**: bcrypt
- **HTTP Client**: Axios

### Infrastructure
- **Load Balancer**: Nginx
- **Queue Storage**: Redis 7
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Code Execution**: Piston API

---

## 📈 Monitoring & Analytics

### Available Metrics
- Queue statistics (`/api/queue/stats`)
- Health checks (`/health`)
- Submission statistics
- Performance metrics
- Error tracking

### Dashboard Features
- Teacher: Assignment stats, student performance, submission rates
- Student: Personal scores, submission history, leaderboard position

---

## 🎯 Use Cases

1. **Programming Courses**: Automated grading for CS courses
2. **Coding Competitions**: Real-time leaderboards and scoring
3. **Technical Interviews**: Automated code assessment
4. **Practice Platforms**: Self-paced learning with instant feedback
5. **Batch Management**: Organize students into classes/batches

---

## 🔄 Request Flow Example: Code Submission

```
1. Student submits code
   ↓
2. Nginx receives request (rate limit check)
   ↓
3. Request routed to backend instance (least connections)
   ↓
4. Authentication middleware validates JWT token
   ↓
5. Submissions controller receives request
   ↓
6. Validates: deadline, submission limit, assignment status
   ↓
7. Creates submission record (status: pending)
   ↓
8. IF queue mode enabled:
   - Add job to Redis queue
   - Return immediately with job ID
   ↓
9. ELSE (synchronous mode):
   - Call testRunner.service
   - For each test case:
     * Format input (inputFormatter.service)
     * Execute code (piston.service)
     * Compare output (outputComparator.service)
   - Calculate grade (grading.service)
   - Update database
   - Return results
   ↓
10. Worker (if queue mode):
    - Picks up job from queue
    - Runs test cases
    - Calculates grade
    - Updates database
    - Job completed
```

---

## 💡 Backend Design Patterns

1. **MVC Pattern**: Controllers, Services, Models
2. **Service Layer**: Business logic separation
3. **Middleware Pattern**: Request processing pipeline
4. **Queue Pattern**: Asynchronous job processing
5. **Repository Pattern**: Database abstraction (via Supabase)

---

## 🎓 Conclusion

The Codemia backend is a **robust, scalable, and feature-rich** system designed for production use. It demonstrates:

- ✅ Clean architecture and separation of concerns
- ✅ Scalable design with horizontal scaling support
- ✅ Comprehensive error handling and security
- ✅ Performance optimizations
- ✅ Extensible design for future enhancements

The system successfully handles:
- Multi-language code execution
- Intelligent grading with performance metrics
- Plagiarism detection
- Asynchronous processing at scale
- Real-time analytics and reporting

---

*Built with ❤️ using Node.js, Express.js, and modern best practices*

