import { api } from '../api';

export interface Question {
  id: string;
  title: string;
  type: 'single_choice' | 'multi_choice' | 'text';
  options: string[];
  max_score: number;
}

export interface AttemptState {
  attempt_id: string;
  exam_title: string;
  start_time: string;
  duration_minutes: number;
  remaining_seconds: number;
  questions: Question[];
  saved_answers: {
    question_id: string;
    selected_options: string[] | null;
    text_answer: string | null;
  }[];
}

export interface AttemptHistory {
  id: string;
  exam_title: string;
  start_time: string;
  submit_time: string | null;
  status: 'in_progress' | 'submitted';
  total_score: number;
  max_possible_score: number;
}

export interface QuestionReview {
  id: string;
  title: string;
  description: string;
  type: string;
  options: string[];
  correct_answers: string[]; // Revealed in review
  selected_options: string[];
  text_answer: string;
  score_awarded: number;
  max_score: number;
  is_correct: boolean;
  is_graded: boolean; 
}

export interface AttemptReview {
  attempt_id: string;
  exam_title: string;
  start_time: string;
  submit_time: string;
  total_score: number;
  max_possible_score: number;
  questions: QuestionReview[];
}

export const attemptApi = api.injectEndpoints({
  endpoints: (builder) => ({
    startExam: builder.mutation<AttemptState, string>({
      query: (examId) => ({
        url: `/attempts/start/${examId}`,
        method: 'POST',
      }),
    }),
    saveAnswer: builder.mutation<void, { attemptId: string; question_id: string; selected_options?: string[]; text_answer?: string }>({
      query: ({ attemptId, ...body }) => ({
        url: `/attempts/${attemptId}/save`,
        method: 'POST',
        body,
      }),
    }),
    
    submitExam: builder.mutation<{ total_score: number }, string>({
      query: (attemptId) => ({
        url: `/attempts/${attemptId}/submit`,
        method: 'POST',
      }),
    }),

    getHistory: builder.query<AttemptHistory[], void>({
      query: () => '/attempts/history',
      providesTags: ['Attempt'],
    }),

        // 5. Get Detailed Review (Single Result)
    getAttemptReview: builder.query<AttemptReview, string>({
      query: (attemptId) => `/attempts/${attemptId}`,
      providesTags: ['Attempt'],
    }),

    updateScore: builder.mutation<AttemptReview, { attemptId: string; question_id: string; score: number }>({
      query: ({ attemptId, question_id, score }) => ({
        url: `/attempts/${attemptId}/grade/${question_id}`,
        method: 'PATCH',
        body: { score },
      }),
      invalidatesTags: ['Attempt'],
    }),
        // 7. Get All Attempts for a Specific Exam (Admin View)
    getExamAttempts: builder.query<AttemptHistory[], string>({
      query: (examId) => `/attempts/exam/${examId}`,
      providesTags: ['Attempt'],
    }),
  }),

  
});

export const { 
  useStartExamMutation, 
  useSaveAnswerMutation, 
  useSubmitExamMutation, 
  useGetHistoryQuery,
  useGetAttemptReviewQuery,
  useUpdateScoreMutation,
  useGetExamAttemptsQuery
} = attemptApi;