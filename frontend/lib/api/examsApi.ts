import { baseApi } from './baseApi'
import { Question } from './questionsApi'

export interface Exam {
  id: string
  title: string
  description?: string
  start_time: string
  end_time: string
  duration_minutes: number
  is_published: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface ExamWithQuestions extends Exam {
  questions: Array<{
    question: Question
    order: number
  }>
}

export interface CreateExamRequest {
  title: string
  description?: string
  start_time: string
  end_time: string
  duration_minutes: number
  question_ids: string[]
}

export const examsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Create exam
    createExam: builder.mutation<ExamWithQuestions, CreateExamRequest>({
      query: (data) => ({
        url: '/exams',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Exam', id: 'LIST' }],
    }),
    
    // Get all exams
    getExams: builder.query<Exam[], { is_published?: boolean }>({
      query: (params) => ({
        url: '/exams',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Exam' as const, id })),
              { type: 'Exam', id: 'LIST' },
            ]
          : [{ type: 'Exam', id: 'LIST' }],
    }),
    
    // Get exam with questions
    getExam: builder.query<ExamWithQuestions, string>({
      query: (id) => `/exams/${id}`,
      providesTags: (result, error, id) => [{ type: 'Exam', id }],
    }),
    
    // Update exam
    updateExam: builder.mutation<
      Exam,
      { id: string; data: Partial<CreateExamRequest> }
    >({
      query: ({ id, data }) => ({
        url: `/exams/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Exam', id },
        { type: 'Exam', id: 'LIST' },
      ],
    }),
    
    // Toggle publish status
    togglePublish: builder.mutation<Exam, { id: string; is_published: boolean }>({
      query: ({ id, is_published }) => ({
        url: `/exams/${id}/publish`,
        method: 'PUT',
        body: { is_published },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Exam', id },
        { type: 'Exam', id: 'LIST' },
      ],
    }),
    
    // Delete exam
    deleteExam: builder.mutation<void, string>({
      query: (id) => ({
        url: `/exams/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Exam', id: 'LIST' }],
    }),
  }),
})

export const {
  useCreateExamMutation,
  useGetExamsQuery,
  useGetExamQuery,
  useUpdateExamMutation,
  useTogglePublishMutation,
  useDeleteExamMutation,
} = examsApi