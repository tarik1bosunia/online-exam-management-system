"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Clock, Save, Send, AlertCircle, Loader2, Play } from "lucide-react";
import { toast } from "sonner"; 
import { useStartExamMutation, useSaveAnswerMutation, useSubmitExamMutation, AttemptState } from "@/lib/redux/services/attemptApi";
import { useAppSelector } from "@/lib/redux/hooks";

// Next.js 15: Page props are Promises
export default function ExamInterface({ params }: { params: Promise<{ examId: string }> }) {
  const router = useRouter();
  
  // Unwrap params using React.use()
  const unwrappedParams = use(params);
  const examId = unwrappedParams.examId;
  
  // Check Auth Token from Redux Store
  const { token } = useAppSelector((state) => state.auth);

  // --- API Hooks ---
  const [startExam, { isLoading: isStarting, error: startError }] = useStartExamMutation();
  const [saveAnswer] = useSaveAnswerMutation();
  const [submitExam, { isLoading: isSubmitting }] = useSubmitExamMutation();

  // --- Local State ---
  const [attemptData, setAttemptData] = useState<AttemptState | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[] | null>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const hasStartedRef = useRef(false);

  const handleStartExam = async () => {
    if (!examId) {
      toast.error("Error: Exam ID is missing.");
      return;
    }
    if (!token) {
      toast.error("You are not logged in. Redirecting...");
      router.push("/login");
      return;
    }
    
    try {
      const data = await startExam(examId).unwrap();
      setAttemptData(data);
      
      // Hydrate saved answers
      const initialAnswers: Record<string, string | string[] | null> = {};
      data.saved_answers.forEach((ans) => {
        initialAnswers[ans.question_id] = ans.selected_options || ans.text_answer;
      });
      setAnswers(initialAnswers);

      // Calculate Timer
      setTimeRemaining(Math.floor(data.remaining_seconds));
      
    } catch (err: unknown) {
      const error = err as { status?: number; data?: { detail?: string } };
      if (error.status === 401) {
        toast.error("Session expired. Please login again.");
        router.push("/login");
      } else if (error.status === 404) {
        toast.error("Exam not found or not published yet.");
      } else {
         toast.error("Failed to start exam.");
      }
    }
  };

  // Auto-start effect
  useEffect(() => {
    if (token && examId && !attemptData && !isStarting && !hasStartedRef.current) {
      hasStartedRef.current = true;
      handleStartExam();
    }
  }, [examId, token]); 

  // --- 2. Timer Logic ---
  useEffect(() => {
    if (timeRemaining === null) return;
    if (timeRemaining <= 0) {
      // Optionally auto-submit here if time runs out
      return;
    }
    const timer = setInterval(() => {
      setTimeRemaining((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeRemaining]);

  // --- 3. Handlers ---
  const handleAnswerChange = async (questionId: string, value: string | string[] | null) => {
    // 1. Optimistic Update
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    
    if(!attemptData) return;

    const payload: { attemptId: string; question_id: string; selected_options?: string[]; text_answer?: string } = {
      attemptId: attemptData.attempt_id,
      question_id: questionId
    };

    if (Array.isArray(value)) {
      payload.selected_options = value;
    } else if (typeof value === 'string') {
      const currentQ = attemptData.questions.find((q: { id: string; type: string }) => q.id === questionId);
      if (currentQ?.type === 'text') {
        payload.text_answer = value;
      } else {
        payload.selected_options = [value];
      }
    }

    setIsSaving(true);
    try {
      await saveAnswer(payload).unwrap();
    } catch (err) {
      // Silent fail to avoid annoying user during exam
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!attemptData) return;
    try {
      const result = await submitExam(attemptData.attempt_id).unwrap();
      toast.success(`Exam submitted! Score: ${result.total_score}`);
      router.push('/results');
    } catch (error) {
      toast.error("Submission failed. Please try again.");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // --- 4. Render States ---

  // Error State
  if (startError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full border-red-200 shadow-lg">
          <CardHeader className="bg-red-50 border-b border-red-100">
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" /> Unable to Start Exam
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-gray-700">We couldn't load this exam.</p>
            <div className="bg-gray-100 p-2 rounded text-xs font-mono">
              {JSON.stringify(startError)}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => router.push('/dashboard')}>
                Dashboard
              </Button>
              <Button className="flex-1" onClick={() => handleStartExam()}>
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading State
  if (!attemptData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-6">
        {isStarting ? (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            <p className="text-gray-600 font-medium animate-pulse">Loading your exam paper...</p>
          </>
        ) : (
          <div className="text-center">
            <p className="mb-4 text-gray-600">Ready to begin?</p>
            <Button onClick={() => handleStartExam()} size="lg" className="gap-2">
              <Play size={16} /> Start Exam Now
            </Button>
            <div className="mt-4 text-xs text-gray-400">
              {/* Debug Info */}
              ID: {examId || 'Missing'} | Token: {token ? 'Present' : 'Missing'}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Success State
  const questions = attemptData.questions;
  const currentQ = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const currentAnswer = answers[currentQ.id];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-lg font-bold text-slate-900">{attemptData.exam_title}</h1>
              <p className="text-xs text-slate-500">Question {currentQuestionIndex + 1} of {questions.length}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className={`${(timeRemaining || 0) < 300 ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"} gap-1.5`}>
                <Clock className="h-3.5 w-3.5" />
                <span className="font-mono text-base">{timeRemaining !== null ? formatTime(timeRemaining) : "--:--"}</span>
              </Badge>
              {isSaving && <span className="text-xs text-slate-400 flex gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Saving</span>}
            </div>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      </div>

      {/* Question Area */}
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
            <div className="flex justify-between items-start gap-4">
              <CardTitle className="text-lg font-medium text-slate-800 leading-relaxed">{currentQ.title}</CardTitle>
              <Badge variant="secondary" className="shrink-0">{currentQ.max_score} pts</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {currentQ.type === "single_choice" && (
              <RadioGroup value={Array.isArray(currentAnswer) ? currentAnswer[0] : currentAnswer} onValueChange={(val) => handleAnswerChange(currentQ.id, val)}>
                {currentQ.options?.map((option, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 rounded-lg border border-transparent hover:bg-slate-50 hover:border-slate-200 transition-all">
                    <RadioGroupItem value={option} id={`opt-${index}`} />
                    <Label htmlFor={`opt-${index}`} className="flex-1 cursor-pointer font-normal">{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            )}
            
            {currentQ.type === "multi_choice" && (
              <div className="space-y-3">
                {currentQ.options?.map((option, index) => {
                  const isChecked = Array.isArray(currentAnswer) && currentAnswer.includes(option);
                  return (
                    <div key={index} className="flex items-center space-x-3 p-3 rounded-lg border border-transparent hover:bg-slate-50 hover:border-slate-200 transition-all">
                      <Checkbox id={`chk-${index}`} checked={isChecked} onCheckedChange={(checked) => {
                        const current = (Array.isArray(currentAnswer) ? currentAnswer : []) as string[];
                        handleAnswerChange(currentQ.id, checked ? [...current, option] : current.filter(i => i !== option));
                      }} />
                      <Label htmlFor={`chk-${index}`} className="flex-1 cursor-pointer font-normal">{option}</Label>
                    </div>
                  );
                })}
              </div>
            )}

            {currentQ.type === "text" && (
              <Textarea placeholder="Type your answer..." value={currentAnswer || ""} onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)} rows={6} className="resize-none p-4" />
            )}
          </CardContent>
        </Card>

        {/* Footer Navigation */}
        <div className="flex justify-between mt-8">
          <Button variant="outline" onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))} disabled={currentQuestionIndex === 0}>Previous</Button>
          
          {currentQuestionIndex === questions.length - 1 ? (
            <Button 
              onClick={handleSubmit} 
              // FIX: Disable submitting while saving to prevent "0 Score" race condition
              disabled={isSubmitting || isSaving} 
              className="bg-green-600 hover:bg-green-700 text-white w-32"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" /> 
              ) : isSaving ? (
                <span className="text-xs">Saving...</span>
              ) : (
                <><Send className="h-4 w-4 mr-2" /> Submit</>
              )}
            </Button>
          ) : (
            <Button onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))} className="w-32">Next</Button>
          )}
        </div>
      </div>
    </div>
  );
}