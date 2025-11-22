'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useSaveAnswerMutation } from '@/lib/api/participationApi'
import { useAppSelector } from '@/lib/redux/hooks'
import { toast } from 'sonner'

// Fallback selector if the slice export is not available.
// This tries common shapes: state.answers.entities or state.answers, and falls back to {}
const selectAllAnswers = (state: { answers?: Record<string, unknown> | { entities?: Record<string, unknown> } }) => {
  if (!state.answers) return {};
  return 'entities' in state.answers ? state.answers.entities ?? {} : state.answers;
}

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
  const previousAnswersRef = useRef<Record<string, unknown>>({})
  const saveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
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
    } catch (error) {
      // Silent fail - don't show toast to avoid annoying user
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