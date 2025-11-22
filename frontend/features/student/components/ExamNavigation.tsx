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
                    ? 'bg-primary text-white ring-2 ring-primary/30'
                    : answeredQuestions.has(qId)
                    ? 'bg-muted'
                    : 'bg-white border border-border hover:border-primary/30'
                }
              `}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
