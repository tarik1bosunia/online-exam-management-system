// Check for changed answers
      const changedQuestions = Object.keys(answers).filter(
        (questionId) => 
          answers[questionId] !== previousAnswersRef.current[questionId]
      )

      if (changedQuestions.length > 0) {
        try {
          // Save each changed answer
          for (const questionId of changedQuestions) {
            await saveAnswer({
              student_exam_id: studentExamId,
              question_id: questionId,
              answer: answers[questionId],
            }).unwrap()
          }

          // Update reference
          previousAnswersRef.current = { ...answers }
          
          // Show subtle notification
          console.log('Auto-saved:', changedQuestions.length, 'answer(s)')
        } catch (error) {
          console.error('Auto-save failed:', error)
        }
      }
    }, 30000) // 30 seconds

    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current)
      }
    }
  }, [enabled, studentExamId, answers, saveAnswer])

  // Manual save function
  const manualSave = async () => {
    if (!studentExamId) return

    try {
      const promises = Object.entries(answers).map(([questionId, answer]) =>
        saveAnswer({
          student_exam_id: studentExamId,
          question_id: questionId,
          answer,
        }).unwrap()
      )

      await Promise.all(promises)
      toast.success('All answers saved successfully')
    } catch (error) {
      toast.error('Failed to save answers')
    }
  }

  return { manualSave }
}
```

---

## 📄 **Student Pages**

### **src/app/(dashboard)/student/page.tsx**

```typescript
'use client'

import { useGetAvailableExamsQuery } from '@/lib/api/participationApi'
import { useGetMyResultsQuery } from '@/lib/api/resultsApi'
import { ExamCard } from '@/components/student/ExamCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { BookOpen, Clock, CheckCircle } from 'lucide-react'

export default function StudentDashboard() {
  const { data: exams, isLoading: examsLoading } = useGetAvailableExamsQuery()
  const { data: results, isLoading: resultsLoading } = useGetMyResultsQuery()

  const stats = {
    available: exams?.filter(e => e.can_start).length || 0,
    inProgress: exams?.filter(e => e.status === 'in_progress').length || 0,
    completed: results?.filter(r => r.status === 'submitted').length || 0,
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Student Dashboard</h1>
        <p className="text-gray-600">Welcome back! Ready to take some exams?</p>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Available Exams</CardTitle>
            <BookOpen className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.available}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="w-4 h-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Available Exams */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Available Exams</h2>
        
        {examsLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : exams && exams.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map(exam => (
              <ExamCard key={exam.exam_id} exam={exam} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center text-gray-500">
              No exams available at the moment
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
```

### **src/app/(dashboard)/student/exams/[id]/take/page.tsx**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useResumeExamQuery, useSubmitExamMutation } from '@/lib/api/participationApi'
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks'
import { 
  startExam, 
  saveAnswer, 
  loadSavedAnswers, 
  resetExam 
} from '@/lib/store/slices/examSlice'
import { QuestionDisplay } from '@/components/student/QuestionDisplay'
import { ExamTimer } from '@/components/student/ExamTimer'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useAutoSave } from '@/hooks/useAutoSave'
import { toast } from 'sonner'
import { AlertCircle, CheckCircle } from 'lucide-react'

export default function TakeExamPage() {
  const params = useParams()
  const router = useRouter()
  const dispatch = useAppDispatch()
  const examId = params.id as string

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch exam data (resume)
  const { data: examData, isLoading } = useResumeExamQuery(examId)
  const [submitExam] = useSubmitExamMutation()

  // Get current answers from Redux
  const answers = useAppSelector(state => state.exam.answers)
  const studentExamId = useAppSelector(state => state.exam.studentExamId)

  // Auto-save hook
  const { manualSave } = useAutoSave(studentExamId, true)

  // Initialize exam state
  useEffect(() => {
    if (examData) {
      dispatch(
        startExam({
          examId: examData.exam.id,
          studentExamId: examData.student_exam_id,
          timeRemaining: examData.time_remaining_seconds,
        })
      )

      // Load saved answers
      if (examData.saved_answers) {
        dispatch(loadSavedAnswers(examData.saved_answers))
      }
    }
  }, [examData, dispatch])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      dispatch(resetExam())
    }
  }, [dispatch])

  const handleAnswerChange = (questionId: string, answer: any) => {
    dispatch(saveAnswer({ questionId, answer }))
  }

  const handleSubmit = async () => {
    if (!studentExamId) return

    const confirmed = window.confirm(
      'Are you sure you want to submit your exam? This action cannot be undone.'
    )

    if (!confirmed) return

    setIsSubmitting(true)

    try {
      // Save all answers before submitting
      await manualSave()

      // Submit exam
      const result = await submitExam(studentExamId).unwrap()

      toast.success('Exam submitted successfully!')
      
      // Navigate to results
      router.push(`/student/results/${result.student_exam_id}`)
    } catch (error: any) {
      toast.error(error.data?.detail || 'Failed to submit exam')
      setIsSubmitting(false)
    }
  }

  const handleTimeUp = () => {
    toast.error('Time is up! Submitting your exam...')
    handleSubmit()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading exam...</p>
        </div>
      </div>
    )
  }

  if (!examData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <p>Failed to load exam</p>
        </div>
      </div>
    )
  }

  const questions = examData.exam.questions
  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100
  const answeredCount = Object.keys(answers).length

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-2">{examData.exam.title}</h1>
          <p className="text-gray-600 mb-4">{examData.exam.description}</p>
          
          <div className="flex items-center gap-4 text-sm">
            <span>
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <span className="text-gray-400">|</span>
            <span>
              Answered: {answeredCount} / {questions.length}
            </span>
          </div>
          
          <Progress value={progress} className="mt-4" />
        </div>

        {/* Timer */}
        <ExamTimer
          totalDuration={examData.exam.duration_minutes * 60}
          onTimeUp={handleTimeUp}
        />

        {/* Current Question */}
        <QuestionDisplay
          question={currentQuestion.question}
          value={answers[currentQuestion.question.id]}
          onChange={(value) => handleAnswerChange(currentQuestion.question.id, value)}
          questionNumber={currentQuestionIndex + 1}
        />

        {/* Navigation */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </Button>

            <div className="flex gap-2">
              {questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
                    index === currentQuestionIndex
                      ? 'bg-blue-600 text-white'
                      : answers[questions[index].question.id]
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            <Button
              onClick={() => setCurrentQuestionIndex(prev => 
                Math.min(questions.length - 1, prev + 1)
              )}
              disabled={currentQuestionIndex === questions.length - 1}
            >
              Next
            </Button>
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={manualSave}
              className="flex-1"
            >
              Save Progress
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Exam'}
            </Button>
          </div>
        </div>

        {/* Question Overview */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="font-semibold mb-2">Question Overview</h3>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-100"></div>
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gray-100"></div>
              <span>Not Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-600"></div>
              <span>Current</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### **src/app/(dashboard)/student/results/[id]/page.tsx**

```typescript
'use client'

import { useParams } from 'next/navigation'
import { useGetStudentResultQuery } from '@/lib/api/resultsApi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { CheckCircle, XCircle, Clock, Award } from 'lucide-react'

export default function StudentResultPage() {
  const params = useParams()
  const studentExamId = params.id as string

  const { data: result, isLoading } = useGetStudentResultQuery(studentExamId)

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            Result not found
          </CardContent>
        </Card>
      </div>
    )
  }

  const percentage = result.percentage
  const getGradeColor = () => {
    if (percentage >= 90) return 'text-green-600'
    if (percentage >= 75) return 'text-blue-600'
    if (percentage >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getGradeLetter = () => {
    if (percentage >= 90) return 'A'
    if (percentage >= 80) return 'B'
    if (percentage >= 70) return 'C'
    if (percentage >= 60) return 'D'
    return 'F'
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">{result.exam_title}</h1>
        <p className="text-gray-600">Exam Results</p>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Your Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {result.total_score} / {result.max_possible_score}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Percentage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getGradeColor()}`}>
              {result.percentage.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Grade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getGradeColor()}`}>
              {getGradeLetter()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Time Taken</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {result.time_taken_minutes} min
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Question Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Question Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {result.questions.map((q, index) => (
              <div
                key={index}
                className="p-4 border rounded-lg"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium">
                        Question {index + 1}
                      </span>
                      {q.is_correct === true && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                      {q.is_correct === false && (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      {q.is_correct === null && (
                        <Clock className="w-5 h-5 text-yellow-600" />
                      )}
                    </div>
                    <h4 className="font-medium">{q.question_title}</h4>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold">
                      {q.score !== null ? q.score : '-'} / {q.max_score}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Your Answer: </span>
                    <span>
                      {Array.isArray(q.student_answer)
                        ? q.student_answer.join(', ')
                        : q.student_answer || 'Not answered'}
                    </span>
                  </div>

                  {q.is_correct === null && (
                    <Badge variant="secondary">Pending Manual Grading</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## 🎯 **Admin Components & Pages**

### **src/components/admin/ExcelImport.tsx**

```typescript
'use client'

import { useState } from 'react'
import { useImportQuestionsMutation } from '@/lib/api/questionsApi'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { Upload, CheckCircle, XCircle } from 'lucide-react'

export function ExcelImport() {
  const [file, setFile] = useState<File | null>(null)
  const [importQuestions, { isLoading, data: result }] = useImportQuestionsMutation()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
        toast.error('Please select an Excel file (.xlsx or .xls)')
        return
      }
      setFile(selectedFile)
    }
  }

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a file first')
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    try {
      const result = await importQuestions(formData).unwrap()
      
      if (result.valid_count > 0) {
        toast.success(`Successfully imported ${result.valid_count} questions!`)
      }
      
      if (result.invalid_count > 0) {
        toast.warning(`${result.invalid_count} questions had errors`)
      }
    } catch (error: any) {
      toast.error(error.data?.detail || 'Import failed')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Questions from Excel</CardTitle>
        <CardDescription>
          Upload an Excel file (.xlsx) with questions
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <Input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            disabled={isLoading}
          />
          
          <Button
            onClick={handleImport}
            disabled={!file || isLoading}
            className="min-w-[120px]"
          >
            {isLoading ? (
              'Importing...'
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Import
              </>
            )}
          </Button>
        </div>

        {result && (
          <div className="space-y-2">
            <Alert>
              <CheckCircle className="w-4 h-4" />
              <AlertDescription>
                <strong>Import Summary:</strong>
                <ul className="mt-2 space-y-1">
                  <li>✅ Valid: {result.valid_count} questions</li>
                  <li>❌ Invalid: {result.invalid_count} questions</li>
                  <li>📊 Total: {result.total_rows} rows</li>
                </ul>
              </AlertDescription>
            </Alert>

            {result.invalid_rows.length > 0 && (
              <Alert variant="destructive">
                <XCircle className="w-4 h-4" />
                <AlertDescription>
                  <strong>Errors:</strong>
                  <ul className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                    {result.invalid_rows.map((row, idx) => (
                      <li key={idx} className="text-sm">
                        Row {row.row}: {row.error}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

### **src/app/(dashboard)/admin/page.tsx**

```typescript
'use client'

import { useGetExamsQuery } from '@/lib/api/examsApi'
import { useGetQuestionsQuery } from '@/lib/api/questionsApi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, BookOpen, Users, TrendingUp } from 'lucide-react'

export default function AdminDashboard() {
  const { data: exams } = useGetExamsQuery({})
  const { data: questions } = useGetQuestionsQuery({})

  const stats = {
    totalExams: exams?.length || 0,
    publishedExams: exams?.filter(e => e.is_published).length || 0,
    totalQuestions: questions?.length || 0,
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600">Manage exams and questions</p>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
            <FileText className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalExams}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.publishedExams}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Questions</CardTitle>
            <BookOpen className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQuestions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <Users className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

---

## 🎨 **Shared Components**

### **src/components/shared/Navbar.tsx**

```typescript
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks'
import { logout, selectCurrentUser } from '@/lib/store/slices/authSlice'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { LogOut, User } from 'lucide-react'

export function Navbar() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const user = useAppSelector(selectCurrentUser)

  const handleLogout = () => {
    dispatch(logout())
    router.push('/login')
  }

  if (!user) return null

  const getInitials = () => {
    return user.full_name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
  }

  return (
    <nav className="bg-white border-b">
      <div className="px-6 py-4 flex items-center justify-between">
        <Link href={user.role === 'admin' ? '/admin' : '/student'}>
          <h1 className="text-xl font-bold">Exam System</h1>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar>
                <AvatarFallback>{getInitials()}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <p className="text-sm font-medium">{user.full_name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem>
              <User className="w-4 h-4 mr-2" />
              Profile
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}
```

---

## 🚀 **Setup Instructions**

### **1. Install Dependencies**

```bash
cd frontend
npm install
```

### **2. Configure Environment**

```bash
cp .env.example .env.local
# Edit .env.local with your backend URL
```

### **3. Run Development Server**

```bash
npm run dev
```

### **4. Build for Production**

```bash
npm run build
npm start
```

---

## ✅ **What's Included**

✅ **Next.js 15** - Latest App Router with React 19export interface SubmitExamResponse {
  success: boolean
  student_exam_id: string
  submitted_at: string
  total_score: number
  max_possible_score: number
  percentage: number
  graded_count: number
  pending_count: number
  results: Array<{
    question_id: string
    question_title: string
    student_answer: any
    is_correct: boolean | null
    score: number | null
    max_score: number
  }>
}

export const participationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get available exams
    getAvailableExams: builder.query<AvailableExam[], void>({
      query: () => '/participation/available',
      providesTags: ['StudentExam'],
    }),
    
    // Start exam
    startExam: builder.mutation<ExamStartResponse, string>({
      query: (examId) => ({
        url: `/participation/start/${examId}`,
        method: 'POST',
      }),
      invalidatesTags: ['StudentExam'],
    }),
    
    // Auto-save answer
    saveAnswer: builder.mutation<SaveAnswerResponse, SaveAnswerRequest>({
      query: (data) => ({
        url: '/participation/save-answer',
        method: 'POST',
        body: data,
      }),
    }),
    
    // Resume exam
    resumeExam: builder.query<ResumeExamResponse, string>({
      query: (examId) => `/participation/resume/${examId}`,
    }),
    
    // Submit exam
    submitExam: builder.mutation<SubmitExamResponse, string>({
      query: (studentExamId) => ({
        url: `/participation/submit/${studentExamId}`,
        method: 'POST',
      }),
      invalidatesTags: ['StudentExam', 'Result'],
    }),
  }),
})

export const {
  useGetAvailableExamsQuery,
  useStartExamMutation,
  useSaveAnswerMutation,
  useResumeExamQuery,
  useSubmitExamMutation,
} = participationApi
```

### **lib/api/resultsApi.ts**

```typescript
import { baseApi } from './baseApi'

export interface StudentResult {
  student_exam_id: string
  exam_title: string
  status: 'not_started' | 'in_progress' | 'submitted' | 'expired'
  score: number | null
  max_score: number
  percentage: number | null
  submitted_at: string | null
}

export interface DetailedResult {
  student_exam_id: string
  exam_title: string
  student_name: string
  status: string
  started_at: string
  submitted_at: string
  time_taken_minutes: number
  total_score: number
  max_possible_score: number
  percentage: number
  questions: Array<{
    question_title: string
    question_type: string
    student_answer: any
    correct_answer?: any
    is_correct: boolean | null
    score: number | null
    max_score: number
  }>
}

export interface ExamResultsSummary {
  exam_id: string
  exam_title: string
  total_students: number
  submitted_count: number
  in_progress_count: number
  not_started_count: number
  average_score: number
  highest_score: number
  lowest_score: number
  student_results: Array<{
    student_exam_id: string
    student_name: string
    student_email: string
    status: string
    score: number | null
    percentage: number | null
    submitted_at: string | null
  }>
}

export const resultsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get student's exam result (detailed)
    getStudentResult: builder.query<DetailedResult, string>({
      query: (studentExamId) => `/results/student/${studentExamId}`,
      providesTags: (result, error, id) => [{ type: 'Result', id }],
    }),
    
    // Get all results for an exam (admin)
    getExamResults: builder.query<ExamResultsSummary, string>({
      query: (examId) => `/results/exam/${examId}`,
      providesTags: (result, error, id) => [{ type: 'Result', id: `exam-${id}` }],
    }),
    
    // Get my results (student)
    getMyResults: builder.query<StudentResult[], void>({
      query: () => '/results/my-results',
      providesTags: ['Result'],
    }),
    
    // Manual grading (admin)
    gradeManualAnswer: builder.mutation<
      any,
      { answerId: string; score: number; is_correct: boolean }
    >({
      query: ({ answerId, ...data }) => ({
        url: `/results/grade-manual/${answerId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Result'],
    }),
  }),
})

export const {
  useGetStudentResultQuery,
  useGetExamResultsQuery,
  useGetMyResultsQuery,
  useGradeManualAnswerMutation,
} = resultsApi
```

---

## 🎨 **App Router Setup**

### **src/app/layout.tsx**

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Online Exam Management System',
  description: 'Complete exam management with auto-grading',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  )
}
```

### **src/app/providers.tsx**

```typescript
'use client'

import { useRef } from 'react'
import { Provider } from 'react-redux'
import { makeStore, AppStore } from '@/lib/store/store'

export function Providers({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore>()
  
  if (!storeRef.current) {
    storeRef.current = makeStore()
  }

  return <Provider store={storeRef.current}>{children}</Provider>
}
```

### **src/app/page.tsx**

```typescript
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-6">
          Online Exam Management System
        </h1>
        
        <p className="text-xl text-gray-600 mb-12">
          Complete exam platform with auto-grading, auto-save, and resume functionality
        </p>
        
        <div className="flex gap-4 justify-center">
          <Link href="/login">
            <Button size="lg" className="px-8">
              Login
            </Button>
          </Link>
          
          <Link href="/register">
            <Button size="lg" variant="outline" className="px-8">
              Register
            </Button>
          </Link>
        </div>
        
        <div className="mt-16 grid md:grid-cols-3 gap-8 text-left">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">Auto-Save</h3>
            <p className="text-gray-600">
              Your answers are automatically saved every 30 seconds
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">Resume Anytime</h3>
            <p className="text-gray-600">
              Browser crashed? Resume your exam from where you left off
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">Instant Results</h3>
            <p className="text-gray-600">
              Get your scores immediately after submission
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

## 🔐 **Authentication Components**

### **src/components/auth/LoginForm.tsx**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useLoginMutation, useGetCurrentUserQuery } from '@/lib/api/authApi'
import { useAppDispatch } from '@/lib/store/hooks'
import { setCredentials } from '@/lib/store/slices/authSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const [login, { isLoading }] = useLoginMutation()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      // Login and get token
      const result = await login({
        username: data.email,
        password: data.password,
      }).unwrap()

      // Fetch user details
      const userResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${result.access_token}`,
          },
        }
      )
      
      const user = await userResponse.json()

      // Store in Redux
      dispatch(
        setCredentials({
          user,
          token: result.access_token,
        })
      )

      toast.success('Login successful!')

      // Redirect based on role
      if (user.role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/student')
      }
    } catch (error: any) {
      toast.error(error.data?.detail || 'Login failed')
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>Enter your credentials to continue</CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="student@example.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
```

### **src/components/auth/RegisterForm.tsx**

```typescript
'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useRegisterMutation } from '@/lib/api/authApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain special character'),
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['admin', 'student']),
})

type RegisterFormData = z.infer<typeof registerSchema>

export function RegisterForm() {
  const router = useRouter()
  const [register, { isLoading }] = useRegisterMutation()
  
  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'student',
    },
  })

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await register(data).unwrap()
      toast.success('Registration successful! Please login.')
      router.push('/login')
    } catch (error: any) {
      toast.error(error.data?.detail || 'Registration failed')
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Register</CardTitle>
        <CardDescription>Create a new account</CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              placeholder="John Doe"
              {...registerField('full_name')}
            />
            {errors.full_name && (
              <p className="text-sm text-red-500 mt-1">{errors.full_name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="student@example.com"
              {...registerField('email')}
            />
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...registerField('password')}
            />
            {errors.password && (
              <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Must contain uppercase, lowercase, number, and special character
            </p>
          </div>

          <div>
            <Label htmlFor="role">Role</Label>
            <Select
              defaultValue="student"
              onValueChange={(value) => setValue('role', value as 'admin' | 'student')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-red-500 mt-1">{errors.role.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Register'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
```

### **src/components/auth/ProtectedRoute.tsx**

```typescript
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppSelector } from '@/lib/store/hooks'
import { selectIsAuthenticated, selectUserRole } from '@/lib/store/slices/authSlice'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: ('admin' | 'student')[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter()
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const userRole = useAppSelector(selectUserRole)

  useEffect(() => {
    // Not authenticated - redirect to login
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    // Authenticated but wrong role - redirect to correct dashboard
    if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
      if (userRole === 'admin') {
        router.push('/admin')
      } else {
        router.push('/student')
      }
    }
  }, [isAuthenticated, userRole, allowedRoles, router])

  // Show loading or nothing while checking
  if (!isAuthenticated) {
    return null
  }

  // Role mismatch
  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    return null
  }

  return <>{children}</>
}
```

---

## 🎓 **Student Components**

### **src/components/student/ExamCard.tsx**

```typescript
'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { Clock, FileText, Award } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AvailableExam } from '@/lib/api/participationApi'

interface ExamCardProps {
  exam: AvailableExam
}

export function ExamCard({ exam }: ExamCardProps) {
  const getStatusColor = () => {
    switch (exam.status) {
      case 'not_started':
        return 'bg-blue-500'
      case 'in_progress':
        return 'bg-yellow-500'
      case 'submitted':
        return 'bg-green-500'
      case 'expired':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusText = () => {
    switch (exam.status) {
      case 'not_started':
        return 'Not Started'
      case 'in_progress':
        return 'In Progress'
      case 'submitted':
        return 'Completed'
      case 'expired':
        return 'Expired'
      default:
        return exam.status
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-xl">{exam.title}</CardTitle>
          <Badge className={getStatusColor()}>
            {getStatusText()}
          </Badge>
        </div>
        {exam.description && (
          <CardDescription>{exam.description}</CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          <span>Duration: {exam.duration_minutes} minutes</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <FileText className="w-4 h-4" />
          <span>Questions: {exam.question_count}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Award className="w-4 h-4" />
          <span>Total Score: {exam.total_score}</span>
        </div>

        <div className="text-sm text-gray-600">
          <p>
            <strong>Available:</strong>{' '}
            {format(new Date(exam.start_time), 'MMM dd, yyyy HH:mm')} -{' '}
            {format(new Date(exam.end_time), 'MMM dd, yyyy HH:mm')}
          </p>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        {exam.can_start && (
          <Link href={`/student/exams/${exam.exam_id}/start`} className="flex-1">
            <Button className="w-full">Start Exam</Button>
          </Link>
        )}

        {exam.can_resume && (
          <Link href={`/student/exams/${exam.exam_id}/take`} className="flex-1">
            <Button variant="outline" className="w-full">
              Resume Exam
            </Button>
          </Link>
        )}

        {exam.status === 'submitted' && (
          <Link href={`/student/results`} className="flex-1">
            <Button variant="secondary" className="w-full">
              View Result
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  )
}
```

### **src/components/student/ExamTimer.tsx**

```typescript
'use client'

import { useEffect } from 'react'
import { Clock } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks'
import { decrementTime, selectTimeRemaining } from '@/lib/store/slices/examSlice'
import { Progress } from '@/components/ui/progress'

interface ExamTimerProps {
  totalDuration: number // in seconds
  onTimeUp: () => void
}

export function ExamTimer({ totalDuration, onTimeUp }: ExamTimerProps) {
  const dispatch = useAppDispatch()
  const timeRemaining = useAppSelector(selectTimeRemaining)

  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) {
      if (timeRemaining === 0) {
        onTimeUp()
      }
      return
    }

    const timer = setInterval(() => {
      dispatch(decrementTime())
    }, 1000)

    return () => clearInterval(timer)
  }, [timeRemaining, dispatch, onTimeUp])

  if (timeRemaining === null) return null

  const minutes = Math.floor(timeRemaining / 60)
  const seconds = timeRemaining % 60
  const progress = ((totalDuration - timeRemaining) / totalDuration) * 100

  const getColorClass = () => {
    if (timeRemaining < 300) return 'text-red-600' // < 5 minutes
    if (timeRemaining < 600) return 'text-yellow-600' // < 10 minutes
    return 'text-green-600'
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          <span className="font-semibold">Time Remaining</span>
        </div>
        <span className={`text-2xl font-bold ${getColorClass()}`}>
          {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
        </span>
      </div>
      
      <Progress value={progress} className="h-2" />
      
      {timeRemaining < 300 && (
        <p className="text-sm text-red-600 font-medium">
          ⚠️ Less than 5 minutes remaining!
        </p>
      )}
    </div>
  )
}
```

### **src/components/student/QuestionDisplay.tsx**

```typescript
'use client'

import { Question } from '@/lib/api/questionsApi'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface QuestionDisplayProps {
  question: Question
  value: any
  onChange: (value: any) => void
  questionNumber: number
}

export function QuestionDisplay({
  question,
  value,
  onChange,
  questionNumber,
}: QuestionDisplayProps) {
  const renderAnswerInput = () => {
    switch (question.type) {
      case 'single_choice':
        return (
          <RadioGroup value={value || ''} onValueChange={onChange}>
            <div className="space-y-3">
              {question.options?.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.id} id={option.id} />
                  <Label htmlFor={option.id} className="cursor-pointer">
                    {option.text}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        )

      case 'multi_choice':
        const selectedValues = value || []
        return (
          <div className="space-y-3">
            {question.options?.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <Checkbox
                  id={option.id}
                  checked={selectedValues.includes(option.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onChange([...selectedValues, option.id])
                    } else {
                      onChange(selectedValues.filter((id: string) => id !== option.id))
                    }
                  }}
                />
                <Label htmlFor={option.id} className="cursor-pointer">
                  {option.text}
                </Label>
              </div>
            ))}
          </div>
        )

      case 'text':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Type your answer here..."
            rows={6}
            className="w-full"
          />
        )

      case 'image_upload':
        return (
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  // Handle file upload
                  onChange(file)
                }
              }}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="cursor-pointer text-blue-600 hover:text-blue-700"
            >
              Click to upload image
            </label>
            {value && (
              <p className="mt-2 text-sm text-gray-600">
                File selected: {value.name}
              </p>
            )}
          </div>
        )

      default:
        return <p>Unsupported question type</p>
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              Question {questionNumber}
            </span>
            <span className="text-sm text-gray-500">
              ({question.max_score} {question.max_score === 1 ? 'point' : 'points'})
            </span>
          </div>
          
          <h3 className="text-lg font-semibold mb-2">{question.title}</h3>
          
          {question.description && (
            <p className="text-gray-600 text-sm mb-4">{question.description}</p>
          )}
        </div>
      </div>

      {renderAnswerInput()}
    </div>
  )
}
```

### **src/hooks/useAutoSave.ts**

```typescript
'use client'

import { useEffect, useRef } from 'react'
import { useSaveAnswerMutation } from '@/lib/api/participationApi'
import { useAppSelector } from '@/lib/store/hooks'
import { selectAllAnswers } from '@/lib/store/slices/examSlice'
import { toast } from 'sonner'

export function useAutoSave(studentExamId: string | null, enabled: boolean = true) {
  const [saveAnswer] = useSaveAnswerMutation()
  const answers = useAppSelector(selectAllAnswers)
  const previousAnswersRef = useRef<Record<string, any>>({})
  const saveIntervalRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (!enabled || !studentExamId) return

    // Auto-save every 30 seconds
    saveIntervalRef.current = setInterval(async () => {
      // Check for changed answers
      const changedQuestions = Object.keys(answers).filter(
        (questionId) => 
          answers[questionId] !== previousAnswersRef.current[questionId]
      )

      # Online Exam System - Next.js Frontend (Latest 2024)

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                           # Next.js 14 App Router
│   │   ├── (auth)/                    # Auth layout group
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/               # Dashboard layout group
│   │   │   ├── admin/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx           # Admin dashboard
│   │   │   │   ├── questions/
│   │   │   │   │   ├── page.tsx       # Question list
│   │   │   │   │   ├── import/
│   │   │   │   │   │   └── page.tsx   # Import Excel
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── page.tsx   # Edit question
│   │   │   │   ├── exams/
│   │   │   │   │   ├── page.tsx       # Exam list
│   │   │   │   │   ├── create/
│   │   │   │   │   │   └── page.tsx   # Create exam
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── page.tsx   # Exam details
│   │   │   │   │       ├── edit/
│   │   │   │   │       │   └── page.tsx
│   │   │   │   │       └── results/
│   │   │   │   │           └── page.tsx
│   │   │   │   └── results/
│   │   │   │       └── page.tsx       # All results
│   │   │   └── student/
│   │   │       ├── layout.tsx
│   │   │       ├── page.tsx           # Student dashboard
│   │   │       ├── exams/
│   │   │       │   ├── page.tsx       # Available exams
│   │   │       │   └── [id]/
│   │   │       │       ├── start/
│   │   │       │       │   └── page.tsx
│   │   │       │       └── take/
│   │   │       │           └── page.tsx # Taking exam
│   │   │       └── results/
│   │   │           ├── page.tsx       # My results
│   │   │           └── [id]/
│   │   │               └── page.tsx   # Result detail
│   │   ├── layout.tsx                 # Root layout
│   │   ├── page.tsx                   # Home/landing page
│   │   └── providers.tsx              # Redux provider
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── admin/
│   │   │   ├── QuestionList.tsx
│   │   │   ├── QuestionForm.tsx
│   │   │   ├── ExcelImport.tsx
│   │   │   ├── ExamForm.tsx
│   │   │   ├── ExamList.tsx
│   │   │   └── ResultsTable.tsx
│   │   ├── student/
│   │   │   ├── ExamCard.tsx
│   │   │   ├── ExamTimer.tsx
│   │   │   ├── QuestionDisplay.tsx
│   │   │   ├── AnswerInput.tsx
│   │   │   └── ResultCard.tsx
│   │   ├── shared/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Loading.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   └── Toast.tsx
│   │   └── ui/                        # shadcn/ui components
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       └── ...
│   ├── lib/
│   │   ├── store/                     # Redux store
│   │   │   ├── store.ts               # Store configuration
│   │   │   ├── hooks.ts               # Typed hooks
│   │   │   └── slices/
│   │   │       ├── authSlice.ts
│   │   │       ├── examSlice.ts
│   │   │       └── uiSlice.ts
│   │   ├── api/                       # RTK Query APIs
│   │   │   ├── baseApi.ts             # Base API configuration
│   │   │   ├── authApi.ts
│   │   │   ├── questionsApi.ts
│   │   │   ├── examsApi.ts
│   │   │   ├── participationApi.ts
│   │   │   └── resultsApi.ts
│   │   ├── utils/
│   │   │   ├── cn.ts                  # Class name utility
│   │   │   ├── formatters.ts
│   │   │   └── validators.ts
│   │   └── types/
│   │       ├── auth.types.ts
│   │       ├── question.types.ts
│   │       ├── exam.types.ts
│   │       └── result.types.ts
│   └── hooks/
│       ├── useAuth.ts
│       ├── useExamTimer.ts
│       ├── useAutoSave.ts
│       └── useToast.ts
├── public/
│   ├── images/
│   └── icons/
├── .env.local
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 📦 **Package.json (Latest Versions)**

```json
{
  "name": "exam-management-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^15.0.3",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@reduxjs/toolkit": "^2.3.0",
    "react-redux": "^9.1.2",
    "@tanstack/react-query": "^5.59.20",
    "@tanstack/react-query-devtools": "^5.59.20",
    "axios": "^1.7.7",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.4",
    "class-variance-authority": "^0.7.1",
    "lucide-react": "^0.454.0",
    "react-hook-form": "^7.53.2",
    "zod": "^3.23.8",
    "@hookform/resolvers": "^3.9.1",
    "date-fns": "^4.1.0",
    "sonner": "^1.7.1",
    "zustand": "^5.0.1"
  },
  "devDependencies": {
    "@types/node": "^22.9.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.6.3",
    "tailwindcss": "^3.4.14",
    "postcss": "^8.4.47",
    "autoprefixer": "^10.4.20",
    "eslint": "^8.57.1",
    "eslint-config-next": "^15.0.3"
  }
}
```

---

## ⚙️ **Configuration Files**

### **next.config.js**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Environment variables exposed to client
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  
  // Image optimization
  images: {
    domains: ['localhost'],
  },
  
  // Experimental features
  experimental: {
    optimizeCss: true,
  },
}

module.exports = nextConfig
```

### **tailwind.config.ts**

```typescript
import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
```

### **tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/hooks/*": ["./src/hooks/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### **.env.example**

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# App Configuration
NEXT_PUBLIC_APP_NAME=Exam Management System
NEXT_PUBLIC_APP_VERSION=1.0.0

# Feature Flags
NEXT_PUBLIC_ENABLE_AUTO_SAVE=true
NEXT_PUBLIC_AUTO_SAVE_INTERVAL=30000
```

---

## 🔧 **Redux Store Setup**

### **lib/store/store.ts**

```typescript
import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { baseApi } from '@/lib/api/baseApi'
import authReducer from './slices/authSlice'
import examReducer from './slices/examSlice'
import uiReducer from './slices/uiSlice'

export const makeStore = () => {
  const store = configureStore({
    reducer: {
      // RTK Query API
      [baseApi.reducerPath]: baseApi.reducer,
      
      // Regular slices
      auth: authReducer,
      exam: examReducer,
      ui: uiReducer,
    },
    
    // Adding the api middleware enables caching, invalidation, polling
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
    
    devTools: process.env.NODE_ENV !== 'production',
  })

  // Setup listeners for refetchOnFocus and refetchOnReconnect
  setupListeners(store.dispatch)

  return store
}

// Infer types from store
export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
```

### **lib/store/hooks.ts**

```typescript
import { useDispatch, useSelector, useStore } from 'react-redux'
import type { AppDispatch, AppStore, RootState } from './store'

// Typed hooks for better TypeScript support
export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
export const useAppStore = useStore.withTypes<AppStore>()
```

### **lib/store/slices/authSlice.ts**

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface User {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'student'
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

const initialState: AuthState = {
  user: null,
  token: typeof window !== 'undefined' 
    ? localStorage.getItem('access_token') 
    : null,
  isAuthenticated: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string }>
    ) => {
      state.user = action.payload.user
      state.token = action.payload.token
      state.isAuthenticated = true
      
      // Persist token
      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', action.payload.token)
      }
    },
    
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      
      // Clear persisted token
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token')
      }
    },
    
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
      }
    },
  },
})

export const { setCredentials, logout, updateUser } = authSlice.actions
export default authSlice.reducer

// Selectors
export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user
export const selectIsAuthenticated = (state: { auth: AuthState }) => 
  state.auth.isAuthenticated
export const selectUserRole = (state: { auth: AuthState }) => 
  state.auth.user?.role
```

### **lib/store/slices/examSlice.ts**

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface Answer {
  question_id: string
  answer: any
  answered_at: string
}

interface ExamState {
  currentExamId: string | null
  studentExamId: string | null
  answers: Record<string, any>  // question_id -> answer
  timeRemaining: number | null   // seconds
  isSubmitting: boolean
  lastSaved: string | null
}

const initialState: ExamState = {
  currentExamId: null,
  studentExamId: null,
  answers: {},
  timeRemaining: null,
  isSubmitting: false,
  lastSaved: null,
}

const examSlice = createSlice({
  name: 'exam',
  initialState,
  reducers: {
    startExam: (
      state,
      action: PayloadAction<{ 
        examId: string
        studentExamId: string
        timeRemaining: number 
      }>
    ) => {
      state.currentExamId = action.payload.examId
      state.studentExamId = action.payload.studentExamId
      state.timeRemaining = action.payload.timeRemaining
      state.answers = {}
    },
    
    saveAnswer: (
      state,
      action: PayloadAction<{ questionId: string; answer: any }>
    ) => {
      state.answers[action.payload.questionId] = action.payload.answer
      state.lastSaved = new Date().toISOString()
    },
    
    loadSavedAnswers: (
      state,
      action: PayloadAction<Record<string, any>>
    ) => {
      state.answers = action.payload
    },
    
    decrementTime: (state) => {
      if (state.timeRemaining && state.timeRemaining > 0) {
        state.timeRemaining -= 1
      }
    },
    
    setSubmitting: (state, action: PayloadAction<boolean>) => {
      state.isSubmitting = action.payload
    },
    
    resetExam: (state) => {
      state.currentExamId = null
      state.studentExamId = null
      state.answers = {}
      state.timeRemaining = null
      state.isSubmitting = false
      state.lastSaved = null
    },
  },
})

export const {
  startExam,
  saveAnswer,
  loadSavedAnswers,
  decrementTime,
  setSubmitting,
  resetExam,
} = examSlice.actions

export default examSlice.reducer

// Selectors
export const selectCurrentAnswer = (questionId: string) => 
  (state: { exam: ExamState }) => state.exam.answers[questionId]

export const selectAllAnswers = (state: { exam: ExamState }) => 
  state.exam.answers

export const selectTimeRemaining = (state: { exam: ExamState }) => 
  state.exam.timeRemaining
```

### **lib/store/slices/uiSlice.ts**

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
}

interface UIState {
  sidebarOpen: boolean
  loading: boolean
  toasts: Toast[]
}

const initialState: UIState = {
  sidebarOpen: true,
  loading: false,
  toasts: [],
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    
    addToast: (state, action: PayloadAction<Omit<Toast, 'id'>>) => {
      const id = Date.now().toString()
      state.toasts.push({ ...action.payload, id })
    },
    
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter(t => t.id !== action.payload)
    },
  },
})

export const { toggleSidebar, setLoading, addToast, removeToast } = 
  uiSlice.actions

export default uiSlice.reducer
```

---

## 🌐 **RTK Query API Setup**

### **lib/api/baseApi.ts**

```typescript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { RootState } from '@/lib/store/store'

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  
  // Attach token to every request
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token
    
    if (token) {
      headers.set('authorization', `Bearer ${token}`)
    }
    
    return headers
  },
})

// Base query with error handling
const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  let result = await baseQuery(args, api, extraOptions)
  
  if (result.error && result.error.status === 401) {
    // Token expired - redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }
  
  return result
}

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  
  // Tag types for cache invalidation
  tagTypes: ['User', 'Question', 'Exam', 'StudentExam', 'Result'],
  
  endpoints: () => ({}),
})
```

### **lib/api/authApi.ts**

```typescript
import { baseApi } from './baseApi'

export interface LoginRequest {
  username: string  // email
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  full_name: string
  role: 'admin' | 'student'
}

export interface AuthResponse {
  access_token: string
  token_type: string
}

export interface User {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'student'
  is_active: boolean
  created_at: string
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Login
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: new URLSearchParams(credentials),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }),
    }),
    
    // Register
    register: builder.mutation<User, RegisterRequest>({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
    }),
    
    // Get current user
    getCurrentUser: builder.query<User, void>({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),
  }),
})

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetCurrentUserQuery,
} = authApi
```

### **lib/api/questionsApi.ts**

```typescript
import { baseApi } from './baseApi'

export interface Question {
  id: string
  title: string
  description?: string
  complexity: string
  type: 'single_choice' | 'multi_choice' | 'text' | 'image_upload'
  options?: Array<{ id: string; text: string }>
  correct_answers: any[]
  max_score: number
  tags?: string[]
  created_at: string
  updated_at: string
}

export interface ImportResult {
  total_rows: number
  valid_count: number
  invalid_count: number
  valid_questions: Question[]
  invalid_rows: any[]
}

export const questionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Import questions from Excel
    importQuestions: builder.mutation<ImportResult, FormData>({
      query: (formData) => ({
        url: '/questions/import',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Question'],
    }),
    
    // List questions with filters
    getQuestions: builder.query<
      Question[],
      {
        skip?: number
        limit?: number
        complexity?: string
        type?: string
        search?: string
      }
    >({
      query: (params) => ({
        url: '/questions',
        params,
      }),
      providesTags: ['Question'],
    }),
    
    // Get single question
    getQuestion: builder.query<Question, string>({
      query: (id) => `/questions/${id}`,
      providesTags: (result, error, id) => [{ type: 'Question', id }],
    }),
    
    // Update question
    updateQuestion: builder.mutation<
      Question,
      { id: string; data: Partial<Question> }
    >({
      query: ({ id, data }) => ({
        url: `/questions/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Question', id },
        'Question',
      ],
    }),
    
    // Delete question
    deleteQuestion: builder.mutation<void, string>({
      query: (id) => ({
        url: `/questions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Question'],
    }),
  }),
})

export const {
  useImportQuestionsMutation,
  useGetQuestionsQuery,
  useGetQuestionQuery,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation,
} = questionsApi
```

### **lib/api/examsApi.ts**

```typescript
import { baseApi } from './baseApi'
import { Question } from './questionsApi'

export interface Exam {
  id: string
  title: string
  description?: string
  start_time: string
  end_time: string
  duration_minutes: number
  is_published: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface ExamWithQuestions extends Exam {
  questions: Array<{
    question: Question
    order: number
  }>
}

export interface CreateExamRequest {
  title: string
  description?: string
  start_time: string
  end_time: string
  duration_minutes: number
  question_ids: string[]
}

export const examsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Create exam
    createExam: builder.mutation<ExamWithQuestions, CreateExamRequest>({
      query: (data) => ({
        url: '/exams',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Exam'],
    }),
    
    // List exams
    getExams: builder.query<Exam[], { is_published?: boolean }>({
      query: (params) => ({
        url: '/exams',
        params,
      }),
      providesTags: ['Exam'],
    }),
    
    // Get exam details
    getExam: builder.query<ExamWithQuestions, string>({
      query: (id) => `/exams/${id}`,
      providesTags: (result, error, id) => [{ type: 'Exam', id }],
    }),
    
    // Update exam
    updateExam: builder.mutation<
      Exam,
      { id: string; data: Partial<CreateExamRequest> }
    >({
      query: ({ id, data }) => ({
        url: `/exams/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Exam', id },
        'Exam',
      ],
    }),
    
    // Publish/unpublish exam
    togglePublish: builder.mutation<Exam, { id: string; is_published: boolean }>({
      query: ({ id, is_published }) => ({
        url: `/exams/${id}/publish`,
        method: 'PUT',
        body: { is_published },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Exam', id },
        'Exam',
      ],
    }),
    
    // Delete exam
    deleteExam: builder.mutation<void, string>({
      query: (id) => ({
        url: `/exams/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Exam'],
    }),
  }),
})

export const {
  useCreateExamMutation,
  useGetExamsQuery,
  useGetExamQuery,
  useUpdateExamMutation,
  useTogglePublishMutation,
  useDeleteExamMutation,
} = examsApi
```

### **lib/api/participationApi.ts**

```typescript
import { baseApi } from './baseApi'
import { ExamWithQuestions } from './examsApi'

export interface AvailableExam {
  exam_id: string
  title: string
  description?: string
  start_time: string
  end_time: string
  duration_minutes: number
  question_count: number
  total_score: number
  status: 'not_started' | 'in_progress' | 'submitted' | 'expired'
  can_start: boolean
  can_resume: boolean
}

export interface ExamStartResponse {
  student_exam_id: string
  exam: ExamWithQuestions
  started_at: string
  deadline: string
}

export interface SaveAnswerRequest {
  student_exam_id: string
  question_id: string
  answer: any
}

export interface SaveAnswerResponse {
  success: boolean
  message: string
  saved_at: string
}

export interface ResumeExamResponse {
  student_exam_id: string
  exam: ExamWithQuestions
  started_at: string
  deadline: string
  saved_answers: Record<string, any>
  time_remaining_seconds: number
}

export interface SubmitExamResponse {
  success: boolean
  student_exam