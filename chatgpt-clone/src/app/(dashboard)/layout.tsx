import { AuthProvider } from '@/components/auth/AuthProvider'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          {children}
        </div>
      </ProtectedRoute>
    </AuthProvider>
  )
}