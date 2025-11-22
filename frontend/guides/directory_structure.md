## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                           # Next.js 14 App Router
│   │   ├── (auth)/                    # Auth layout group
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/               # Dashboard layout group
│   │   │   ├── admin/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx           # Admin dashboard
│   │   │   │   ├── questions/
│   │   │   │   │   ├── page.tsx       # Question list
│   │   │   │   │   ├── import/
│   │   │   │   │   │   └── page.tsx   # Import Excel
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── page.tsx   # Edit question
│   │   │   │   ├── exams/
│   │   │   │   │   ├── page.tsx       # Exam list
│   │   │   │   │   ├── create/
│   │   │   │   │   │   └── page.tsx   # Create exam
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── page.tsx   # Exam details
│   │   │   │   │       ├── edit/
│   │   │   │   │       │   └── page.tsx
│   │   │   │   │       └── results/
│   │   │   │   │           └── page.tsx
│   │   │   │   └── results/
│   │   │   │       └── page.tsx       # All results
│   │   │   └── student/
│   │   │       ├── layout.tsx
│   │   │       ├── page.tsx           # Student dashboard
│   │   │       ├── exams/
│   │   │       │   ├── page.tsx       # Available exams
│   │   │       │   └── [id]/
│   │   │       │       ├── start/
│   │   │       │       │   └── page.tsx
│   │   │       │       └── take/
│   │   │       │           └── page.tsx # Taking exam
│   │   │       └── results/
│   │   │           ├── page.tsx       # My results
│   │   │           └── [id]/
│   │   │               └── page.tsx   # Result detail
│   │   ├── layout.tsx                 # Root layout
│   │   ├── page.tsx                   # Home/landing page
│   │   └── providers.tsx              # Redux provider
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── admin/
│   │   │   ├── QuestionList.tsx
│   │   │   ├── QuestionForm.tsx
│   │   │   ├── ExcelImport.tsx
│   │   │   ├── ExamForm.tsx
│   │   │   ├── ExamList.tsx
│   │   │   └── ResultsTable.tsx
│   │   ├── student/
│   │   │   ├── ExamCard.tsx
│   │   │   ├── ExamTimer.tsx
│   │   │   ├── QuestionDisplay.tsx
│   │   │   ├── AnswerInput.tsx
│   │   │   └── ResultCard.tsx
│   │   ├── shared/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Loading.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   └── Toast.tsx
│   │   └── ui/                        # shadcn/ui components
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       └── ...
│   ├── lib/
│   │   ├── store/                     # Redux store
│   │   │   ├── store.ts               # Store configuration
│   │   │   ├── hooks.ts               # Typed hooks
│   │   │   └── slices/
│   │   │       ├── authSlice.ts
│   │   │       ├── examSlice.ts
│   │   │       └── uiSlice.ts
│   │   ├── api/                       # RTK Query APIs
│   │   │   ├── baseApi.ts             # Base API configuration
│   │   │   ├── authApi.ts
│   │   │   ├── questionsApi.ts
│   │   │   ├── examsApi.ts
│   │   │   ├── participationApi.ts
│   │   │   └── resultsApi.ts
│   │   ├── utils/
│   │   │   ├── cn.ts                  # Class name utility
│   │   │   ├── formatters.ts
│   │   │   └── validators.ts
│   │   └── types/
│   │       ├── auth.types.ts
│   │       ├── question.types.ts
│   │       ├── exam.types.ts
│   │       └── result.types.ts
│   └── hooks/
│       ├── useAuth.ts
│       ├── useExamTimer.ts
│       ├── useAutoSave.ts
│       └── useToast.ts
├── public/
│   ├── images/
│   └── icons/
├── .env.local
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```