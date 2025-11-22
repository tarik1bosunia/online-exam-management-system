'use client';

import { Navbar } from '@/components/shared/Navbar';
import { useGetExamsQuery } from '@/lib/redux/services/examApi';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Users, Clock, Calendar, Edit, Eye, Plus, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AdminExamsPage() {
  const { data: exams, isLoading, error } = useGetExamsQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading exams...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-red-600">
            <p>Error loading exams. Please try again.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FileText className="text-blue-600" size={32} />
              All Exams
            </h1>
            <p className="mt-2 text-gray-600">
              Manage and view all exams you have created
            </p>
          </div>
          <Link href="/admin">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2" size={18} />
              Create New Exam
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Exams</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{exams?.length || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Published</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {exams?.filter(exam => exam.is_published).length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Draft</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-500">
                {exams?.filter(exam => !exam.is_published).length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Exams List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="text-purple-600" size={20} />
              All Exams
            </CardTitle>
            <CardDescription>
              View, edit, and manage all your created exams
            </CardDescription>
          </CardHeader>
          <CardContent>
            {exams && exams.length > 0 ? (
              <div className="space-y-4">
                {exams.map((exam) => (
                  <div 
                    key={exam.id} 
                    className="flex flex-col md:flex-row md:items-center justify-between p-5 border rounded-lg hover:bg-gray-50 transition-all hover:shadow-md"
                  >
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-gray-900 text-lg">{exam.title}</h3>
                            <Badge variant={exam.is_published ? "default" : "secondary"}>
                              {exam.is_published ? "Published" : "Draft"}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{exam.description}</p>
                          
                          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1.5">
                              <Clock size={16} className="text-blue-500" />
                              <strong className="text-gray-700">{exam.duration_minutes}</strong> minutes
                            </span>
                            <span className="flex items-center gap-1.5">
                              <FileText size={16} className="text-green-500" />
                              <strong className="text-gray-700">{exam.question_count}</strong> questions
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Calendar size={16} className="text-purple-500" />
                              Start: <strong className="text-gray-700">{new Date(exam.start_time).toLocaleString()}</strong>
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Calendar size={16} className="text-red-500" />
                              End: <strong className="text-gray-700">{new Date(exam.end_time).toLocaleString()}</strong>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-4 md:mt-0 md:ml-4">
                      <Link href={`/admin/exam/${exam.id}`}>
                        <Button variant="outline" size="sm" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                          <Eye size={16} className="mr-1" />
                          View Submissions
                        </Button>
                      </Link>
                      <Link href={`/admin`}>
                        <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-100">
                          <Edit size={16} className="mr-1" />
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="mx-auto text-gray-300 mb-4" size={64} />
                <p className="text-gray-500 text-lg mb-4">No exams created yet.</p>
                <Link href="/admin">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="mr-2" size={18} />
                    Create Your First Exam
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
