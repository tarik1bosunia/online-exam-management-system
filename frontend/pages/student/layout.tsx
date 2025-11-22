import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute'
import { Navbar } from '@/components/shared/Navbar'
import { Sidebar } from '@/components/shared/Sidebar'

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['student']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex">
          <Sidebar role="student" />
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  )
}