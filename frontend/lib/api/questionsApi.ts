import { baseApi } from './baseApi'

export interface Question {
  id: string
  title: string
  description?: string
  complexity: string
  type: 'single_choice' | 'multi_choice' | 'text' | 'image_upload'
  options?: Array<{ id: string; text: string }>
  correct_answers: string[]
  max_score: number
  tags?: string[]
  created_at: string
  updated_at: string
}

export interface ImportResult {
  total_rows: number
  valid_count: number
  invalid_count: number
  valid_questions: Question[]
  invalid_rows: Array<{
    row: number
    error: string
    data: Record<string, unknown>
  }>
}

export interface QuestionFilters {
  skip?: number
  limit?: number
  complexity?: string
  type?: string
  search?: string
}

export const questionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Import questions from Excel
    importQuestions: builder.mutation<ImportResult, FormData>({
      query: (formData) => ({
        url: '/questions/import',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Question'],
    }),
    
    // Get all questions with filters
    getQuestions: builder.query<Question[], QuestionFilters>({
      query: (params) => ({
        url: '/questions',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Question' as const, id })),
              { type: 'Question', id: 'LIST' },
            ]
          : [{ type: 'Question', id: 'LIST' }],
    }),
    
    // Get single question
    getQuestion: builder.query<Question, string>({
      query: (id) => `/questions/${id}`,
      providesTags: (result, error, id) => [{ type: 'Question', id }],
    }),
    
    // Update question
    updateQuestion: builder.mutation<
      Question,
      { id: string; data: Partial<Question> }
    >({
      query: ({ id, data }) => ({
        url: `/questions/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Question', id },
        { type: 'Question', id: 'LIST' },
      ],
    }),
    
    // Delete question
    deleteQuestion: builder.mutation<void, string>({
      query: (id) => ({
        url: `/questions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Question', id: 'LIST' }],
    }),
  }),
})

export const {
  useImportQuestionsMutation,
  useGetQuestionsQuery,
  useGetQuestionQuery,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation,
} = questionsApi