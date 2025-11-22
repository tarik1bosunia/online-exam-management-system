'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAppDispatch } from '@/lib/redux/hooks'
import { startExam, resetExam } from '@/lib/redux/features/exam/slices/examSlice'
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
    } catch (error: unknown) {
      const err = error as { data?: { detail?: string } };
      toast.error(err.data?.detail || 'Failed to start exam')
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
      } catch (error: unknown) {
        const err = error as { data?: { detail?: string } };
        toast.error(err.data?.detail || 'Failed to submit exam')
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