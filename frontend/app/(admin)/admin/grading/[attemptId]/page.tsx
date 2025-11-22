"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/shared/Navbar";
import { useGetAttemptReviewQuery, useUpdateScoreMutation } from "@/lib/redux/services/attemptApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Check, X, Save } from "lucide-react";
import { toast } from "sonner";

interface PageProps {
  params: Promise<{ attemptId: string }>;
}

export default function AdminGradingPage({ params }: PageProps) {
  const { attemptId } = use(params);
  const router = useRouter();

  // State to track score changes
  const [scoreChanges, setScoreChanges] = useState<Record<string, number>>({});
  const [hasChanges, setHasChanges] = useState<Record<string, boolean>>({});

  // 1. Fetch attempt details
  const { data: review, isLoading, error } = useGetAttemptReviewQuery(attemptId, { skip: !attemptId });
  
  // 2. Mutation for updating score
  const [updateScore, { isLoading: isSaving }] = useUpdateScoreMutation();

  const handleScoreChange = (questionId: string, newScore: string, originalScore: number) => {
    const scoreValue = parseFloat(newScore);
    if (!isNaN(scoreValue)) {
      setScoreChanges(prev => ({ ...prev, [questionId]: scoreValue }));
      setHasChanges(prev => ({ ...prev, [questionId]: scoreValue !== originalScore }));
    }
  };

  const handleSaveScore = async (questionId: string) => {
    const scoreValue = scoreChanges[questionId];
    
    if (scoreValue === undefined || isNaN(scoreValue)) {
      toast.error("Please enter a valid number");
      return;
    }
    
    try {
      await updateScore({ attemptId, question_id: questionId, score: scoreValue }).unwrap();
      toast.success("Score updated successfully");
      // Clear the change flag for this question
      setHasChanges(prev => {
        const updated = { ...prev };
        delete updated[questionId];
        return updated;
      });
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Failed to update score");
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;
  if (error || !review) return <div className="min-h-screen flex items-center justify-center text-red-500">Error loading attempt.</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navbar />
      <main className="container mx-auto px-4 py-10 max-w-4xl">
        
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()}><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
            <div>
              <h1 className="text-2xl font-bold">{review.exam_title}</h1>
              <p className="text-gray-500 text-sm">Grading Mode</p>
            </div>
          </div>
          <div className="text-right">
             <p className="text-sm text-gray-500 uppercase font-bold">Total Score</p>
             <p className="text-3xl font-bold text-blue-600">{review.total_score} / {review.max_possible_score}</p>
          </div>
        </div>

        <div className="space-y-6">
          {review.questions.map((q, index) => (
            <Card key={q.id} className={`border-l-4 ${q.type === 'text' ? 'border-l-amber-400' : 'border-l-gray-300'}`}>
              <CardHeader className="bg-gray-50/50 pb-2">
                <div className="flex justify-between">
                  <CardTitle className="text-base font-medium">Q{index + 1}: {q.title}</CardTitle>
                  <Badge variant="outline">{q.type}</Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pt-4">
                {/* Answer Display */}
                <div className="mb-4 p-4 bg-gray-50 rounded border">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">Student Answer:</p>
                  {q.type === 'text' ? (
                    <p className="whitespace-pre-wrap text-gray-800">{q.text_answer || "(No answer)"}</p>
                  ) : (
                    <div className="space-y-1">
                      {q.selected_options?.map(opt => (
                        <div key={opt} className="flex items-center gap-2">
                          {q.correct_answers?.includes(opt) ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-red-600" />}
                          <span>{opt}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Grading Controls */}
                <div className="flex items-center justify-between gap-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
                  <span className="text-sm font-semibold text-blue-900">Score Awarded:</span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Input 
                        type="number" 
                        step="0.5"
                        min="0"
                        max={q.max_score}
                        defaultValue={q.score_awarded}
                        className="w-24 bg-white border-2 border-blue-300 focus:border-blue-500"
                        onChange={(e) => handleScoreChange(q.id, e.target.value, q.score_awarded)}
                      />
                      <span className="text-gray-600 font-medium">/ {q.max_score}</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleSaveScore(q.id)}
                      disabled={isSaving || !hasChanges[q.id]}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-1" />
                          Save
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

      </main>
    </div>
  );
}