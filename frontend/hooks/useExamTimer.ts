'use client'

import { useEffect, useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks'
import { decrementTime, selectTimeRemaining } from '@/lib/redux/features/exam/slices/examSlice'

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