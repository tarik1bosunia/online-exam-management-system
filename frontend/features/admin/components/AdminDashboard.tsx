'use client';

import { useState } from 'react';
import { 
  useImportQuestionsMutation, 
  useGetAllQuestionsQuery, 
  useCreateExamMutation, 
  useAddQuestionsToExamMutation,
  usePublishExamMutation 
} from '@/lib/redux/services/adminApi';
import { Upload, Plus, Check, Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [examForm, setExamForm] = useState({
    title: '',
    start_time: '',
    end_time: '',
    duration_minutes: 60,
  });
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  
  const [importQuestions, { isLoading: isUploading }] = useImportQuestionsMutation();
  const { data: questions, isLoading: isLoadingQuestions } = useGetAllQuestionsQuery();
  const [createExam, { isLoading: isCreating }] = useCreateExamMutation();
  const [addQuestions] = useAddQuestionsToExamMutation();
  const [publishExam] = usePublishExamMutation();

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await importQuestions(formData).unwrap();
      toast.success(`Successfully imported ${res.imported_count} questions!`);
      setFile(null);
    } catch (err) {
      toast.error('Upload failed. Please try again.');
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedQuestions.length === 0) {
      toast.warning("Please select at least one question.");
      return;
    }

    try {
      const exam = await createExam({
        ...examForm,
        start_time: new Date(examForm.start_time).toISOString(),
        end_time: new Date(examForm.end_time).toISOString(),
      }).unwrap();

      await addQuestions({
        examId: exam.id,
        question_ids: selectedQuestions,
      }).unwrap();

      await publishExam({ examId: exam.id, is_published: true }).unwrap();

      toast.success('Exam Created and Published successfully!');
      // Reset form
      setExamForm({ title: '', start_time: '', end_time: '', duration_minutes: 60 });
      setSelectedQuestions([]);
    } catch (err) {
      toast.error('Failed to create exam. Please try again.');
    }
  };

  const toggleQuestion = (id: string) => {
    setSelectedQuestions(prev => 
      prev.includes(id) ? prev.filter(q => q !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-8">
      {/* --- Section 1: Upload Questions --- */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Upload size={20} className="text-primary" />
          Import Questions
        </h2>
        <form onSubmit={handleFileUpload} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Excel File (.xlsx)</label>
            <input 
              type="file" 
              accept=".xlsx"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          <button 
            type="submit" 
            disabled={!file || isUploading}
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </button>
        </form>
      </div>

      {/* --- Section 2: Create Exam --- */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <Plus size={20} className="text-success" />
          Create New Exam
        </h2>
        
        <form onSubmit={handleCreateExam} className="space-y-6">
          {/* Exam Details */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Exam Title</label>
              <input 
                required
                type="text" 
                value={examForm.title}
                onChange={e => setExamForm({...examForm, title: e.target.value})}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g., Final Physics Assessment"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input 
                  required
                  type="datetime-local" 
                  value={examForm.start_time}
                  onChange={e => setExamForm({...examForm, start_time: e.target.value})}
                  className="w-full pl-10 p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input 
                  required
                  type="datetime-local" 
                  value={examForm.end_time}
                  onChange={e => setExamForm({...examForm, end_time: e.target.value})}
                  className="w-full pl-10 p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Minutes)</label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input 
                  required
                  type="number" 
                  value={examForm.duration_minutes}
                  onChange={e => setExamForm({...examForm, duration_minutes: parseInt(e.target.value)})}
                  className="w-full pl-10 p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Question Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Questions ({selectedQuestions.length})</label>
            <div className="border rounded-md max-h-64 overflow-y-auto p-2 bg-gray-50">
              {isLoadingQuestions ? (
                <div className="p-4 text-center text-gray-500">Loading questions...</div>
              ) : (
                questions?.map(q => (
                  <div 
                    key={q.id} 
                    onClick={() => toggleQuestion(q.id)}
                    className={`p-3 mb-2 rounded cursor-pointer border flex items-center justify-between transition-colors ${
                      selectedQuestions.includes(q.id) 
                        ? 'bg-primary/10 border-primary/30' 
                        : 'bg-white border-border hover:border-primary/20'
                    }`}
                  >
                    <div>
                      <p className="font-medium text-gray-900">{q.title}</p>
                      <span className="text-xs text-gray-500 uppercase bg-gray-200 px-1 rounded">{q.type}</span>
                    </div>
                    {selectedQuestions.includes(q.id) && <Check size={18} className="text-primary" />}
                  </div>
                ))
              )}
              {questions?.length === 0 && (
                <div className="text-center p-4 text-gray-500">No questions available. Please upload questions first.</div>
              )}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isCreating}
            className="w-full bg-success text-white py-3 rounded-lg font-semibold hover:bg-success/90 disabled:opacity-50 shadow-lg transition-all"
          >
            {isCreating ? 'Creating Exam...' : 'Create & Publish Exam'}
          </button>
        </form>
      </div>
    </div>
  );
}