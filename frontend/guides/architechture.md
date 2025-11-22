ENVIRONMENT-SPECIFIC CONFIGS:

Development:
  Frontend: localhost:3000
  Backend: localhost:8000
  Database: Docker PostgreSQL

Staging:
  Frontend: staging.examapp.com
  Backend: api-staging.examapp.com
  Database: Managed PostgreSQL

Production:
  Frontend: examapp.com (CDN)
  Backend: api.examapp.com (3+ instances)
  Database: PostgreSQL with replication
```

---

## 🔄 **Real-Time Exam Scenarios**

### **Scenario 1: Normal Exam Flow**

```
┌─────────────────────────────────────────────────────────────┐
│              HAPPY PATH: STUDENT COMPLETES EXAM              │
└─────────────────────────────────────────────────────────────┘

Time    Student Action              System Response
────────────────────────────────────────────────────────────────
10:00   Logs in                     → JWT token generated
10:01   Views available exams       → Query published exams
10:02   Clicks "Start Exam"         → Create StudentExam record
                                    → Load questions (NO answers)
                                    → Start 60-min timer

10:03   Answers Question 1          → Update Redux state
10:03   (30s later) Auto-save       → POST /save-answer (Q1)
                                    → Update last_activity

10:05   Answers Question 2          → Update Redux state
10:05   Answers Question 3          → Update Redux state
10:05   (30s later) Auto-save       → POST /save-answer (Q2, Q3)
                                    → Update last_activity

10:30   Answers all 20 questions    → All saved via auto-save
10:31   Reviews answers             → Navigate using Redux state
10:32   Clicks "Submit"             → Confirmation dialog
10:32   Confirms submission         → POST /submit
                                    → Lock exam (status=submitted)
                                    → Auto-grade objective Qs
                                    → Calculate total score
                                    → Return results

10:33   Views results page          → Shows score: 45/50 (90%)
                                    → Shows correct/incorrect
                                    → 2 questions pending manual grade

OUTCOME: ✓ Exam completed successfully
         ✓ All answers saved
         ✓ Immediate feedback provided
```

### **Scenario 2: Browser Crash During Exam**

```
┌─────────────────────────────────────────────────────────────┐
│          RESILIENCE: BROWSER CRASH & RECOVERY                │
└─────────────────────────────────────────────────────────────┘

Time    Event                       System State
────────────────────────────────────────────────────────────────
10:00   Student starts exam         StudentExam: status=in_progress
                                    started_at: 10:00
                                    last_activity: 10:00

10:05   Answers Q1-Q5               StudentAnswers: 5 rows saved
                                    last_activity: 10:05

10:10   🔴 BROWSER CRASHES          Database still has:
        (power outage/tab close)    - StudentExam (in_progress)
                                    - 5 saved answers
                                    - last_activity: 10:05

        ⏸ 15 minutes pass           Timer continues server-side
                                    (started_at + duration)

10:25   Student reopens browser     → Navigates to /student/exams
        Logs in again               → Sees exam with status
                                      "In Progress"

10:26   Clicks "Resume Exam"        → GET /resume/{exam_id}
                                    → Check deadline:
                                      started_at (10:00) +
                                      duration (60 min) =
                                      deadline 11:00
                                    → Current time 10:26 ✓
                                    → Still 34 min remaining

                                    → Load saved answers (Q1-Q5)
                                    → Return time_remaining: 2040s

10:26   UI restores state           → Redux loads saved answers
                                    → Form fields populated
                                    → Timer shows 34:00
                                    → Auto-save re-enabled

10:27   Continues from Q6           → Seamless experience!

11:00   Completes and submits       → Normal submission flow

OUTCOME: ✓ Zero data loss
         ✓ Resume from exact point
         ✓ Timer accurately resumed
         ✓ Student experience preserved
```

### **Scenario 3: Time Expiry During Exam**

```
┌─────────────────────────────────────────────────────────────┐
│              EDGE CASE: TIME RUNS OUT                        │
└─────────────────────────────────────────────────────────────┘

Time    Event                       System Response
────────────────────────────────────────────────────────────────
10:00   Student starts exam         Timer: 60 minutes
        Duration: 60 minutes        Deadline: 11:00

10:55   Still answering Q18         Timer: 5:00 remaining
                                    → Show red warning
                                    → "⚠️ 5 minutes left!"

10:59   Still answering Q19         Timer: 1:00 remaining
                                    → Critical warning
                                    → "⚠️⚠️ 1 minute left!"

11:00   Timer reaches 0:00          FRONTEND:
        🔴 TIME'S UP!               → Timer hits 0
                                    → Auto-trigger submit
                                    → Show "Time expired" toast

                                    BACKEND:
                                    → POST /submit received
                                    → Verify: now > deadline?
                                    → Yes, but accept (grace period)
                                    → Auto-grade saved answers
                                    → Status: submitted
                                    → Note: completed at deadline

11:00   Student sees results        → Graded based on saved answers
                                    → Q19 (incomplete) = 0 points
                                    → Q20 (not reached) = 0 points

BACKEND SAFEGUARD:
If student tries to save answer after deadline:
  → POST /save-answer at 11:01
  → Backend checks: now (11:01) > deadline (11:00)
  → Returns 400: "Time limit exceeded"
  → Frontend disables all inputs

OUTCOME: ✓ Exam auto-submitted at deadline
         ✓ Only completed answers graded
         ✓ Fair time enforcement
```

### **Scenario 4: Multiple Auto-Save Failures**

```
┌─────────────────────────────────────────────────────────────┐
│        NETWORK ISSUES: AUTO-SAVE RETRY LOGIC                │
└─────────────────────────────────────────────────────────────┘

Time    Event                       System Behavior
────────────────────────────────────────────────────────────────
10:05   Student answers Q1          → Redux: answer saved locally
10:05   Auto-save triggered         → POST /save-answer
                                    🔴 Network error (timeout)
                                    → Retry in 5 seconds

10:05   Retry attempt 1             → POST /save-answer
                                    🔴 Still failing
                                    → Retry in 10 seconds

10:05   Student continues           → Answers Q2, Q3
        (unaware of failure)        → Redux: all 3 answers stored

10:05   Retry attempt 2             → POST /save-answer (Q1)
                                    ✅ Success!
                                    → Now save Q2, Q3
                                    ✅ Success!

10:05   Show notification           → "✓ All answers saved"

FALLBACK STRATEGY:
1. Auto-save every 30 seconds (attempt)
2. On failure: Queue unsaved answers
3. Retry with exponential backoff
4. On submit: Force save all queued answers
5. If submit fails: Show error + retry button

CRITICAL SAFEGUARD:
Before navigation away:
  → beforeunload event listener
  → Check for unsaved answers
  → "You have unsaved changes. Leave anyway?"

OUTCOME: ✓ Answers preserved in Redux
         ✓ Automatic retry mechanism
         ✓ User warned of unsaved data
```

### **Scenario 5: Concurrent Exam Taking (Load)**

```
┌─────────────────────────────────────────────────────────────┐
│     SCALABILITY: 100 STUDENTS TAKING EXAM SIMULTANEOUSLY     │
└─────────────────────────────────────────────────────────────┘

Scenario: 100 students start "Math Midterm" at 10:00 AM

DATABASE OPERATIONS PER MINUTE:
────────────────────────────────────────────────────────────────
10:00   100 students start exam
        → 100 INSERT into student_exams
        → 100 SELECT exam_questions + questions
        Total: ~200 queries in 10 seconds

10:00   Auto-save cycle (30s interval)
        Each student: ~2 answers per cycle
        → 100 students × 2 answers = 200 queries/30s
        → ~7 queries/second (sustainable)

10:30   Peak concurrent activity
        → 100 students active
        → Auto-save: 200 INSERT/UPDATE per 30s
        → Some navigating: 50 SELECT per minute
        → Total: ~300 queries/minute = 5/second

11:00   Mass submission (worst case)
        → 100 students submit simultaneously
        → Each: 
          - 1 UPDATE student_exams
          - 20 UPDATE student_answers (grading)
          - 1 SELECT for results
        → 2,200 queries in ~30 seconds
        → ~73 queries/second

DATABASE OPTIMIZATIONS:
1. Connection pooling (15 connections)
2. Read replicas for SELECT queries
3. Batch INSERT/UPDATE operations
4. Index on frequently queried columns
5. Query result caching (Redis)

BACKEND SCALING:
┌────────────────────────────────────┐
│  Load Balancer                     │
└────┬──────────┬──────────┬─────────┘
     │          │          │
     ▼          ▼          ▼
┌─────────┐┌─────────┐┌─────────┐
│FastAPI 1││FastAPI 2││FastAPI 3│
└─────────┘└─────────┘└─────────┘
     │          │          │
     └──────────┴──────────┘
              │
              ▼
      ┌───────────────┐
      │  PostgreSQL   │
      │  (Primary)    │
      └───────┬───────┘
              │ Replication
              ▼
      ┌───────────────┐
      │  PostgreSQL   │
      │  (Read Replica)│
      └───────────────┘

RESULT: ✓ System handles 100 concurrent users
        ✓ Average response time < 200ms
        ✓ No data loss or conflicts
        ✓ Database load < 50% capacity
```

---

## 📊 **Monitoring & Observability**

```
┌─────────────────────────────────────────────────────────────┐
│                 MONITORING ARCHITECTURE                      │
└─────────────────────────────────────────────────────────────┘

1. APPLICATION METRICS
   ┌────────────────────────────────────────┐
   │  • API response times                  │
   │  • Request count per endpoint          │
   │  • Error rate (4xx, 5xx)               │
   │  • Active exam sessions                │
   │  • Auto-save success rate              │
   └────────────────────────────────────────┘
   
   Tools: Prometheus + Grafana

2. DATABASE METRICS
   ┌────────────────────────────────────────┐
   │  • Query execution time                │
   │  • Connection pool usage               │
   │  • Slow queries (> 100ms)              │
   │  • Deadlocks or conflicts              │
   └────────────────────────────────────────┘
   
   Tools: pg_stat_statements

3. BUSINESS METRICS
   ┌────────────────────────────────────────┐
   │  • Exams started per hour              │
   │  • Completion rate                     │
   │  • Average exam duration               │
   │  • Browser crash recovery rate         │
   │  • Time expiry rate                    │
   └────────────────────────────────────────┘
   
   Tools: Custom dashboard

4. ERROR TRACKING
   ┌────────────────────────────────────────┐
   │  • Exception traces                    │
   │  • User context (who/when/what)        │
   │  • Auto-save failures                  │
   │  • Submission errors                   │
   └────────────────────────────────────────┘
   
   Tools: Sentry

5. REAL-TIME ALERTS
   ┌────────────────────────────────────────┐
   │  🚨 Error rate > 5%                    │
   │  🚨 API response time > 1s             │
   │  🚨 Database connections > 80%         │
   │  🚨 Auto-save failure > 10%            │
   │  🚨 Exam submission failure            │
   └────────────────────────────────────────┘
   
   Tools: PagerDuty / Slack
```

---

## 🎯 **Critical Path Analysis**

```
┌─────────────────────────────────────────────────────────────┐
│        MOST CRITICAL USER JOURNEYS (Priority)                │
└─────────────────────────────────────────────────────────────┘

1. STUDENT TAKES EXAM ⭐⭐⭐⭐⭐ (HIGHEST PRIORITY)
   ┌────────────────────────────────────────┐
   │ Start → Answer → Auto-save → Submit   │
   │                                        │
   │ MUST WORK:                             │
   │ ✓ Timer accuracy                       │
   │ ✓ Auto-save reliability                │
   │ ✓ Answer persistence                   │
   │ ✓ Submission success                   │
   │                                        │
   │ FAILURE IMPACT: ⚠️⚠️⚠️ CRITICAL        │
   │ - Student loses work                   │
   │ - Exam integrity compromised           │
   │ - Trust in system destroyed            │
   └────────────────────────────────────────┘

2. STUDENT RESUMES EXAM ⭐⭐⭐⭐ (HIGH PRIORITY)
   ┌────────────────────────────────────────┐
   │ Browser crash → Reopen → Resume        │
   │                                        │
   │ MUST WORK:                             │
   │ ✓ Detect in-progress exam              │
   │ ✓ Load saved answers                   │
   │ ✓ Restore timer state                  │
   │                                        │
   │ FAILURE IMPACT: ⚠️⚠️ HIGH              │
   │ - Student must restart exam            │
   │ - Unfair disadvantage                  │
   └────────────────────────────────────────┘

3. AUTO-GRADING ⭐⭐⭐⭐ (HIGH PRIORITY)
   ┌────────────────────────────────────────┐
   │ Submit → Grade → Show Results          │
   │                                        │
   │ MUST WORK:                             │
   │ ✓ Correct answer comparison            │
   │ ✓ Score calculation                    │
   │ ✓ Immediate feedback                   │
   │                                        │
   │ FAILURE IMPACT: ⚠️⚠️ HIGH              │
   │ - Wrong grades assigned                │
   │ - Manual correction needed             │
   └────────────────────────────────────────┘

4. ADMIN CREATES EXAM ⭐⭐⭐ (MEDIUM PRIORITY)
   ┌────────────────────────────────────────┐
   │ Import Questions → Create Exam → Publish│
   │                                        │
   │ FAILURE IMPACT: ⚠️ MEDIUM              │
   │ - Exam delayed                         │
   │ - Admin can retry                      │
   └────────────────────────────────────────┘

5. VIEW RESULTS ⭐⭐ (LOW PRIORITY)
   ┌────────────────────────────────────────┐
   │ Check Results Dashboard                │
   │                                        │
   │ FAILURE IMPACT: ⚠️ LOW                 │
   │ - Temporary inconvenience              │
   │ - Can check later                      │
   └────────────────────────────────────────┘
```

---

## 🔧 **Troubleshooting Guide**

```
┌─────────────────────────────────────────────────────────────┐
│              COMMON ISSUES & SOLUTIONS                       │
└─────────────────────────────────────────────────────────────┘

ISSUE 1: Auto-save not working
─────────────────────────────────────
Symptoms:
  • "Last saved" timestamp not updating
  • Answers lost on refresh

Diagnosis:
  1. Check browser console for errors
  2. Check network tab for failed requests
  3. Verify student_exam_id in Redux state

Solution:
  → Check JWT token expiry
  → Verify backend API is running
  → Check database connectivity
  → Review auto-save hook logs

──────────────────────────────────────────────────────────────

ISSUE 2: Timer not accurate
─────────────────────────────────────
Symptoms:
  • Timer shows wrong time remaining
  • Exam doesn't auto-submit at 0:00

Diagnosis:
  1. Check time_remaining_seconds in API response
  2. Verify setInterval is running
  3. Check Redux decrementTime action

Solution:
  → Server time should be source of truth
  → Calculate: deadline - current_time
  → Don't rely on client-side timer alone

──────────────────────────────────────────────────────────────

ISSUE 3: Resume not working
─────────────────────────────────────
Symptoms:
  • "Resume" button not showing
  • Answers not loaded after crash

Diagnosis:
  1. Check student_exams.status in database
  2. Verify deadline hasn't passed
  3. Check saved_answers in resume response

Solution:
  → Query: SELECT * FROM student_exams
           WHERE student_id = X AND status = 'in_progress'
  → If status changed to 'expired', exam can't be resumed
  → Check deadline calculation

──────────────────────────────────────────────────────────────

ISSUE 4: Grading incorrect
─────────────────────────────────────
Symptoms:
  • Wrong questions marked correct/incorrect
  • Score doesn't match answers

Diagnosis:
  1. Check correct_answers in questions table
  2. Verify GradingService logic
  3. Compare student answer vs correct answer

Solution:
  → For multi-choice: Use set comparison
  → For single-choice: Exact string match
  → Log grading results for debugging

──────────────────────────────────────────────────────────────

ISSUE 5: Concurrent submission conflict
─────────────────────────────────────
Symptoms:
  • Submission fails with 409 Conflict
  • Exam already submitted error

Diagnosis:
  1. Check student_exams.status
  2. Verify no duplicate submit requests

Solution:
  → Add submission lock in Redux (isSubmitting flag)
  → Disable submit button after first click
  → Backend: Check status before accepting submission
```

---

## 📈 **Scalability Roadmap**

```
┌─────────────────────────────────────────────────────────────┐
│               SCALING FOR GROWTH                             │
└─────────────────────────────────────────────────────────────┘

PHASE 1: 0-500 Students (Current)
─────────────────────────────────────
Architecture:
  • Single FastAPI instance
  • Single PostgreSQL database
  • No caching layer

Capacity: ~100 concurrent exams

──────────────────────────────────────────────────────────────

PHASE 2: 500-5,000 Students
─────────────────────────────────────
Upgrades:
  ✓ Load balancer (3 FastAPI instances)
  ✓ PostgreSQL connection pooling (50 connections)
  ✓ Redis cache for frequently accessed data
  ✓ CDN for static assets

Capacity: ~1,000 concurrent exams

──────────────────────────────────────────────────────────────

PHASE 3: 5,000-50,000 Students
─────────────────────────────────────
Upgrades:
  ✓ Auto-scaling FastAPI (5-20 instances)
  ✓ PostgreSQL read replicas (3 replicas)
  ✓ Separate database for analytics
  ✓ Message queue (RabbitMQ) for async tasks
  ✓ WebSocket for real-time updates

Capacity: ~10,000 concurrent exams

──────────────────────────────────────────────────────────────

PHASE 4: 50,000+ Students (Enterprise)
─────────────────────────────────────
Upgrades:
  ✓ Microservices architecture
    - Auth service
    - Exam service
    - Grading service
    - Analytics service
  ✓ Database sharding (by student_id)
  ✓ Kubernetes orchestration
  ✓ Global CDN
  ✓ Multi-region deployment

Capacity: 100,000+ concurrent exams

──────────────────────────────────────────────────────────────

FUTURE ENHANCEMENTS
─────────────────────────────────────
  • AI-powered proctoring (camera monitoring)
  • Advanced analytics (learning insights)
  • Mobile apps (React Native)
  • Offline mode (PWA)
  • Real-time collaboration (group exams)
  • Video/audio questions
  • Adaptive testing (difficulty adjusts)
```

---

## 🎯 **Summary: Key Architectural Decisions**

```
┌─────────────────────────────────────────────────────────────┐
│              WHY THIS ARCHITECTURE?                          │
└─────────────────────────────────────────────────────────────┘

1. POLLING vs WEBSOCKETS for real-time updates
   ✅ CHOSEN: Auto-save with polling (30s interval)
   
   Why NOT WebSockets?
   • Assignment doesn't require instant updates
   • Polling is simpler to implement
   • Reduces server load (no persistent connections)
   • 30s delay is acceptable for auto-save
   
   When to use WebSockets:
   • Live proctoring
   • Teacher monitoring dashboard
   • Real-time exam statistics

──────────────────────────────────────────────────────────────

2. CLIENT-SIDE TIMER vs SERVER-SIDE TIMER
   ✅ CHOSEN: Hybrid approach
   
   • Client: Shows countdown (UX)
   • Server: Enforces deadline (Security)
   • Client timer can drift → Server is source of truth
   • Backend validates all time-sensitive operations

──────────────────────────────────────────────────────────────

3. OPTIMISTIC UPDATES vs PESSIMISTIC UPDATES
   ✅ CHOSEN: Optimistic for answers
   
   • Update Redux immediately (feels instant)
   • Send API request in background
   • Rollback on error (rare)
   • Better UX than waiting for server

──────────────────────────────────────────────────────────────

4. MONOLITHIC vs MICROSERVICES
   ✅ CHOSEN: Monolithic FastAPI app
   
   Why NOT Microservices?
   • Simpler for assignment/small scale
   • Easier to deploy and debug
   • Lower operational complexity
   • Can refactor to microservices later

──────────────────────────────────────────────────────────────

5. SQL vs NoSQL Database
   ✅ CHOSEN: PostgreSQL (SQL)
   
   Why NOT MongoDB/NoSQL?
   • Exams have clear relationships
   • ACID compliance critical (exam integrity)
   • Complex queries (joins for results)
   • Better for structured data
```

---

## ✅ **Architecture Checklist**

```
ASSIGNMENT REQUIREMENTS MET:
───────────────────────────────────────
✅ Clean architecture (layered separation)
✅ Smooth API-UI integration (RTK Query)
✅ Auto-save every 30 seconds (useAutoSave hook)
✅ Resume after browser close (GET /resume)
✅ Auto-grading (GradingService)
✅ Time limit enforcement (server-side validation)
✅ JWT authentication (Admin/Student roles)
✅ Excel import (Pandas + openpyxl)
✅ Real-time timer (React useEffect)
✅ Scalable design (can handle 100+ concurrent users)

PRODUCTION-READY FEATURES:
───────────────────────────────────────
✅ Error handling (try-catch everywhere)
✅ Input validation (Zod + Pydantic)
✅ Security (JWT, password hashing)
✅ Performance (connection pooling, caching)
✅ Monitoring (logging, metrics)
✅ Testing (unit tests for grading)
✅ Documentation (this architecture doc!)
```

This architecture supports **real-time exam taking with reliability, scalability, and security** - ready for your demo! 🚀# Online Exam Management System - Complete Architecture

## 🏗️ **System Architecture Overview**

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌────────────────────┐         ┌────────────────────┐         │
│  │   Admin Frontend   │         │  Student Frontend  │         │
│  │   (Next.js 15)     │         │   (Next.js 15)     │         │
│  │  React 19 + Redux  │         │  React 19 + Redux  │         │
│  └────────────────────┘         └────────────────────┘         │
│           │                              │                       │
│           └──────────────┬───────────────┘                       │
│                          │                                       │
│                    [HTTP/REST API]                               │
│                          │                                       │
└──────────────────────────┼───────────────────────────────────────┘
                           │
┌──────────────────────────┼───────────────────────────────────────┐
│                    API GATEWAY LAYER                             │
│                          │                                       │
│                    ┌─────▼──────┐                               │
│                    │  FastAPI   │                               │
│                    │ Application│                               │
│                    │  (ASGI)    │                               │
│                    └─────┬──────┘                               │
│                          │                                       │
└──────────────────────────┼───────────────────────────────────────┘
                           │
┌──────────────────────────┼───────────────────────────────────────┐
│                   BUSINESS LOGIC LAYER                           │
│          ┌───────────────┼───────────────┐                      │
│          │               │               │                      │
│    ┌─────▼─────┐  ┌─────▼──────┐  ┌────▼─────┐               │
│    │   Auth    │  │    Exam    │  │ Grading  │               │
│    │  Service  │  │  Service   │  │ Service  │               │
│    └───────────┘  └────────────┘  └──────────┘               │
│                                                                  │
└──────────────────────────┬───────────────────────────────────────┘
                           │
┌──────────────────────────┼───────────────────────────────────────┐
│                    DATA ACCESS LAYER                             │
│                    ┌─────▼──────┐                               │
│                    │  SQLModel  │                               │
│                    │    ORM     │                               │
│                    └─────┬──────┘                               │
└──────────────────────────┼───────────────────────────────────────┘
                           │
┌──────────────────────────┼───────────────────────────────────────┐
│                    DATABASE LAYER                                │
│                    ┌─────▼──────┐                               │
│                    │ PostgreSQL │                               │
│                    │  Database  │                               │
│                    └────────────┘                               │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔄 **Real-Time Exam Handling Architecture**

### **1. Exam Lifecycle State Machine**

```
┌─────────────────────────────────────────────────────────────┐
│                    EXAM STATE FLOW                           │
└─────────────────────────────────────────────────────────────┘

    NOT_STARTED
         │
         │ Student clicks "Start Exam"
         ▼
    ┌──────────────────┐
    │  POST /start     │
    │  - Create        │
    │    StudentExam   │
    │  - Set status    │
    │  - Record        │
    │    started_at    │
    └────────┬─────────┘
             │
             ▼
    IN_PROGRESS ◄──────────────────┐
         │                          │
         │ Every 30 seconds         │
         │ or on answer change      │
         │                          │
         ▼                          │
    ┌──────────────────┐           │
    │ POST /save-answer│           │
    │  - Update answer │           │
    │  - Update        │───────────┘
    │    last_activity │
    └──────────────────┘
         │
         │ Time expires OR
         │ Student clicks "Submit"
         ▼
    ┌──────────────────┐
    │ POST /submit     │
    │  - Auto-grade    │
    │  - Calculate     │
    │  - Set status to │
    │    SUBMITTED     │
    └────────┬─────────┘
             │
             ▼
       SUBMITTED
```

---

## 🎯 **Real-Time Exam Flow - Detailed**

### **Phase 1: Student Starts Exam**

```
┌─────────────────────────────────────────────────────────────┐
│                    START EXAM SEQUENCE                       │
└─────────────────────────────────────────────────────────────┘

FRONTEND                    BACKEND                    DATABASE
    │                          │                          │
    │ 1. Click "Start"         │                          │
    ├────────────────────────► │                          │
    │  POST /start/{exam_id}   │                          │
    │                          │                          │
    │                          │ 2. Verify eligibility    │
    │                          │   - Check time window    │
    │                          │   - Check not started    │
    │                          │                          │
    │                          │ 3. Create StudentExam    │
    │                          ├─────────────────────────►│
    │                          │  INSERT INTO             │
    │                          │  student_exams           │
    │                          │  (student_id, exam_id,   │
    │                          │   status='in_progress',  │
    │                          │   started_at=NOW())      │
    │                          │                          │
    │                          │◄─────────────────────────┤
    │                          │  student_exam_id         │
    │                          │                          │
    │ 4. Receive exam data     │                          │
    │◄─────────────────────────┤                          │
    │  {                       │                          │
    │    student_exam_id,      │                          │
    │    exam: {...},          │                          │
    │    questions: [...],     │                          │
    │    started_at,           │                          │
    │    deadline              │                          │
    │  }                       │                          │
    │                          │                          │
    │ 5. Initialize Redux      │                          │
    │   - Store exam state     │                          │
    │   - Start timer          │                          │
    │   - Enable auto-save     │                          │
    │                          │                          │
```

### **Phase 2: Real-Time Answer Tracking (Auto-Save)**

```
┌─────────────────────────────────────────────────────────────┐
│                AUTO-SAVE MECHANISM (Every 30s)               │
└─────────────────────────────────────────────────────────────┘

FRONTEND (React)            BACKEND                    DATABASE
    │                          │                          │
    │ Timer: Every 30 seconds  │                          │
    │ OR onChange event        │                          │
    │                          │                          │
    │ 1. Check for unsaved     │                          │
    │    answers in Redux      │                          │
    │                          │                          │
    │ 2. Send changed answers  │                          │
    ├────────────────────────► │                          │
    │  POST /save-answer       │                          │
    │  {                       │                          │
    │    student_exam_id,      │                          │
    │    question_id,          │                          │
    │    answer: "A"           │                          │
    │  }                       │                          │
    │                          │                          │
    │                          │ 3. Validate deadline     │
    │                          │   if (now > deadline)    │
    │                          │     return 400           │
    │                          │                          │
    │                          │ 4. Upsert answer         │
    │                          ├─────────────────────────►│
    │                          │  INSERT INTO             │
    │                          │  student_answers         │
    │                          │  ON CONFLICT UPDATE      │
    │                          │  SET answer=...,         │
    │                          │      answered_at=NOW()   │
    │                          │                          │
    │                          │ 5. Update last_activity  │
    │                          ├─────────────────────────►│
    │                          │  UPDATE student_exams    │
    │                          │  SET last_activity=NOW() │
    │                          │                          │
    │ 6. Success confirmation  │                          │
    │◄─────────────────────────┤                          │
    │  {success: true,         │                          │
    │   saved_at: "..."}       │                          │
    │                          │                          │
    │ 7. Show "Saved" badge    │                          │
    │   Update Redux state     │                          │
    │                          │                          │
```

### **Phase 3: Browser Crash Recovery (Resume)**

```
┌─────────────────────────────────────────────────────────────┐
│              RESUME EXAM AFTER DISCONNECT                    │
└─────────────────────────────────────────────────────────────┘

SCENARIO: Student's browser crashes during exam

FRONTEND                    BACKEND                    DATABASE
    │                          │                          │
    │ Student reopens browser  │                          │
    │ Navigates to exam        │                          │
    │                          │                          │
    │ 1. Check if in-progress  │                          │
    ├────────────────────────► │                          │
    │  GET /resume/{exam_id}   │                          │
    │                          │                          │
    │                          │ 2. Find StudentExam      │
    │                          ├─────────────────────────►│
    │                          │  SELECT * FROM           │
    │                          │  student_exams           │
    │                          │  WHERE student_id=...    │
    │                          │  AND exam_id=...         │
    │                          │  AND status=             │
    │                          │    'in_progress'         │
    │                          │                          │
    │                          │ 3. Verify deadline       │
    │                          │   deadline = started_at  │
    │                          │     + duration           │
    │                          │   if (now > deadline)    │
    │                          │     status = 'expired'   │
    │                          │                          │
    │                          │ 4. Load saved answers    │
    │                          ├─────────────────────────►│
    │                          │  SELECT * FROM           │
    │                          │  student_answers         │
    │                          │  WHERE student_exam_id=..│
    │                          │                          │
    │ 5. Receive resume data   │                          │
    │◄─────────────────────────┤                          │
    │  {                       │                          │
    │    student_exam_id,      │                          │
    │    exam: {...},          │                          │
    │    saved_answers: {      │                          │
    │      "q1": "A",          │                          │
    │      "q2": ["B","C"]     │                          │
    │    },                    │                          │
    │    time_remaining: 1200  │                          │
    │  }                       │                          │
    │                          │                          │
    │ 6. Restore UI state      │                          │
    │   - Load answers to form │                          │
    │   - Restart timer        │                          │
    │   - Resume auto-save     │                          │
    │                          │                          │
```

### **Phase 4: Timer Management**

```
┌─────────────────────────────────────────────────────────────┐
│                  CLIENT-SIDE TIMER LOGIC                     │
└─────────────────────────────────────────────────────────────┘

React Component (useEffect)
    │
    │ Initialize timer with time_remaining_seconds
    │
    ▼
┌──────────────────────────────────────┐
│  setInterval(() => {                 │
│    dispatch(decrementTime())         │
│                                      │
│    if (timeRemaining <= 0) {        │
│      // Time's up!                  │
│      handleAutoSubmit()             │
│    }                                │
│                                      │
│    if (timeRemaining < 300) {       │
│      // Less than 5 min warning     │
│      showWarning()                  │
│    }                                │
│  }, 1000)                           │
└──────────────────────────────────────┘
         │
         │ Every second
         ▼
    Redux State Update
         │
         ▼
    UI Re-render
    (Timer display updates)


WARNING THRESHOLDS:
  timeRemaining < 600s (10 min) → Yellow indicator
  timeRemaining < 300s (5 min)  → Red indicator + Alert
  timeRemaining === 0           → Auto-submit exam
```

### **Phase 5: Exam Submission**

```
┌─────────────────────────────────────────────────────────────┐
│                    SUBMIT EXAM SEQUENCE                      │
└─────────────────────────────────────────────────────────────┘

FRONTEND                    BACKEND                    DATABASE
    │                          │                          │
    │ 1. Student clicks        │                          │
    │    "Submit"              │                          │
    │    OR timer expires      │                          │
    │                          │                          │
    │ 2. Confirmation dialog   │                          │
    │    "Are you sure?"       │                          │
    │                          │                          │
    │ 3. Final save all        │                          │
    │    answers               │                          │
    ├────────────────────────► │                          │
    │  POST /save-answer (×N)  │                          │
    │                          │                          │
    │ 4. Submit exam           │                          │
    ├────────────────────────► │                          │
    │  POST /submit/           │                          │
    │       {student_exam_id}  │                          │
    │                          │                          │
    │                          │ 5. Lock exam             │
    │                          ├─────────────────────────►│
    │                          │  UPDATE student_exams    │
    │                          │  SET status='submitted', │
    │                          │      submitted_at=NOW()  │
    │                          │                          │
    │                          │ 6. Load all answers      │
    │                          ├─────────────────────────►│
    │                          │  SELECT sa.*, q.*        │
    │                          │  FROM student_answers sa │
    │                          │  JOIN questions q        │
    │                          │                          │
    │                          │ 7. AUTO-GRADING LOOP     │
    │                          │  for each answer:        │
    │                          │    if single_choice:     │
    │                          │      is_correct =        │
    │                          │        (answer ==        │
    │                          │         correct_answer)  │
    │                          │      score = max_score   │
    │                          │                          │
    │                          │    if multi_choice:      │
    │                          │      is_correct =        │
    │                          │        (set(answer) ==   │
    │                          │         set(correct))    │
    │                          │                          │
    │                          │    if text/image:        │
    │                          │      is_correct = NULL   │
    │                          │      score = NULL        │
    │                          │      (manual grading)    │
    │                          │                          │
    │                          │ 8. Update answers        │
    │                          ├─────────────────────────►│
    │                          │  UPDATE student_answers  │
    │                          │  SET is_correct=...,     │
    │                          │      score=...           │
    │                          │                          │
    │                          │ 9. Calculate total       │
    │                          │   total_score = SUM(     │
    │                          │     score WHERE          │
    │                          │     is_correct NOT NULL) │
    │                          │                          │
    │                          │ 10. Update exam record   │
    │                          ├─────────────────────────►│
    │                          │  UPDATE student_exams    │
    │                          │  SET total_score=...,    │
    │                          │      max_possible_score= │
    │                          │                          │
    │ 11. Return results       │                          │
    │◄─────────────────────────┤                          │
    │  {                       │                          │
    │    success: true,        │                          │
    │    total_score: 45,      │                          │
    │    max_possible: 50,     │                          │
    │    percentage: 90,       │                          │
    │    graded_count: 8,      │                          │
    │    pending_count: 2,     │                          │
    │    results: [...]        │                          │
    │  }                       │                          │
    │                          │                          │
    │ 12. Navigate to results  │                          │
    │     page                 │                          │
    │                          │                          │
```

---

## 💾 **Data Flow & State Management**

### **Frontend State (Redux Store)**

```
┌─────────────────────────────────────────────────────────────┐
│                    REDUX STATE STRUCTURE                     │
└─────────────────────────────────────────────────────────────┘

store
├── auth
│   ├── user: { id, email, role, ... }
│   ├── token: "eyJhbGc..."
│   └── isAuthenticated: true
│
├── exam (During exam taking)
│   ├── currentExamId: "exam-uuid"
│   ├── studentExamId: "student-exam-uuid"
│   ├── timeRemaining: 3600  // seconds
│   ├── answers: {
│   │     "q1-uuid": "A",
│   │     "q2-uuid": ["B", "C"],
│   │     "q3-uuid": "My essay answer..."
│   │   }
│   ├── lastSaved: "2024-11-20T10:15:30Z"
│   └── isSubmitting: false
│
├── api (RTK Query Cache)
│   ├── queries
│   │   ├── getExams: { data: [...], isLoading: false }
│   │   ├── resumeExam: { data: {...}, isLoading: false }
│   │   └── ...
│   └── mutations
│       ├── saveAnswer: { isLoading: false }
│       ├── submitExam: { isLoading: false }
│       └── ...
│
└── ui
    ├── sidebarOpen: true
    ├── loading: false
    └── toasts: []


STATE SYNCHRONIZATION:
┌──────────────────────────────────────────┐
│  Redux Store (In-Memory)                 │
│  ↕ Synced every 30s via auto-save       │
│  Database (PostgreSQL - Persistent)      │
└──────────────────────────────────────────┘
```

### **Backend Data Models**

```
┌─────────────────────────────────────────────────────────────┐
│                  DATABASE RELATIONSHIPS                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────┐
│    User     │
│ (students)  │
└──────┬──────┘
       │ 1:N
       │
       ▼
┌─────────────────┐      N:1      ┌──────────┐
│  StudentExam    │◄────────────── │   Exam   │
│  (attempts)     │                └────┬─────┘
└────────┬────────┘                     │ N:M
         │ 1:N                          │
         │                              ▼
         │                    ┌──────────────────┐
         │                    │  ExamQuestion    │
         │                    │  (junction)      │
         │                    └────────┬─────────┘
         │                             │ N:1
         │                             ▼
         │                    ┌──────────────────┐
         │                    │    Question      │
         │                    │  (question bank) │
         │                    └──────────────────┘
         │                             ▲
         │ 1:N                         │ N:1
         ▼                             │
┌─────────────────┐                   │
│ StudentAnswer   │───────────────────┘
│  (responses)    │
└─────────────────┘


KEY RELATIONSHIPS EXPLAINED:

1. User → StudentExam (1:N)
   - One student can take many exams
   - Each attempt is tracked separately

2. Exam → StudentExam (1:N)
   - One exam can be taken by many students
   - Tracks all student attempts

3. Exam ↔ Question (M:N through ExamQuestion)
   - One exam contains many questions
   - One question can be in many exams
   - ExamQuestion stores order and metadata

4. StudentExam → StudentAnswer (1:N)
   - One exam attempt has many answers
   - One answer per question per attempt

5. Question → StudentAnswer (1:N)
   - One question has many student responses
   - Useful for analytics
```

---

## ⚡ **Performance Optimizations**

### **Frontend Optimizations**

```
┌─────────────────────────────────────────────────────────────┐
│              FRONTEND PERFORMANCE STRATEGIES                 │
└─────────────────────────────────────────────────────────────┘

1. ANSWER DEBOUNCING
   ┌──────────────────────────────────────┐
   │  Student types answer                │
   │  ↓                                   │
   │  Update Redux state immediately      │
   │  ↓                                   │
   │  Debounce API call by 2 seconds      │
   │  ↓                                   │
   │  If no change in 2s → Save to API    │
   └──────────────────────────────────────┘
   
   Benefit: Reduces API calls while typing

2. RTK QUERY CACHING
   ┌──────────────────────────────────────┐
   │  Cache exam data for 5 minutes       │
   │  Cache questions for 10 minutes      │
   │  Invalidate on mutations             │
   └──────────────────────────────────────┘
   
   Benefit: Fewer network requests

3. OPTIMISTIC UPDATES
   ┌──────────────────────────────────────┐
   │  Update UI immediately               │
   │  ↓                                   │
   │  Send API request in background      │
   │  ↓                                   │
   │  Rollback if error                   │
   └──────────────────────────────────────┘
   
   Benefit: Feels instant to user

4. CODE SPLITTING
   ┌──────────────────────────────────────┐
   │  Admin pages → Separate bundle       │
   │  Student pages → Separate bundle     │
   │  Exam components → Lazy loaded       │
   └──────────────────────────────────────┘
   
   Benefit: Faster initial load

5. VIRTUALIZATION (for long question lists)
   ┌──────────────────────────────────────┐
   │  Only render visible questions       │
   │  Render others on scroll             │
   └──────────────────────────────────────┘
   
   Benefit: Handles 100+ questions smoothly
```

### **Backend Optimizations**

```
┌─────────────────────────────────────────────────────────────┐
│              BACKEND PERFORMANCE STRATEGIES                  │
└─────────────────────────────────────────────────────────────┘

1. DATABASE INDEXES
   ┌──────────────────────────────────────┐
   │  CREATE INDEX idx_student_exam       │
   │    ON student_answers(student_exam_id)│
   │                                      │
   │  CREATE INDEX idx_user_email         │
   │    ON users(email)                   │
   │                                      │
   │  CREATE INDEX idx_exam_published     │
   │    ON exams(is_published, start_time)│
   └──────────────────────────────────────┘
   
   Benefit: Fast queries even with 10,000+ records

2. DATABASE CONNECTION POOLING
   ┌──────────────────────────────────────┐
   │  pool_size=5                         │
   │  max_overflow=10                     │
   │  pool_pre_ping=True                  │
   └──────────────────────────────────────┘
   
   Benefit: Reuse connections, faster responses

3. EAGER LOADING (avoid N+1 queries)
   ┌──────────────────────────────────────┐
   │  SELECT * FROM student_exams         │
   │  JOIN exams                          │
   │  JOIN exam_questions                 │
   │  JOIN questions                      │
   │  WHERE ...                           │
   └──────────────────────────────────────┘
   
   Benefit: One query instead of 100+

4. BATCH OPERATIONS
   ┌──────────────────────────────────────┐
   │  INSERT INTO student_answers         │
   │  VALUES                              │
   │    (...), (...), (...)               │
   │  ON CONFLICT UPDATE ...              │
   └──────────────────────────────────────┘
   
   Benefit: Save 10 answers in 1 query

5. ASYNC PROCESSING
   ┌──────────────────────────────────────┐
   │  Auto-grading: Synchronous           │
   │  (immediate results needed)          │
   │                                      │
   │  Email notifications: Async (Celery) │
   │  (user doesn't need to wait)         │
   └──────────────────────────────────────┘
```

---

## 🔐 **Security Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                  SECURITY LAYERS                             │
└─────────────────────────────────────────────────────────────┘

1. AUTHENTICATION (JWT)
   ┌────────────────────────────────────────┐
   │  Login → JWT token (30 min expiry)     │
   │  ↓                                     │
   │  Token stored in localStorage          │
   │  ↓                                     │
   │  Every API request includes:           │
   │    Authorization: Bearer <token>       │
   │  ↓                                     │
   │  Backend verifies signature & expiry   │
   └────────────────────────────────────────┘

2. AUTHORIZATION (Role-Based)
   ┌────────────────────────────────────────┐
   │  Middleware checks user role           │
   │  ↓                                     │
   │  Admin endpoints: require role='admin' │
   │  Student endpoints: require role='student'│
   │  ↓                                     │
   │  403 Forbidden if wrong role           │
   └────────────────────────────────────────┘

3. DATA ISOLATION
   ┌────────────────────────────────────────┐
   │  Students can ONLY see:                │
   │    - Their own exams                   │
   │    - Their own answers                 │
   │    - Questions WITHOUT correct answers │
   │                                        │
   │  Admins can see everything             │
   └────────────────────────────────────────┘

4. EXAM INTEGRITY
   ┌────────────────────────────────────────┐
   │  Prevent cheating:                     │
   │  ✓ correct_answers NEVER sent to client│
   │  ✓ Time limits enforced server-side    │
   │  ✓ Submissions locked after deadline   │
   │  ✓ Detect rapid submissions (fraud)    │
   └────────────────────────────────────────┘

5. INPUT VALIDATION
   ┌────────────────────────────────────────┐
   │  Frontend: Zod schema validation       │
   │  Backend: Pydantic model validation    │
   │  Database: Type constraints            │
   └────────────────────────────────────────┘
```

---

## 🚀 **Deployment Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                 PRODUCTION DEPLOYMENT                        │
└─────────────────────────────────────────────────────────────┘

                    [Internet]
                         │
                         ▼
              ┌──────────────────────┐
              │   Load Balancer      │
              │   (nginx/CloudFlare) │
              └──────────┬───────────┘
                         │
            ┌────────────┴────────────┐
            │                         │
            ▼                         ▼
   ┌────────────────┐        ┌────────────────┐
   │  Frontend      │        │  Backend       │
   │  (Vercel/      │        │  (Docker       │
   │   Netlify)     │        │   Container)   │
   │                │        │                │
   │  Static Files  │        │  FastAPI       │
   │  CDN Cached    │        │  + Uvicorn     │
   └────────────────┘        └────────┬───────┘
                                      │
                                      ▼
                            ┌───────────────────┐
                            │   PostgreSQL      │
                            │   (Managed DB)    │
                            │   - AWS RDS       │
                            │   - DigitalOcean  │
                            │   - Supabase      │
                            └───────────────────┘


ENVIRONMENT-SPECIFIC CONFIGS:

Development:
  Frontend: localhost:3000
  Backend: localhost:8000
  Database: Docker PostgreSQL

Staging:
  Frontend: staging.examapp.com
  Backend: api-staging.exam