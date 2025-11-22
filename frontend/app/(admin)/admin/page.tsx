import {Navbar} from '@/components/shared/Navbar';
import AdminDashboard from '@/features/admin/components/AdminDashboard';
import AdminExamList from '@/features/admin/components/AdminExamList';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      <Navbar />
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
              <p className="text-lg text-gray-600">Manage questions and create exams</p>
            </div>
            <Link href="/admin/exams">
              <Button variant="outline" className="border-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 font-semibold shadow-sm hover:shadow-md transition-all">
                <FileText className="mr-2" size={18} />
                View All Exams
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Dashboard Sections */}
        <div className="space-y-6">
          {/* 1. Create New Exams */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-gray-200 shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New Exam</h2>
            <AdminDashboard />
          </div>
          
          {/* 2. View Existing Exams List */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-gray-200 shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Exams</h2>
            <AdminExamList />
          </div>
        </div>
      </main>
    </div>
  );
}