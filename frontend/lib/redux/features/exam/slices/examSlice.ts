import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface ExamState {
  currentExamId: string | null
  studentExamId: string | null
  answers: Record<string, string | string[] | number | null>
  timeRemaining: number | null
  isSubmitting: boolean
  lastSaved: string | null
}

const initialState: ExamState = {
  currentExamId: null,
  studentExamId: null,
  answers: {},
  timeRemaining: null,
  isSubmitting: false,
  lastSaved: null,
}

const examSlice = createSlice({
  name: 'exam',
  initialState,
  reducers: {
    startExam: (
      state,
      action: PayloadAction<{
        examId: string
        studentExamId: string
        timeRemaining: number
      }>
    ) => {
      state.currentExamId = action.payload.examId
      state.studentExamId = action.payload.studentExamId
      state.timeRemaining = action.payload.timeRemaining
      state.answers = {}
    },
    
    saveAnswer: (
      state,
      action: PayloadAction<{ questionId: string; answer: string | string[] | number | null }>
    ) => {
      state.answers[action.payload.questionId] = action.payload.answer
      state.lastSaved = new Date().toISOString()
    },
    
    loadSavedAnswers: (
      state,
      action: PayloadAction<Record<string, string | string[] | number | null>>
    ) => {
      state.answers = action.payload
    },
    
    decrementTime: (state) => {
      if (state.timeRemaining && state.timeRemaining > 0) {
        state.timeRemaining -= 1
      }
    },
    
    setSubmitting: (state, action: PayloadAction<boolean>) => {
      state.isSubmitting = action.payload
    },
    
    resetExam: (state) => {
      state.currentExamId = null
      state.studentExamId = null
      state.answers = {}
      state.timeRemaining = null
      state.isSubmitting = false
      state.lastSaved = null
    },
  },
})

export const {
  startExam,
  saveAnswer,
  loadSavedAnswers,
  decrementTime,
  setSubmitting,
  resetExam,
} = examSlice.actions

export default examSlice.reducer

export const selectCurrentAnswer = (questionId: string) => 
  (state: { exam: ExamState }) => state.exam.answers[questionId]

export const selectAllAnswers = (state: { exam: ExamState }) => 
  state.exam.answers

export const selectTimeRemaining = (state: { exam: ExamState }) => 
  state.exam.timeRemaining