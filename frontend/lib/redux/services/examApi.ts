import { api } from '../api';

export interface Exam {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  question_count: number;
  start_time: string;
  end_time: string;
  is_published: boolean;
  attempt_status: 'not_attempted' | 'in_progress' | 'submitted';
  attempt_id?: string | null;
}

export const examApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Fetch all available exams
    getExams: builder.query<Exam[], void>({
      query: () => '/exams/',
      providesTags: ['Exam'],
    }),
    // We will add 'startExam' here in the next step
  }),
});

export const { useGetExamsQuery } = examApi;