# Project Summary: Automated Coding Assignment Grading Platform

## 📋 Overview

This is a **scalable, production-ready automated coding assignment grading platform** designed for educational institutions. The system allows teachers to create programming assignments with test cases, and students to submit code solutions that are automatically graded based on correctness and performance metrics.

### Key Features

- ✅ **Automated Code Execution**: Executes student code in multiple programming languages (Python, JavaScript, etc.)
- ✅ **Intelligent Test Case Evaluation**: Supports multiple input/output formats and comparison modes
- ✅ **Performance-Based Grading**: Considers runtime and memory usage in scoring
- ✅ **Asynchronous Processing**: Queue-based job processing for handling bulk submissions
- ✅ **Horizontal Scalability**: Load-balanced architecture with multiple backend and worker instances
- ✅ **Rate Limiting**: Protects against abuse with configurable rate limits
- ✅ **Role-Based Access**: Separate dashboards for teachers and students
- ✅ **Real-time Analytics**: Leaderboards, statistics, and student activity tracking
- ✅ **Resubmission Management**: Limits submissions per assignment with deadline enforcement

---

## 🏗️ Architecture Overview

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Student    │  │   Teacher    │  │   Admin      │          │
│  │   Browser    │  │   Browser     │  │   Browser    │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼─────────────────┼──────────────────┼─────────────────┘
          │                 │                  │
          └─────────────────┴──────────────────┘
                            │
                            │ HTTPS/HTTP
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      LOAD BALANCER LAYER                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Nginx (Port 80/443)                    │  │
│  │  • Load Balancing (Least Connections)                     │  │
│  │  • Rate Limiting (Per IP/Endpoint)                        │  │
│  │  • SSL Termination                                        │  │
│  │  • Health Checks                                          │  │
│  └───────────────┬──────────────────────────────────────────┘  │
└──────────────────┼───────────────────────────────────────────────┘
                   │
                   │ Proxy Pass
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Backend 1   │  │  Backend 2   │  │  Backend N    │          │
│  │  (Port 3000) │  │  (Port 3001) │  │  (Port 300N)  │          │
│  │              │  │              │  │              │          │
│  │  Express.js  │  │  Express.js  │  │  Express.js  │          │
│  │  REST API    │  │  REST API    │  │  REST API    │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                  │                   │
│         └─────────────────┴──────────────────┘                   │
│                            │                                      │
│                            │ Job Queue                            │
│                            ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Redis Queue (Bull Queue)                    │  │
│  │  • Job Queue Management                                  │  │
│  │  • Priority-based Processing                             │  │
│  │  • Retry Logic (3 attempts, exponential backoff)         │  │
│  └───────────────┬──────────────────────────────────────────┘  │
│                  │                                               │
│                  │ Job Processing                                │
│                  ▼                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Worker 1    │  │  Worker 2    │  │  Worker N    │          │
│  │  (Concurrency:│  │  (Concurrency:│  │  (Concurrency:│          │
│  │   5 jobs)    │  │   5 jobs)    │  │   5 jobs)    │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼─────────────────┼──────────────────┼─────────────────┘
          │                 │                  │
          └─────────────────┴──────────────────┘
                            │
                            │ Code Execution
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EXECUTION LAYER                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Piston API (Code Execution)                   │  │
│  │  • Multi-language Support                                │  │
│  │  • Sandboxed Execution                                   │  │
│  │  • Resource Limits (Time/Memory)                          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ Data Persistence
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Supabase (PostgreSQL)                         │  │
│  │  • User Management                                        │  │
│  │  • Assignments & Test Cases                               │  │
│  │  • Submissions & Results                                  │  │
│  │  • Analytics & Statistics                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Request Flow Diagrams

### 1. Student Submission Flow (Synchronous Mode)

```
┌──────────┐
│ Student  │
│ Browser  │
└────┬─────┘
     │
     │ 1. Submit Code
     ▼
┌─────────────────┐
│   Nginx LB      │  Rate Limit Check
│  (Port 80)      │  ────────────────
└────┬────────────┘  • 10 req/min
     │
     │ 2. Route to Backend
     ▼
┌─────────────────┐
│  Backend API    │
│  (Express.js)   │
└────┬────────────┘
     │
     │ 3. Validate Request
     │    • Check deadline
     │    • Check submission limit (max 3)
     │    • Create submission record
     ▼
┌─────────────────┐
│  Test Runner    │
│   Service       │
└────┬────────────┘
     │
     │ 4. For each test case:
     │    • Format input
     │    • Execute code
     │    • Compare output
     ▼
┌─────────────────┐
│  Piston API     │
│  (Code Exec)    │
└────┬────────────┘
     │
     │ 5. Return execution results
     ▼
┌─────────────────┐
│  Grading        │
│   Service       │
└────┬────────────┘
     │
     │ 6. Calculate score
     │    • Test pass rate
     │    • Performance bonus/penalty
     ▼
┌─────────────────┐
│  Supabase DB    │
│  (PostgreSQL)   │
└────┬────────────┘
     │
     │ 7. Save results
     │    • Update submission
     │    • Save test results
     ▼
┌─────────────────┐
│  Response       │
│  to Student     │
└─────────────────┘
```

### 2. Student Submission Flow (Asynchronous/Queue Mode)

```
┌──────────┐
│ Student  │
│ Browser  │
└────┬─────┘
     │
     │ 1. Submit Code
     ▼
┌─────────────────┐
│   Nginx LB      │
└────┬────────────┘
     │
     │ 2. Route to Backend
     ▼
┌─────────────────┐
│  Backend API    │
└────┬────────────┘
     │
     │ 3. Create submission (status: pending)
     │ 4. Add job to queue
     ▼
┌─────────────────┐
│  Redis Queue    │  Returns immediately
│  (Bull Queue)   │  with job ID
└────┬────────────┘
     │
     │ 5. Return response
     ▼
┌─────────────────┐
│  Student gets   │
│  job ID         │
└─────────────────┘

     (Parallel Processing)

┌─────────────────┐
│  Worker Process │
│  picks up job   │
└────┬────────────┘
     │
     │ 6. Process submission
     │    • Run test cases
     │    • Calculate grade
     │    • Update database
     ▼
┌─────────────────┐
│  Supabase DB    │
│  (Update status)│
└────┬────────────┘
     │
     │ 7. Student polls status
     │    GET /api/submissions/status/:id
     ▼
┌─────────────────┐
│  Student sees   │
│  graded result  │
└─────────────────┘
```

### 3. Load Balancing Flow

```
                    ┌──────────────┐
                    │   Client     │
                    │   Request    │
                    └──────┬───────┘
                           │
                           ▼
              ┌────────────────────────┐
              │   Nginx Load Balancer  │
              │   (Port 80)            │
              │                        │
              │  Algorithm:           │
              │  least_conn            │
              └────┬───────┬───────┬───┘
                   │       │       │
        ┌──────────┘       │       └──────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Backend 1   │  │  Backend 2   │  │  Backend 3   │
│  (3000)      │  │  (3001)      │  │  (3002)      │
│              │  │              │  │              │
│  Active: 5   │  │  Active: 3   │  │  Active: 7   │
│  Conn: 12    │  │  Conn: 8      │  │  Conn: 15    │
└──────────────┘  └──────────────┘  └──────────────┘
        │                  │                  │
        └──────────────────┴──────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │   Shared Resources      │
              │   • Redis Queue         │
              │   • Supabase DB         │
              │   • Piston API          │
              └────────────────────────┘
```

---

## 🛠️ Technology Stack

### Frontend

- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Styling
- **Monaco Editor** - Code editor component
- **Lucide React** - Icons

### Backend

- **Node.js** - Runtime environment
- **Express.js 5** - Web framework
- **Bull Queue** - Job queue management
- **ioredis** - Redis client
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Axios** - HTTP client

### Infrastructure

- **Nginx** - Load balancer and reverse proxy
- **Redis 7** - Queue storage and caching
- **Supabase** - PostgreSQL database and auth
- **Piston API** - Code execution engine
- **Docker** - Containerization
- **Docker Compose** - Orchestration

---

## 📊 Database Schema

### Core Tables

1. **users** - User accounts (teachers/students)
2. **batches** - Class batches/groups
3. **students** - Student profiles linked to users
4. **assignments** - Programming assignments
5. **test_cases** - Test cases for assignments
6. **submissions** - Student code submissions
7. **test_results** - Individual test case results

### Key Relationships

```
users (1) ──< (1) students
batches (1) ──< (N) students
batches (1) ──< (N) assignments
assignments (1) ──< (N) test_cases
assignments (1) ──< (N) submissions
submissions (1) ──< (N) test_results
test_cases (1) ──< (N) test_results
```

---

## 🚀 How It Works

### 1. Assignment Creation (Teacher)

1. Teacher logs in and navigates to assignments
2. Creates a new assignment with:
   - Title, description, language
   - Due date, max score
   - Batch assignment
3. Adds test cases with:
   - Input data and expected output
   - Input format (single, multiple, multiline, array, matrix)
   - Comparison mode (exact, whitespace_flexible, numeric_tolerance, etc.)
   - Time and memory limits
   - Points per test case
4. Activates assignment

### 2. Code Submission (Student)

1. Student views active assignments
2. Opens assignment and sees:
   - Problem description
   - Public test cases (for testing)
   - Code editor (Monaco)
3. Writes solution code
4. Can "Run Code" to test without submitting
5. Submits code (max 3 submissions per assignment)
6. System validates:
   - Assignment is active
   - Deadline hasn't passed
   - Submission limit not exceeded

### 3. Code Execution & Grading

#### Synchronous Mode (Default)

1. Backend receives submission
2. For each test case:
   - Formats input according to `input_format`
   - Sends code + input to Piston API
   - Receives output, runtime, memory
   - Compares output using `comparison_mode`
   - Records pass/fail
3. Calculates score:
   - Base score = (passed tests / total tests) × max_score
   - If all tests pass, applies performance bonus/penalty:
     - Runtime: ±2.5% based on thresholds
     - Memory: ±2.5% based on thresholds
   - Final score capped between 0 and max_score
4. Saves results to database
5. Returns graded result to student

#### Asynchronous Mode (Queue-based)

1. Backend creates submission record (status: pending)
2. Adds job to Redis queue
3. Returns immediately with job ID
4. Worker process picks up job
5. Worker executes same grading process
6. Updates submission status to 'graded' or 'error'
7. Student polls status endpoint to get results

### 4. Grading Algorithm

```javascript
Base Score = (Passed Tests / Total Tests) × Max Score

If All Tests Pass:
  Performance Bonus = Runtime Bonus + Memory Bonus
  Runtime Bonus:
    - Excellent (< threshold): +2.5%
    - Good: +1.5%
    - Average: 0%
    - Below Average: -1%
    - Poor: -2.5%

  Memory Bonus:
    - Excellent (< threshold): +2.5%
    - Good: +1.5%
    - Average: 0%
    - Below Average: -1%
    - Poor: -2.5%

Final Score = Base Score + Performance Bonus
Final Score = clamp(Final Score, 0, Max Score)
```

### 5. Test Case Comparison Modes

- **exact**: Exact string match
- **whitespace_flexible**: Ignores leading/trailing whitespace
- **numeric_tolerance**: Numeric comparison with tolerance
- **line_by_line**: Compares line by line
- **token_based**: Token-based comparison
- **array**: Array comparison (for structured data)

---

## ⚖️ Load Balancing & Scalability

### Nginx Configuration

- **Algorithm**: Least Connections (`least_conn`)
- **Health Checks**: Automatic failover
- **Rate Limiting**:
  - General API: 100 req/15min per IP
  - Auth endpoints: 5 req/15min per IP
  - Submissions: 10 req/min per user
- **Gzip Compression**: Enabled
- **Connection Pooling**: Optimized keepalive

### Horizontal Scaling

#### Backend Scaling

```bash
# Scale to 5 backend instances
docker-compose up -d --scale backend=5
```

#### Worker Scaling

```bash
# Scale to 10 worker processes
docker-compose up -d --scale worker=10
```

### Queue Management

- **Concurrency**: 5 jobs per worker
- **Retry Logic**: 3 attempts with exponential backoff
- **Job Retention**:
  - Completed: 1 hour or last 1000 jobs
  - Failed: 24 hours
- **Priority**: Normal priority (can be extended)

### Performance Characteristics

- **Throughput**: Handles 1000+ concurrent submissions
- **Latency**:
  - Synchronous: 2-5 seconds per submission
  - Asynchronous: < 100ms response, processing in background
- **Scalability**: Linear scaling with worker count

---

## 🔐 Security Features

1. **Authentication**: JWT-based token authentication
2. **Password Hashing**: bcrypt with salt rounds
3. **Rate Limiting**: Multi-tier rate limiting (IP and user-based)
4. **Input Validation**: Server-side validation for all inputs
5. **SQL Injection Protection**: Parameterized queries via Supabase
6. **CORS**: Configured for frontend origin
7. **Security Headers**: X-Frame-Options, X-Content-Type-Options, X-XSS-Protection

---

## 📈 Monitoring & Analytics

### Available Metrics

1. **Queue Statistics**: `/api/queue/stats`

   - Waiting jobs
   - Active jobs
   - Completed jobs
   - Failed jobs
   - Delayed jobs

2. **Health Check**: `/health`

   - Service status
   - Timestamp

3. **Teacher Dashboard**:

   - Assignment statistics
   - Student performance
   - Submission rates
   - Average scores

4. **Student Dashboard**:
   - Personal submission history
   - Average scores per assignment
   - Leaderboard position

---

## 🐳 Docker Architecture

### Services

1. **nginx**: Load balancer (ports 80, 443)
2. **backend**: API servers (scalable, internal ports)
3. **worker**: Job processors (scalable)
4. **redis**: Queue storage (port 6379)
5. **piston** (optional): Code execution service

### Network

- All services on `d3-network` bridge network
- Backend services communicate via service names
- Redis accessible to all backend/worker instances

### Volumes

- `redis-data`: Persistent Redis data storage

---

## 🔄 Deployment Modes

### Development Mode

- Single backend instance
- Single worker
- Synchronous processing (no queue)
- Direct database access

### Production Mode

- Multiple backend instances (load balanced)
- Multiple workers (horizontal scaling)
- Queue-based async processing
- Rate limiting enabled
- Health checks active

---

## 📝 Key API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/verify` - Token verification

### Assignments

- `GET /api/assignments` - List assignments
- `POST /api/assignments` - Create assignment
- `GET /api/assignments/:id` - Get assignment
- `PUT /api/assignments/:id` - Update assignment
- `DELETE /api/assignments/:id` - Delete assignment

### Submissions

- `POST /api/submissions/execute` - Execute and submit code
- `GET /api/submissions` - List submissions
- `GET /api/submissions/:id` - Get submission
- `GET /api/submissions/status/:id` - Get submission status (queue mode)
- `GET /api/submissions/assignment/:id` - Get by assignment
- `GET /api/submissions/student/:id` - Get by student

### Test Cases

- `GET /api/testcases/assignment/:id` - Get test cases
- `POST /api/testcases` - Create test case
- `PUT /api/testcases/:id` - Update test case
- `DELETE /api/testcases/:id` - Delete test case

### Statistics

- `GET /api/stats/teacher` - Teacher statistics
- `GET /api/stats/student/:id` - Student statistics

### Queue

- `GET /api/queue/stats` - Queue statistics

---

## 🎯 Use Cases

1. **Programming Courses**: Automated grading for CS courses
2. **Coding Competitions**: Real-time leaderboards and scoring
3. **Technical Interviews**: Automated code assessment
4. **Practice Platforms**: Self-paced learning with instant feedback
5. **Batch Management**: Organize students into classes/batches

---

## 🚦 Getting Started

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)
- Supabase account (for database)

### Quick Start

```bash
# 1. Clone repository
git clone <repo-url>
cd d3

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# 3. Start all services
docker-compose up -d

# 4. Scale services (optional)
docker-compose up -d --scale backend=3 --scale worker=5

# 5. Access application
# Frontend: http://localhost (if configured)
# Backend API: http://localhost/api
# Health Check: http://localhost/health
```

---

## 📚 Additional Documentation

- `README.SCALING.md` - Detailed scaling guide
- `LOAD_TEST.md` - Load testing instructions
- `DOCKER_SETUP.md` - Docker configuration details
- `QUICK_START_DOCKER.sh` - Quick start script

---

## 🔮 Future Enhancements

- [ ] Real-time WebSocket updates for submission status
- [ ] Code plagiarism detection
- [ ] Advanced analytics and reporting
- [ ] Multi-language support expansion
- [ ] Code review and feedback system
- [ ] Integration with LMS platforms
- [ ] Mobile app support
- [ ] Automated test case generation
- [ ] Performance benchmarking
- [ ] Custom grading rubrics

---

## 📄 License

[Specify license if applicable]

---

## 👥 Contributors

[Add contributors if applicable]

---

_Last Updated: 2025_
