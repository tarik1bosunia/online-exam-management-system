
import SignupForm from '@/features/auth/components/SignupForm';

export default function SignupPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <SignupForm />
    </div>
  );
}


// "use client"

// import { RegisterForm } from '@/components/auth/RegisterForm'

// export default function RegisterPage() {
//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
//       <RegisterForm />
//     </div>
//   )
// }