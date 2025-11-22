"use client";

import { Navbar } from "@/components/shared/Navbar";
import { useGetHistoryQuery } from "@/lib/redux/services/attemptApi";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, CheckCircle2, Clock, Trophy, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function ResultsPage() {
  const { data: attempts, isLoading, error } = useGetHistoryQuery();

  // Formatting helpers
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getScoreColor = (score: number, max: number) => {
    const percentage = (score / (max || 1)) * 100;
    if (percentage >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (percentage >= 50) return "text-blue-600 bg-blue-50 border-blue-200";
    return "text-amber-600 bg-amber-50 border-amber-200";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-10 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Exam Results</h1>
            <p className="text-slate-500 mt-1">Track your performance and history</p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
            <p className="text-slate-500">Loading your results...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center text-red-700">
            <p>Failed to load results. Please check your connection and try again.</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && attempts?.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">No exams taken yet</h3>
            <p className="text-slate-500 mt-1 mb-6">
              Once you complete an exam, your score will appear here.
            </p>
            <Link href="/dashboard">
              <Button>Take an Exam</Button>
            </Link>
          </div>
        )}

        {/* Results List */}
        <div className="grid gap-4">
          {attempts?.map((attempt) => {
            const percentage = ((attempt.total_score / (attempt.max_possible_score || 1)) * 100).toFixed(1);
            const isPassed = Number(percentage) >= 40; // Assuming 40% is pass

            return (
              <Link key={attempt.id} href={`/results/${attempt.id}`} className="block group">
                <Card className="overflow-hidden border-slate-200 hover:shadow-md transition-all hover:border-blue-300">
                  <div className="flex flex-col md:flex-row">
                    {/* Score Section (Left) */}
                    <div className={`p-6 flex flex-col items-center justify-center min-w-[180px] border-b md:border-b-0 md:border-r ${getScoreColor(attempt.total_score, attempt.max_possible_score)}`}>
                      <span className="text-4xl font-bold">{Number(percentage).toFixed(0)}%</span>
                      <span className="text-sm font-medium opacity-80 mt-1">
                        {attempt.total_score} / {attempt.max_possible_score} Pts
                      </span>
                      <Badge 
                        className={`mt-3 ${isPassed ? "bg-green-600 hover:bg-green-700" : "bg-red-500 hover:bg-red-600"}`}
                      >
                        {isPassed ? "Passed" : "Failed"}
                      </Badge>
                    </div>

                    {/* Details Section (Right) */}
                    <div className="p-6 flex-1 flex flex-col justify-center">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                            {attempt.exam_title}
                          </h3>
                          <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-4 w-4" />
                              {formatDate(attempt.start_time)}
                            </div>
                            {attempt.status === 'submitted' ? (
                              <div className="flex items-center gap-1.5 text-green-600 font-medium">
                                <CheckCircle2 className="h-4 w-4" /> Completed
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-amber-600 font-medium">
                                <Clock className="h-4 w-4" /> In Progress
                              </div>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-6 w-6 text-slate-300 group-hover:text-blue-500 transition-colors" />
                      </div>
                      
                      {/* Progress Bar Visual */}
                      <div className="w-full bg-slate-100 rounded-full h-2.5 mb-1">
                        <div 
                          className={`h-2.5 rounded-full ${isPassed ? "bg-green-500" : "bg-amber-500"}`} 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-right text-slate-400 mt-1">Click to view full breakdown</p>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}