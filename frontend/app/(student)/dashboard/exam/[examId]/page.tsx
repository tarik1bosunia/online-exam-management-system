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
import { Clock, Save, Send, AlertCircle, Loader2, Play, CheckCircle } from "lucide-react";
import { toast } from "sonner"; 
import { useStartExamMutation, useSaveAnswerMutation, useSubmitExamMutation, AttemptState } from "@/lib/redux/services/attemptApi";
import { useAppSelector } from "@/lib/redux/hooks";

export default function ExamInterface({ params }: { params: Promise<{ examId: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const examId = unwrappedParams.examId;
  
  const { token } = useAppSelector((state) => state.auth);

  const [startExam, { isLoading: isStarting, error: startError }] = useStartExamMutation();
  const [saveAnswer] = useSaveAnswerMutation();
  const [submitExam, { isLoading: isSubmitting }] = useSubmitExamMutation();

  const [attemptData, setAttemptData] = useState<AttemptState | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[] | null>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const hasStartedRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- 1. Start Exam Logic ---
  const handleStartExam = async () => {
    if (!examId || !token) {
      if (!token) router.push("/login");
      return;
    }
    
    try {
      const data = await startExam(examId).unwrap();
      setAttemptData(data);
      
      const initialAnswers: Record<string, string | string[] | null> = {};
      data.saved_answers.forEach((ans) => {
        initialAnswers[ans.question_id] = ans.selected_options || ans.text_answer;
      });
      setAnswers(initialAnswers);

      setTimeRemaining(Math.floor(data.remaining_seconds));
      
    } catch (err: unknown) {
      const error = err as { status?: number; data?: { detail?: string } };
      if (error.status === 401) {
        toast.error("Session expired. Please login again.");
        router.push("/login");
      } else if (error.status === 400 && error.data?.detail === "You have already submitted this exam") {
        toast.success("You have already completed this exam. Redirecting...");
        router.push("/results");
      } else if (error.status === 404) {
        toast.error("Exam not found or not accessible.");
      } else {
        toast.error("Failed to start exam. Please try again.");
      }
    }
  };

  useEffect(() => {
    if (token && examId && !attemptData && !isStarting && !hasStartedRef.current) {
      hasStartedRef.current = true;
      handleStartExam();
    }
  }, [examId, token]); 

  // --- 2. Timer Logic ---
  useEffect(() => {
    if (timeRemaining === null) return;
    if (timeRemaining <= 0) return;
    const timer = setInterval(() => {
      setTimeRemaining((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeRemaining]);

  // --- 3. Save Logic ---
  const handleAnswerChange = (questionId: string, value: string | string[] | null) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    
    if(!attemptData) return;

    // Show saving immediately for better UX
    setIsSaving(true);

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

    // Debounce the actual network request
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await saveAnswer(payload).unwrap();
      } catch (err) {
        // Silent fail to avoid annoying user during exam
      } finally {
        setIsSaving(false);
      }
    }, 1000);
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

  if (startError) {
    const errorData = startError as { status?: number; data?: { detail?: string } };
    const isSubmittedError = 'status' in startError && startError.status === 400 && errorData.data?.detail === "You have already submitted this exam";

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full border shadow-lg">
          <CardHeader className={`${isSubmittedError ? 'bg-green-50 border-b border-green-100' : 'bg-red-50 border-b border-red-100'}`}>
            <CardTitle className={`${isSubmittedError ? 'text-green-700' : 'text-red-600'} flex items-center gap-2`}>
              {isSubmittedError ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              {isSubmittedError ? "Exam Completed" : "Unable to Start Exam"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-gray-700">
              {isSubmittedError 
                ? "You have already submitted this exam. You can view your score and details in the results section." 
                : "We couldn't load this exam. Please check your connection or try again later."
              }
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => router.push('/dashboard')}>
                Dashboard
              </Button>
              {isSubmittedError ? (
                <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => router.push('/results')}>
                  View Results
                </Button>
              ) : (
                <Button className="flex-1" onClick={() => handleStartExam()}>
                  Retry
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            {/* Debug info removed to fix hydration error */}
          </div>
        )}
      </div>
    );
  }

  const questions = attemptData.questions;
  const currentQ = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const currentAnswer = answers[currentQ.id];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header: Fixed Height (h-20) & Grid Layout */}
      <div className="sticky top-0 z-50 bg-white border-b shadow-sm h-20">
        <div className="container mx-auto px-4 h-full flex flex-col justify-center">
          
          {/* Grid: Title (1fr) | Status (auto) */}
          <div className="grid grid-cols-[1fr_auto] items-center gap-4 mb-2">
            
            {/* Left: Title */}
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-slate-900 truncate">{attemptData.exam_title}</h1>
              <p className="text-xs text-slate-500">Question {currentQuestionIndex + 1} of {questions.length}</p>
            </div>

            {/* Right: Timer & Status */}
            <div className="flex items-center gap-3 relative">
              
              {/* Status Indicator: Absolute positioning prevents layout shift */}
              <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 w-24 text-right">
                {isSaving ? (
                  <span className="text-xs text-slate-400 flex items-center justify-end gap-1 transition-opacity">
                    <Loader2 className="h-3 w-3 animate-spin" /> Saving...
                  </span>
                ) : (
                  <span className="text-xs text-slate-300 flex items-center justify-end gap-1 transition-opacity">
                    <Save className="h-3 w-3" /> Saved
                  </span>
                )}
              </div>

              {/* Timer Badge: Fixed width & tabular-nums */}
              <Badge variant="outline" className={`${(timeRemaining || 0) < 300 ? "bg-red-50 text-red-600 border-red-200" : "bg-blue-50 text-blue-600 border-blue-200"} gap-1.5 w-[100px] justify-center py-1.5 shadow-sm`}>
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span className="font-mono text-base tabular-nums leading-none">
                  {timeRemaining !== null ? formatTime(timeRemaining) : "--:--"}
                </span>
              </Badge>
            </div>
          </div>
          
          <Progress value={progress} className="h-1 absolute bottom-0 left-0 right-0 rounded-none" />
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

        <div className="flex justify-between mt-8">
          <Button variant="outline" onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))} disabled={currentQuestionIndex === 0}>Previous</Button>
          {currentQuestionIndex === questions.length - 1 ? (
            <Button onClick={handleSubmit} disabled={isSubmitting || isSaving} className="bg-green-600 hover:bg-green-700 text-white w-32">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-2" /> Submit</>}
            </Button>
          ) : (
            <Button onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))} className="w-32">Next</Button>
          )}
        </div>
      </div>
    </div>
  );
}