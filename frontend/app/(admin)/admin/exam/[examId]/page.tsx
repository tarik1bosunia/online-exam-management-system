"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/shared/Navbar";
import { useGetExamAttemptsQuery } from "@/lib/redux/services/attemptApi";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, User, FileText, Calendar } from "lucide-react";

interface PageProps {
  params: Promise<{ examId: string }>;
}

export default function AdminExamAttemptsPage({ params }: PageProps) {
  const { examId } = use(params);
  const router = useRouter();
  const { data: attempts, isLoading } = useGetExamAttemptsQuery(examId);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navbar />
      <main className="container mx-auto px-4 py-10 max-w-5xl">
        
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" onClick={() => router.push('/admin')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Exam Submissions</h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
        ) : (
          <div className="grid gap-4">
            {attempts?.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg border border-dashed text-gray-500">
                No students have taken this exam yet.
              </div>
            )}

            {attempts?.map((attempt) => (
              <div 
                key={attempt.id} 
                className="bg-white p-6 rounded-lg shadow-sm border flex items-center justify-between hover:shadow-md transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-900">Attempt ID: {attempt.id.slice(0, 8)}...</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(attempt.start_time).toLocaleDateString()}</span>
                    <Badge variant={attempt.status === 'submitted' ? 'default' : 'secondary'}>
                      {attempt.status}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase font-bold">Score</p>
                    <p className="text-xl font-bold text-blue-600">
                      {attempt.total_score} <span className="text-sm text-gray-400">/ {attempt.max_possible_score}</span>
                    </p>
                  </div>
                  
                  <Link href={`/admin/grading/${attempt.id}`}>
                    <Button>
                      <FileText className="h-4 w-4 mr-2" /> Grade / Review
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}