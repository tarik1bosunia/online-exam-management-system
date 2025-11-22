'use client';

import { useGetExamsQuery } from '@/lib/redux/services/examApi';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Users, Clock, Calendar } from 'lucide-react';

export default function AdminExamList() {
  const { data: exams, isLoading } = useGetExamsQuery();

  if (isLoading) return <div>Loading exams...</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mt-8">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Users size={20} className="text-purple-600" />
        Manage Existing Exams
      </h2>

      <div className="grid gap-4">
        {exams?.map((exam) => (
          <div key={exam.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
            <div>
              <h3 className="font-bold text-gray-900">{exam.title}</h3>
              <div className="flex gap-4 text-sm text-gray-500 mt-1">
                <span className="flex items-center gap-1"><Clock size={14} /> {exam.duration_minutes} mins</span>
                <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(exam.start_time).toLocaleDateString()}</span>
              </div>
            </div>
            
            <Link href={`/admin/exam/${exam.id}`}>
              <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                View Submissions
              </Button>
            </Link>
          </div>
        ))}
        
        {exams?.length === 0 && (
          <p className="text-gray-500 text-center py-4">No exams created yet.</p>
        )}
      </div>
    </div>
  );
}