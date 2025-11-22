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
        return 'text-destructive'
      case 'warning':
        return 'text-warning'
      default:
        return 'text-success'
    }
  }

  const getProgressColor = () => {
    switch (warningLevel) {
      case 'critical':
        return 'bg-destructive'
      case 'warning':
        return 'bg-warning'
      default:
        return 'bg-primary'
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