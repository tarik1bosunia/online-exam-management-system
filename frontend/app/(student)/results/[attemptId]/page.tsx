"use client";

import { use } from "react"; // React 19 hook for promises
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/shared/Navbar";
import { useGetAttemptReviewQuery } from "@/lib/redux/services/attemptApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X, ArrowLeft } from "lucide-react";

// Define Props type for Next.js 15 Page
interface PageProps {
  params: Promise<{ attemptId: string }>;
}

export default function AttemptReviewPage({ params }: PageProps) {
  // 1. Unwrap params using React.use()
  const { attemptId } = use(params);
  const router = useRouter();

  // 2. Fetch data using the unwrapped ID
  // 'skip' prevents the query from running if ID is somehow missing/undefined
  const { data: review, isLoading, error } = useGetAttemptReviewQuery(attemptId, {
    skip: !attemptId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-2" />
        <p className="text-slate-500">Loading review details...</p>
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <p className="text-red-600 font-medium">Unable to load exam review.</p>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Results
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Navbar />

      <main className="container mx-auto px-4 py-10 max-w-4xl">
        {/* Header Section */}
        <div className="mb-8">
          <Button
            variant="ghost"
            className="mb-4 pl-0 hover:pl-2 transition-all text-slate-600 hover:text-slate-900"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Results
          </Button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{review.exam_title}</h1>
              <p className="text-slate-500 mt-1 text-sm">
                Submitted on {new Date(review.submit_time).toLocaleString()}
              </p>
            </div>

            <div className="flex items-center gap-6 bg-slate-50 px-6 py-3 rounded-lg border border-slate-100">
              <div className="text-right">
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Score</p>
                <p className="text-2xl font-bold text-slate-900">
                  {review.total_score} <span className="text-base text-slate-400 font-normal">/ {review.max_possible_score}</span>
                </p>
              </div>
              <div className="h-10 w-px bg-slate-200"></div>
              <div className="text-right">
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Grade</p>
                <Badge className={`text-base px-3 py-0.5 ${(review.total_score / (review.max_possible_score || 1)) >= 0.4
                    ? 'bg-green-100 text-green-700 hover:bg-green-100 border-green-200'
                    : 'bg-red-100 text-red-700 hover:bg-red-100 border-red-200'
                  }`}>
                  {((review.total_score / (review.max_possible_score || 1)) * 100).toFixed(0)}%
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Questions Breakdown */}
        <div className="space-y-6">
          {review.questions.map((q, index) => (
            <Card
              key={q.id}
              className={`border-l-4 overflow-hidden shadow-sm ${q.is_correct
                  ? 'border-l-green-500'
                  : q.type === 'text'
                    ? 'border-l-slate-300'
                    : 'border-l-red-500'
                }`}
            >
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex gap-3 items-start">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-600 shadow-sm mt-0.5">
                      {index + 1}
                    </span>
                    <div>
                      <CardTitle className="text-base font-medium leading-relaxed text-slate-800">
                        {q.title}
                      </CardTitle>
                      {q.description && <p className="text-sm text-slate-500 mt-1">{q.description}</p>}
                    </div>
                  </div>
                  <Badge
                    variant={q.is_correct ? "default" : "outline"}
                    className={`shrink-0 ${q.is_correct
                        ? "bg-green-600 hover:bg-green-700"
                        : "text-slate-500 border-slate-200 bg-white"
                      }`}
                  >
                    {q.score_awarded} / {q.max_score} pts
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-6 pb-6 space-y-4">
                {/* Text Answer Display */}
                {q.type === "text" && (
                  <div className="space-y-3">
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <p className="text-xs font-bold text-slate-500 uppercase mb-2">Your Answer</p>
                      <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">
                        {q.text_answer || <span className="text-slate-400 italic">(No answer provided)</span>}
                      </p>
                    </div>

                    {q.is_graded ? (

                      <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-2 rounded border border-green-100 w-fit">

                        <Check className="h-3 w-3" />

                        <span className="font-semibold">Graded:</span> {q.score_awarded} points awarded.

                      </div>

                    ) : (

                      <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded border border-amber-100 w-fit">

                        <span className="font-semibold">Note:</span> Requires manual grading by instructor.

                      </div>

                    )}
                  </div>
                )}

                {/* Objective Answers Display */}
                {(q.type === "single_choice" || q.type === "multi_choice") && (
                  <div className="space-y-2">
                    {q.options?.map((opt, i) => {
                      // Ensure arrays exist to prevent crashes
                      const isSelected = q.selected_options?.includes(opt);
                      const isCorrect = q.correct_answers?.includes(opt);

                      let style = "border-slate-200 bg-white text-slate-600";
                      let icon = null;

                      if (isCorrect) {
                        style = "border-green-200 bg-green-50/50 text-green-900 font-medium";
                        icon = <Check className="h-4 w-4 text-green-600 shrink-0" />;
                      }

                      if (isSelected && !isCorrect) {
                        style = "border-red-200 bg-red-50/50 text-red-900 font-medium";
                        icon = <X className="h-4 w-4 text-red-600 shrink-0" />;
                      }

                      // Special case: Selected AND Correct (Green + Check)
                      if (isSelected && isCorrect) {
                        style = "border-green-500 bg-green-50 text-green-900 font-medium ring-1 ring-green-500";
                        icon = <Check className="h-4 w-4 text-green-600 shrink-0" />;
                      }

                      return (
                        <div
                          key={i}
                          className={`flex items-center justify-between p-3 rounded-lg border text-sm transition-colors ${style}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${isSelected
                                ? (isCorrect ? 'bg-green-600 border-green-600' : 'bg-red-500 border-red-500')
                                : 'border-slate-300 bg-white'
                              }`}>
                              {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                            </div>
                            <span>{opt}</span>
                          </div>
                          {icon}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}