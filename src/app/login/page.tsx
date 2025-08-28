import LoginButton from '@/components/auth/LoginButton'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to ChatGPT Clone
          </h1>
          <p className="text-gray-600 mb-8">
            Sign in to start your conversations with AI
          </p>
          
          <div className="space-y-4">
            <LoginButton />
            
            <div className="text-xs text-gray-500 mt-4">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}