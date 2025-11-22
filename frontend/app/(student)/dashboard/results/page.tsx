'use client';

import {Navbar} from '@/components/shared/Navbar';
import { useGetHistoryQuery } from '@/lib/redux/services/attemptApi';
import { CheckCircle, Clock, XCircle } from 'lucide-react';

export default function ResultsPage() {
  const { data: attempts, isLoading } = useGetHistoryQuery();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto py-10 px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Exam Results</h1>

        {isLoading ? (
          <div className="text-center py-10">Loading history...</div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {attempts?.map((attempt) => {
                const percentage = (attempt.total_score / (attempt.max_possible_score || 1)) * 100;
                const isPassed = percentage >= 40; // Example logic

                return (
                  <li key={attempt.id} className="px-6 py-4 hover:bg-gray-50 transition">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{attempt.exam_title}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {new Date(attempt.start_time).toLocaleDateString()}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                            attempt.status === 'submitted' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {attempt.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xl font-bold text-gray-900">
                          {attempt.total_score} <span className="text-gray-400 text-sm">/ {attempt.max_possible_score}</span>
                        </div>
                        {attempt.status === 'submitted' && (
                          <div className={`text-sm font-medium mt-1 flex items-center justify-end gap-1 ${
                            isPassed ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {isPassed ? <CheckCircle size={14} /> : <XCircle size={14} />}
                            {isPassed ? 'Pass' : 'Fail'} ({percentage.toFixed(1)}%)
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
              {attempts?.length === 0 && (
                <div className="px-6 py-8 text-center text-gray-500">
                  You haven't taken any exams yet.
                </div>
              )}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}