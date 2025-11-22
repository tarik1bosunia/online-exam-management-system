'use client';

import { useGetExamsQuery } from '@/lib/redux/services/examApi';
import Link from 'next/link';
import { Calendar, Clock, FileQuestion, Play, RotateCcw, Trophy, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ExamList() {
  const { data: exams, isLoading, error } = useGetExamsQuery();

  if (isLoading) return <div className="text-center p-10 text-slate-500">Loading exams...</div>;
  if (error) return <div className="text-red-500 p-10 text-center">Failed to load exams.</div>;

  const now = new Date();

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {exams?.map((exam) => {
        const startDate = new Date(exam.start_time);
        const endDate = new Date(exam.end_time);
        
        const isUpcoming = now < startDate;
        const isExpired = now > endDate;
        const isActive = !isUpcoming && !isExpired;
        
        // Determine Button State
        let actionButton;

        if (exam.attempt_status === 'submitted') {
          // Case 1: Completed -> Show Result
          actionButton = (
            <Link href={`/results/${exam.attempt_id}`} className="w-full">
              <Button variant="outline" className="w-full border-2 border-green-500/30 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 font-semibold shadow-sm hover:shadow-md transition-all">
                <Trophy className="w-4 h-4 mr-2" /> View Results
              </Button>
            </Link>
          );
        } else if (exam.attempt_status === 'in_progress') {
          // Case 2: In Progress -> Resume
          actionButton = (
            <Link href={`/exam/${exam.id}`} className="w-full">
              <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 transition-all">
                <RotateCcw className="w-4 h-4 mr-2" /> Resume Exam
              </Button>
            </Link>
          );
        } else if (isUpcoming) {
          // Case 3: Future -> Locked
          actionButton = (
            <Button disabled className="w-full bg-gray-100 text-gray-400 border-2 border-gray-200 cursor-not-allowed font-medium">
              <Clock className="w-4 h-4 mr-2" /> Starts {startDate.toLocaleDateString()}
            </Button>
          );
        } else if (isExpired) {
          // Case 4: Expired -> Locked
          actionButton = (
            <Button disabled className="w-full bg-red-50 text-red-400 border-2 border-red-100 cursor-not-allowed font-medium">
              <Lock className="w-4 h-4 mr-2" /> Expired
            </Button>
          );
        } else {
          // Case 5: Active -> Start
          actionButton = (
            <Link href={`/exam/${exam.id}`} className="w-full">
              <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all transform hover:scale-[1.02]">
                <Play className="w-4 h-4 mr-2" /> Start Exam
              </Button>
            </Link>
          );
        }

        return (
          <div key={exam.id} className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-md border-2 border-gray-200 p-6 hover:shadow-2xl hover:border-blue-300 transition-all duration-300 flex flex-col h-full">
            <div className="flex-1">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-bold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">{exam.title}</h3>
                {exam.attempt_status === 'submitted' && (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-2 border-green-300 font-semibold">
                    ✓ Done
                  </Badge>
                )}
              </div>
              
              <p className="text-gray-600 text-sm mb-5 line-clamp-2 min-h-[40px]">{exam.description || "No description provided."}</p>
              
              <div className="space-y-3 text-sm text-gray-700 mb-6">
                <div className="flex items-center gap-3 p-2.5 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <span className="font-semibold text-blue-900">{exam.duration_minutes} minutes</span>
                    <p className="text-xs text-blue-600">Duration</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-2.5 bg-purple-50 rounded-lg border border-purple-100">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileQuestion size={16} className="text-purple-600" />
                  </div>
                  <div>
                    <span className="font-semibold text-purple-900">{exam.question_count} Questions</span>
                    <p className="text-xs text-purple-600">Total items</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-2.5 bg-orange-50 rounded-lg border border-orange-100">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar size={16} className="text-orange-600" />
                  </div>
                  <div>
                    <span className="font-semibold text-orange-900">{endDate.toLocaleDateString()}</span>
                    <p className="text-xs text-orange-600">Due date</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-5 border-t-2 border-gray-100">
              {actionButton}
            </div>
          </div>
        );
      })}
      
      {exams?.length === 0 && (
        <div className="col-span-full text-center py-16 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border-2 border-dashed border-gray-300">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileQuestion className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-lg font-semibold text-gray-600">No exams available</p>
          <p className="text-sm text-gray-500 mt-1">Check back later for new assessments</p>
        </div>
      )}
    </div>
  );
}