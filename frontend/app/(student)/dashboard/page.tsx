'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/lib/redux/hooks';
import { Navbar } from '@/components/shared/Navbar';
import ExamList from '@/features/exam/components/ExamList';
import { Loader2 } from 'lucide-react';

export default function StudentDashboard() {
  const router = useRouter();
  // 1. Monitor the token from Redux
  const { token } = useAppSelector((state) => state.auth);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, [])

  useEffect(() => {
    if (isMounted && !token) {
      router.push('/login');
    }
  }, [isMounted, token, router]);

  // Prevent hydration mismatch
  if (!isMounted) return null; 
  
  // 3. Show loader instead of broken page while redirecting
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      <Navbar />
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Available Exams
              </h1>
              <p className="text-lg text-gray-600">
                Select an exam below to begin your assessment
              </p>
            </div>
            
            {/* Stats Card */}
            <div className="flex gap-3">
              <div className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-xl px-6 py-3 shadow-sm">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Active</p>
                <p className="text-2xl font-bold text-blue-600">—</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm border border-green-100 rounded-xl px-6 py-3 shadow-sm">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Completed</p>
                <p className="text-2xl font-bold text-green-600">—</p>
              </div>
            </div>
          </div>
        </div>

        {/* Exam List */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-lg p-6">
          <ExamList />
        </div>
      </main>
    </div>
  );
}