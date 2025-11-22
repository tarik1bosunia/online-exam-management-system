'use client'

import { Question } from '@/lib/api/questionsApi'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

interface QuestionDisplayProps {
  question: Question
  value: string | string[] | number | null
  onChange: (value: string | string[] | number | null) => void
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
          <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
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
              className="cursor-pointer text-primary hover:text-primary/80 font-medium"
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
            <Badge className="bg-primary text-white">
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