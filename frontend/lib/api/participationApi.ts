import { baseApi } from './baseApi'

// Answer types
export type AnswerValue = string | string[] | number | null;

export interface SavedAnswer {
  question_id: string;
  selected_options?: string[];
  text_answer?: string;
}

export interface ExamDetails {
  id: string;
  title: string;
  description?: string;
  duration_minutes: number;
  start_time: string;
  end_time: string;
  questions: Array<{
    id: string;
    title: string;
    type: string;
    options?: Array<{ id: string; text: string }>;
  }>;
}

export interface AvailableExam {
  exam_id: string
  title: string
  description?: string
  start_time: string
  end_time: string
  duration_minutes: number
  question_count: number
  total_score: number
  status: 'not_started' | 'in_progress' | 'submitted' | 'expired'
  can_start: boolean
  can_resume: boolean
}


export interface ExamStartResponse {
  student_exam_id: string
  exam: ExamDetails
  started_at: string
  deadline: string
}

export interface SaveAnswerRequest {
  student_exam_id: string
  question_id: string
  answer: AnswerValue
}

export interface ResumeExamResponse {
  student_exam_id: string
  exam: ExamDetails
  started_at: string
  deadline: string
  saved_answers: SavedAnswer[]
  time_remaining_seconds: number
}

export interface SubmitExamResponse {
  success: boolean
  student_exam_id: string
  submitted_at: string
  total_score: number
  max_possible_score: number
  percentage: number
  graded_count: number
  pending_count: number
  results: Array<{
    question_id: string;
    is_correct: boolean;
    score: number;
  }>
}

export const participationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAvailableExams: builder.query<AvailableExam[], void>({
      query: () => '/participation/available',
      providesTags: ['StudentExam'],
    }),
    
    startExam: builder.mutation<ExamStartResponse, string>({
      query: (examId) => ({
        url: `/participation/start/${examId}`,
        method: 'POST',
      }),
      invalidatesTags: ['StudentExam'],
    }),
    
    saveAnswer: builder.mutation<any, SaveAnswerRequest>({
      query: (data) => ({
        url: '/participation/save-answer',
        method: 'POST',
        body: data,
      }),
    }),
    
    resumeExam: builder.query<ResumeExamResponse, string>({
      query: (examId) => `/participation/resume/${examId}`,
    }),
    
    submitExam: builder.mutation<SubmitExamResponse, string>({
      query: (studentExamId) => ({
        url: `/participation/submit/${studentExamId}`,
        method: 'POST',
      }),
      invalidatesTags: ['StudentExam', 'Result'],
    }),
  }),
})

export const {
  useGetAvailableExamsQuery,
  useStartExamMutation,
  useSaveAnswerMutation,
  useResumeExamQuery,
  useSubmitExamMutation,
} = participationApi