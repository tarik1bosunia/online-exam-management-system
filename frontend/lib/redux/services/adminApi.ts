import { api } from '../api';

export interface Question {
  id: string;
  title: string;
  type: string;
  complexity: string;
}

export const adminApi = api.injectEndpoints({
  endpoints: (builder) => ({
    importQuestions: builder.mutation<{ imported_count: number }, FormData>({
      query: (formData) => ({
        url: '/questions/import',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Question'],
    }),

    getAllQuestions: builder.query<Question[], void>({
      query: () => '/questions/',
      providesTags: ['Question'],
    }),

    createExam: builder.mutation<any, { title: string; start_time: string; end_time: string; duration_minutes: number }>({
      query: (data) => ({
        url: '/exams/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Exam'],
    }),

    addQuestionsToExam: builder.mutation<void, { examId: string; question_ids: string[] }>({
      query: ({ examId, question_ids }) => ({
        url: `/exams/${examId}/questions`,
        method: 'POST',
        body: { question_ids },
      }),
    }),

    publishExam: builder.mutation<void, { examId: string; is_published: boolean }>({
      query: ({ examId, is_published }) => ({
        url: `/exams/${examId}`,
        method: 'PATCH',
        body: { is_published },
      }),
      invalidatesTags: ['Exam'],
    }),
  }),
});

export const {
  useImportQuestionsMutation,
  useGetAllQuestionsQuery,
  useCreateExamMutation,
  useAddQuestionsToExamMutation,
  usePublishExamMutation,
} = adminApi;