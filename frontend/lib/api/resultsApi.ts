import { baseApi } from './baseApi'

export interface StudentResult {
  student_exam_id: string
  exam_title: string
  status: 'not_started' | 'in_progress' | 'submitted' | 'expired'
  score: number | null
  max_score: number
  percentage: number | null
  submitted_at: string | null
}

export interface DetailedResult {
  student_exam_id: string
  exam_title: string
  student_name: string
  status: string
  started_at: string
  submitted_at: string
  time_taken_minutes: number
  total_score: number
  max_possible_score: number
  percentage: number
  questions: Array<{
    question_title: string
    question_type: string
    student_answer: string | string[] | null
    correct_answer?: string | string[] | null
    is_correct: boolean | null
    score: number | null
    max_score: number
  }>
}

export interface ExamResultsSummary {
  exam_id: string
  exam_title: string
  total_students: number
  submitted_count: number
  in_progress_count: number
  not_started_count: number
  average_score: number
  highest_score: number
  lowest_score: number
  student_results: Array<{
    student_exam_id: string
    student_name: string
    student_email: string
    status: string
    score: number | null
    percentage: number | null
    submitted_at: string | null
  }>
}

export const resultsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get detailed result
    getStudentResult: builder.query<DetailedResult, string>({
      query: (studentExamId) => `/results/student/${studentExamId}`,
      providesTags: (result, error, id) => [{ type: 'Result', id }],
    }),
    
    // Get exam results summary (admin)
    getExamResults: builder.query<ExamResultsSummary, string>({
      query: (examId) => `/results/exam/${examId}`,
      providesTags: (result, error, id) => [{ type: 'Result', id: `exam-${id}` }],
    }),
    
    // Get my results (student)
    getMyResults: builder.query<StudentResult[], void>({
      query: () => '/results/my-results',
      providesTags: [{ type: 'Result', id: 'MY_RESULTS' }],
    }),
    
    // Manual grading (admin)
    gradeManualAnswer: builder.mutation<
      any,
      { answerId: string; score: number; is_correct: boolean }
    >({
      query: ({ answerId, ...data }) => ({
        url: `/results/grade-manual/${answerId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: [{ type: 'Result', id: 'LIST' }],
    }),
  }),
})

export const {
  useGetStudentResultQuery,
  useGetExamResultsQuery,
  useGetMyResultsQuery,
  useGradeManualAnswerMutation,
} = resultsApi