'use client'

import { useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function EmailLoginButton() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  
  const supabase = createSupabaseClient()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setMessage('Please enter your email address')
      return
    }

    setIsLoading(true)
    setMessage('')
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      })
      
      if (error) {
        setMessage(error.message)
        setIsSuccess(false)
      } else {
        setMessage('Check your email for the login link!')
        setIsSuccess(true)
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.')
      setIsSuccess(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleEmailLogin} className="space-y-4">
      <div>
        <Input
          type="email"
          placeholder="Enter your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          fullWidth
        />
      </div>
      
      <Button
        type="submit"
        loading={isLoading}
        disabled={isLoading}
        variant="primary"
        size="lg"
        className="w-full"
      >
        {isLoading ? 'Sending...' : 'Send Magic Link'}
      </Button>
      
      {message && (
        <div className={`text-sm text-center ${
          isSuccess ? 'text-green-600' : 'text-red-600'
        }`}>
          {message}
        </div>
      )}
    </form>
  )
}