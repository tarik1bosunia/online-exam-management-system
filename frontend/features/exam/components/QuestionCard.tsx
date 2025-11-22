'use client';

import { Question } from '@/lib/redux/services/attemptApi';

interface Props {
  question: Question;
  currentAnswer: { selected_options?: string[]; text_answer?: string } | undefined;
  onAnswerChange: (answer: { selected_options?: string[]; text_answer?: string }) => void;
}

export default function QuestionCard({ question, currentAnswer, onAnswerChange }: Props) {
  const isMulti = question.type === 'multi_choice';
  const selected = currentAnswer?.selected_options || [];

  const handleOptionClick = (option: string) => {
    if (question.type === 'single_choice') {
      onAnswerChange({ selected_options: [option] });
    } else {
      // Multi-choice logic: Toggle selection
      const newSelection = selected.includes(option)
        ? selected.filter((o) => o !== option)
        : [...selected, option];
      onAnswerChange({ selected_options: newSelection });
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <div className="mb-4">
        <span className="inline-block bg-primary/10 text-primary text-xs px-2 py-1 rounded uppercase font-semibold mb-2">
          {question.type.replace('_', ' ')}
        </span>
        <h3 className="text-xl font-medium text-gray-900">{question.title}</h3>
        <p className="text-sm text-gray-500 mt-1">Max Score: {question.max_score}</p>
      </div>

      {/* Options Render */}
      {(question.type === 'single_choice' || question.type === 'multi_choice') && (
        <div className="space-y-3">
          {question.options.map((option, idx) => {
            const isSelected = selected.includes(option);
            return (
              <div
                key={idx}
                onClick={() => handleOptionClick(option)}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-primary/5 border-primary ring-1 ring-primary/30'
                    : 'hover:bg-muted border-border'
                }`}
              >
                <div className="flex items-center">
                  <div
                    className={`w-5 h-5 flex items-center justify-center border rounded ${
                      isMulti ? 'rounded-md' : 'rounded-full'
                    } ${isSelected ? 'bg-primary border-primary' : 'border-border'}`}
                  >
                    {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                  </div>
                  <span className="ml-3 text-gray-700">{option}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Text Input Render */}
      {question.type === 'text' && (
        <textarea
          className="w-full p-3 border border-input rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
          rows={5}
          placeholder="Type your answer here..."
          value={currentAnswer?.text_answer || ''}
          onChange={(e) => onAnswerChange({ text_answer: e.target.value })}
        />
      )}
    </div>
  );
}