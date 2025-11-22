# Complete RTK Query APIs, Hooks & Real-Time Exam System

## 📋 **Implementation Checklist**

```
✅ Base API Configuration
✅ Auth API (Login, Register, Get User)
✅ Questions API (Import, CRUD)
✅ Exams API (Create, Update, Delete, Publish)
✅ Participation API (Start, Save, Resume, Submit)
✅ Results API (Get Results, Grading)
✅ Custom Hooks (Auto-save, Timer, Exam State)
✅ Real-Time Exam Components (Timer, Question Display, Navigation)
```

---

## 🔌 **PART 1: All RTK Query API Endpoints**

### **File: `src/lib/api/questionsApi.ts`**

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
  invalid_rows: Array<{
    row: number
    error: string
    data: any
  }>
}

export interface QuestionFilters {
  skip?: number
  limit?: number
  complexity?: string
  type?: string
  search?: string
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
    
    // Get all questions with filters
    getQuestions: builder.query<Question[], QuestionFilters>({
      query: (params) => ({
        url: '/questions',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Question' as const, id })),
              { type: 'Question', id: 'LIST' },
            ]
          : [{ type: 'Question', id: 'LIST' }],
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
        { type: 'Question', id: 'LIST' },
      ],
    }),
    
    // Delete question
    deleteQuestion: builder.mutation<void, string>({
      query: (id) => ({
        url: `/questions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Question', id: 'LIST' }],
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

---

### **File: `src/lib/api/examsApi.ts`**

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
      invalidatesTags: [{ type: 'Exam', id: 'LIST' }],
    }),
    
    // Get all exams
    getExams: builder.query<Exam[], { is_published?: boolean }>({
      query: (params) => ({
        url: '/exams',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Exam' as const, id })),
              { type: 'Exam', id: 'LIST' },
            ]
          : [{ type: 'Exam', id: 'LIST' }],
    }),
    
    // Get exam with questions
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
        { type: 'Exam', id: 'LIST' },
      ],
    }),
    
    // Toggle publish status
    togglePublish: builder.mutation<Exam, { id: string; is_published: boolean }>({
      query: ({ id, is_published }) => ({
        url: `/exams/${id}/publish`,
        method: 'PUT',
        body: { is_published },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Exam', id },
        { type: 'Exam', id: 'LIST' },
      ],
    }),
    
    // Delete exam
    deleteExam: builder.mutation<void, string>({
      query: (id) => ({
        url: `/exams/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Exam', id: 'LIST' }],
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

---

### **File: `src/lib/api/resultsApi.ts`**

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
    // Get detailed result
    getStudentResult: builder.query<DetailedResult, string>({
      query: (studentExamId) => `/results/student/${studentExamId}`,
      providesTags: (result, error, id) => [{ type: 'Result', id }],
    }),
    
    // Get exam results summary (admin)
    getExamResults: builder.query<ExamResultsSummary, string>({
      query: (examId) => `/results/exam/${examId}`,
      providesTags: (result, error, id) => [{ type: 'Result', id: `exam-${id}` }],
    }),
    
    // Get my results (student)
    getMyResults: builder.query<StudentResult[], void>({
      query: () => '/results/my-results',
      providesTags: [{ type: 'Result', id: 'MY_RESULTS' }],
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
      invalidatesTags: [{ type: 'Result', id: 'LIST' }],
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

## 🪝 **PART 2: Custom Hooks**

### **File: `src/hooks/useAutoSave.ts`**

```typescript
'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useSaveAnswerMutation } from '@/lib/api/participationApi'
import { useAppSelector } from '@/lib/store/hooks'
import { selectAllAnswers } from '@/lib/store/slices/examSlice'
import { toast } from 'sonner'

interface UseAutoSaveOptions {
  studentExamId: string | null
  enabled?: boolean
  interval?: number // milliseconds
}

/**
 * Hook for auto-saving exam answers
 * Saves changed answers every 30 seconds (configurable)
 */
export function useAutoSave({
  studentExamId,
  enabled = true,
  interval = 30000, // 30 seconds default
}: UseAutoSaveOptions) {
  const [saveAnswer, { isLoading }] = useSaveAnswerMutation()
  const answers = useAppSelector(selectAllAnswers)
  const previousAnswersRef = useRef<Record<string, any>>({})
  const saveIntervalRef = useRef<NodeJS.Timeout>()
  const isSavingRef = useRef(false)

  // Save changed answers
  const saveChangedAnswers = useCallback(async () => {
    if (!studentExamId || isSavingRef.current) return

    // Find changed answers
    const changedQuestions = Object.keys(answers).filter(
      (questionId) =>
        JSON.stringify(answers[questionId]) !==
        JSON.stringify(previousAnswersRef.current[questionId])
    )

    if (changedQuestions.length === 0) return

    isSavingRef.current = true

    try {
      // Save all changed answers
      const promises = changedQuestions.map((questionId) =>
        saveAnswer({
          student_exam_id: studentExamId,
          question_id: questionId,
          answer: answers[questionId],
        }).unwrap()
      )

      await Promise.all(promises)

      // Update reference
      previousAnswersRef.current = { ...answers }

      console.log(`✓ Auto-saved ${changedQuestions.length} answer(s)`)
    } catch (error) {
      console.error('Auto-save failed:', error)
      // Don't show toast to avoid annoying user
    } finally {
      isSavingRef.current = false
    }
  }, [studentExamId, answers, saveAnswer])

  // Setup auto-save interval
  useEffect(() => {
    if (!enabled || !studentExamId) return

    // Initial save
    saveChangedAnswers()

    // Setup interval
    saveIntervalRef.current = setInterval(saveChangedAnswers, interval)

    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current)
      }
    }
  }, [enabled, studentExamId, interval, saveChangedAnswers])

  // Manual save function
  const manualSave = useCallback(async () => {
    if (!studentExamId) {
      toast.error('Cannot save: No active exam session')
      return
    }

    try {
      const promises = Object.entries(answers).map(([questionId, answer]) =>
        saveAnswer({
          student_exam_id: studentExamId,
          question_id: questionId,
          answer,
        }).unwrap()
      )

      await Promise.all(promises)
      previousAnswersRef.current = { ...answers }
      toast.success('All answers saved successfully')
    } catch (error) {
      toast.error('Failed to save answers')
      throw error
    }
  }, [studentExamId, answers, saveAnswer])

  return {
    manualSave,
    isSaving: isLoading,
  }
}
```

---

### **File: `src/hooks/useExamTimer.ts`**

```typescript
'use client'

import { useEffect, useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks'
import { decrementTime, selectTimeRemaining } from '@/lib/store/slices/examSlice'

interface UseExamTimerOptions {
  onTimeUp: () => void
  enabled?: boolean
}

/**
 * Hook for managing exam countdown timer
 * Decrements time every second and triggers callback when time is up
 */
export function useExamTimer({ onTimeUp, enabled = true }: UseExamTimerOptions) {
  const dispatch = useAppDispatch()
  const timeRemaining = useAppSelector(selectTimeRemaining)

  const handleTimeUp = useCallback(() => {
    onTimeUp()
  }, [onTimeUp])

  useEffect(() => {
    if (!enabled || timeRemaining === null || timeRemaining <= 0) {
      if (timeRemaining === 0) {
        handleTimeUp()
      }
      return
    }

    const timer = setInterval(() => {
      dispatch(decrementTime())
    }, 1000)

    return () => clearInterval(timer)
  }, [enabled, timeRemaining, dispatch, handleTimeUp])

  // Format time as MM:SS
  const formatTime = useCallback((seconds: number | null): string => {
    if (seconds === null) return '--:--'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  // Get warning level
  const getWarningLevel = useCallback((seconds: number | null): 'normal' | 'warning' | 'critical' => {
    if (seconds === null) return 'normal'
    if (seconds < 300) return 'critical' // < 5 minutes
    if (seconds < 600) return 'warning' // < 10 minutes
    return 'normal'
  }, [])

  return {
    timeRemaining,
    formattedTime: formatTime(timeRemaining),
    warningLevel: getWarningLevel(timeRemaining),
    isTimeUp: timeRemaining === 0,
  }
}
```

---

### **File: `src/hooks/useExamSession.ts`**

```typescript
'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAppDispatch } from '@/lib/store/hooks'
import { startExam, resetExam } from '@/lib/store/slices/examSlice'
import { 
  useStartExamMutation, 
  useResumeExamQuery,
  useSubmitExamMutation,
  ExamStartResponse,
  ResumeExamResponse 
} from '@/lib/api/participationApi'
import { toast } from 'sonner'

/**
 * Hook for managing complete exam session lifecycle
 */
export function useExamSession(examId: string) {
  const router = useRouter()
  const dispatch = useAppDispatch()
  
  const [startExamMutation, { isLoading: isStarting }] = useStartExamMutation()
  const [submitExamMutation, { isLoading: isSubmitting }] = useSubmitExamMutation()

  // Initialize exam session
  const initializeExam = useCallback(
    (data: ExamStartResponse | ResumeExamResponse) => {
      const timeRemaining = 'time_remaining_seconds' in data
        ? data.time_remaining_seconds
        : calculateTimeRemaining(data.started_at, data.deadline)

      dispatch(
        startExam({
          examId: data.exam.id,
          studentExamId: data.student_exam_id,
          timeRemaining,
        })
      )

      // Load saved answers if resuming
      if ('saved_answers' in data && data.saved_answers) {
        // Will be handled in component
      }
    },
    [dispatch]
  )

  // Start new exam
  const handleStartExam = useCallback(async () => {
    try {
      const result = await startExamMutation(examId).unwrap()
      initializeExam(result)
      toast.success('Exam started successfully')
      return result
    } catch (error: any) {
      toast.error(error.data?.detail || 'Failed to start exam')
      throw error
    }
  }, [examId, startExamMutation, initializeExam])

  // Submit exam
  const handleSubmitExam = useCallback(
    async (studentExamId: string) => {
      try {
        const result = await submitExamMutation(studentExamId).unwrap()
        toast.success('Exam submitted successfully!')
        dispatch(resetExam())
        router.push(`/student/results/${result.student_exam_id}`)
        return result
      } catch (error: any) {
        toast.error(error.data?.detail || 'Failed to submit exam')
        throw error
      }
    },
    [submitExamMutation, dispatch, router]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Don't reset exam state on unmount (for resume)
    }
  }, [])

  return {
    handleStartExam,
    handleSubmitExam,
    initializeExam,
    isStarting,
    isSubmitting,
  }
}

// Helper function
function calculateTimeRemaining(startedAt: string, deadline: string): number {
  const now = new Date().getTime()
  const deadlineTime = new Date(deadline).getTime()
  const remainingMs = deadlineTime - now
  return Math.max(0, Math.floor(remainingMs / 1000))
}
```

---

## 🎨 **PART 3: Real-Time Exam Components**

### **File: `src/components/student/ExamTimer.tsx`**

```typescript
'use client'

import { Clock, AlertCircle } from 'lucide-react'
import { useExamTimer } from '@/hooks/useExamTimer'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ExamTimerProps {
  totalDuration: number // in seconds
  onTimeUp: () => void
}

export function ExamTimer({ totalDuration, onTimeUp }: ExamTimerProps) {
  const { timeRemaining, formattedTime, warningLevel } = useExamTimer({
    onTimeUp,
    enabled: true,
  })

  if (timeRemaining === null) return null

  const progress = ((totalDuration - timeRemaining) / totalDuration) * 100

  const getColorClass = () => {
    switch (warningLevel) {
      case 'critical':
        return 'text-red-600'
      case 'warning':
        return 'text-yellow-600'
      default:
        return 'text-green-600'
    }
  }

  const getProgressColor = () => {
    switch (warningLevel) {
      case 'critical':
        return 'bg-red-600'
      case 'warning':
        return 'bg-yellow-600'
      default:
        return 'bg-blue-600'
    }
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-600" />
          <span className="font-semibold text-gray-700">Time Remaining</span>
        </div>
        <span className={`text-3xl font-bold ${getColorClass()}`}>
          {formattedTime}
        </span>
      </div>

      <div className="space-y-2">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-xs text-gray-500">
          <span>Elapsed</span>
          <span>
            {Math.floor((totalDuration - timeRemaining) / 60)} min
          </span>
        </div>
      </div>

      {warningLevel === 'critical' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Less than 5 minutes remaining! Please finish soon.
          </AlertDescription>
        </Alert>
      )}

      {warningLevel === 'warning' && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Less than 10 minutes remaining.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
```

---

### **File: `src/components/student/QuestionDisplay.tsx`**

```typescript
'use client'

import { Question } from '@/lib/api/questionsApi'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

interface QuestionDisplayProps {
  question: Question
  value: any
  onChange: (value: any) => void
  questionNumber: number
  totalQuestions: number
}

export function QuestionDisplay({
  question,
  value,
  onChange,
  questionNumber,
  totalQuestions,
}: QuestionDisplayProps) {
  const renderAnswerInput = () => {
    switch (question.type) {
      case 'single_choice':
        return (
          <RadioGroup value={value || ''} onValueChange={onChange}>
            <div className="space-y-3">
              {question.options?.map((option) => (
                <div
                  key={option.id}
                  className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
                >
                  <RadioGroupItem value={option.id} id={option.id} />
                  <Label
                    htmlFor={option.id}
                    className="flex-1 cursor-pointer font-normal"
                  >
                    {option.text}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        )

      case 'multi_choice':
        const selectedValues = Array.isArray(value) ? value : []
        return (
          <div className="space-y-3">
            {question.options?.map((option) => (
              <div
                key={option.id}
                className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50"
              >
                <Checkbox
                  id={option.id}
                  checked={selectedValues.includes(option.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onChange([...selectedValues, option.id])
                    } else {
                      onChange(
                        selectedValues.filter((id: string) => id !== option.id)
                      )
                    }
                  }}
                />
                <Label
                  htmlFor={option.id}
                  className="flex-1 cursor-pointer font-normal"
                >
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
            rows={8}
            className="w-full resize-none"
          />
        )

      case 'image_upload':
        return (
          <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  onChange(file)
                }
              }}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
            >
              📁 Click to upload image
            </label>
            {value && (
              <div className="mt-4">
                <Badge variant="secondary">
                  ✓ File selected: {value.name || 'image.jpg'}
                </Badge>
              </div>
            )}
          </div>
        )

      default:
        return <p className="text-red-600">Unsupported question type</p>
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <Badge className="bg-blue-600">
              Question {questionNumber} of {totalQuestions}
            </Badge>
            <Badge variant="outline">{question.max_score} points</Badge>
            {question.complexity && (
              <Badge variant="secondary">{question.complexity}</Badge>
            )}
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {question.title}
          </h3>

          {question.description && (
            <p className="text-gray-600 text-sm leading-relaxed">
              {question.description}
            </p>
          )}
        </div>
      </div>

      {/* Answer Input */}
      <div className="pt-4 border-t">
        {renderAnswerInput()}
      </div>
    </div>
  )
}
```

---

### **File: `src/components/student/ExamNavigation.tsx`**

```typescript
'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Save, Send } from 'lucide-react'

interface ExamNavigationProps {
  currentIndex: number
  totalQuestions: number
  answeredQuestions: Set<string>
  questionIds: string[]
  onNavigate: (index: number) => void
  onPrevious: () => void
  onNext: () => void
  onSave: () => void
  onSubmit: () => void
  isSaving: boolean
  isSubmitting: boolean
}

export function ExamNavigation({
  currentIndex,
  totalQuestions,
  answeredQuestions,
  questionIds,
  onNavigate,
  onPrevious,
  onNext,
  onSave,
  onSubmit,
  isSaving,
  isSubmitting,
}: ExamNavigationProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={currentIndex === 0}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>

        <span className="text-sm font-medium text-gray-600">
          {currentIndex + 1} / {totalQuestions}
        </span>

        <Button
          variant="outline"
          onClick={onNext}
          disabled={currentIndex === totalQuestions - 1}
          className="gap-2"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Question Grid */}
      <div>
        <h4 className="text-sm font-semibold mb-3 text-gray-700">
          Question Overview
        </h4>
        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
          {questionIds.map((qId, index) => (
            <button
              key={qId}
              onClick={() => onNavigate(index)}
              className={`
                w-10 h-10 rounded-lg text-sm font-medium transition-all
                ${
                  index === currentIndex
                    ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                    : answeredQuestions.has(q