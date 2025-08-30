import { NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

// Mock @supabase/ssr
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(),
}))

// Mock Next.js server response
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    next: jest.fn(),
    redirect: jest.fn(),
  },
}))

describe('Middleware updateSession', () => {
  const mockCreateServerClient = require('@supabase/ssr').createServerClient
  const mockNextResponse = NextResponse as any

  beforeEach(() => {
    jest.clearAllMocks()
    // Set up environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

    // Default mock response
    mockNextResponse.next.mockReturnValue({
      cookies: { set: jest.fn() },
    })
    mockNextResponse.redirect.mockReturnValue({
      cookies: { set: jest.fn() },
    })
  })

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  })

  it('should return supabase response when user is authenticated', async () => {
    const mockUser = { id: '1', email: 'test@example.com' }
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    }
    mockCreateServerClient.mockReturnValue(mockSupabase)

    const mockRequest = {
      cookies: {
        get: jest.fn(),
        set: jest.fn(),
      },
      headers: new Headers(),
      nextUrl: {
        pathname: '/dashboard',
        clone: jest.fn(),
      },
    }

    const mockSupabaseResponse = { cookies: { set: jest.fn() } }
    mockNextResponse.next.mockReturnValue(mockSupabaseResponse)

    const result = await updateSession(mockRequest as any)

    expect(result).toBe(mockSupabaseResponse)
    expect(mockSupabase.auth.getUser).toHaveBeenCalled()
    expect(mockNextResponse.redirect).not.toHaveBeenCalled()
  })

  it('should redirect to login when user is not authenticated', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    }
    mockCreateServerClient.mockReturnValue(mockSupabase)

    const mockUrl = {
      pathname: '/dashboard',
      clone: jest.fn().mockReturnThis(),
    }
    const mockRequest = {
      cookies: {
        get: jest.fn(),
        set: jest.fn(),
      },
      headers: new Headers(),
      nextUrl: mockUrl,
    }

    const mockRedirectResponse = { cookies: { set: jest.fn() } }
    mockNextResponse.redirect.mockReturnValue(mockRedirectResponse)

    const result = await updateSession(mockRequest as any)

    expect(mockSupabase.auth.getUser).toHaveBeenCalled()
    expect(mockUrl.pathname).toBe('/login')
    expect(mockNextResponse.redirect).toHaveBeenCalledWith(mockUrl)
    expect(result).toBe(mockRedirectResponse)
  })

  it('should not redirect for login page', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    }
    mockCreateServerClient.mockReturnValue(mockSupabase)

    const mockRequest = {
      cookies: {
        get: jest.fn(),
        set: jest.fn(),
      },
      headers: new Headers(),
      nextUrl: {
        pathname: '/login',
        clone: jest.fn(),
      },
    }

    const mockSupabaseResponse = { cookies: { set: jest.fn() } }
    mockNextResponse.next.mockReturnValue(mockSupabaseResponse)

    const result = await updateSession(mockRequest as any)

    expect(mockNextResponse.redirect).not.toHaveBeenCalled()
    expect(result).toBe(mockSupabaseResponse)
  })

  it('should not redirect for auth pages', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    }
    mockCreateServerClient.mockReturnValue(mockSupabase)

    const authPaths = ['/auth/callback', '/auth/error']

    for (const pathname of authPaths) {
      const mockRequest = {
        cookies: {
          get: jest.fn(),
          set: jest.fn(),
        },
        headers: new Headers(),
        nextUrl: {
          pathname,
          clone: jest.fn(),
        },
      }

      await updateSession(mockRequest as any)
      expect(mockNextResponse.redirect).not.toHaveBeenCalled()
    }
  })

  it('should not redirect for Next.js internal pages', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    }
    mockCreateServerClient.mockReturnValue(mockSupabase)

    const internalPaths = ['/_next/static/chunk.js', '/favicon.ico']

    for (const pathname of internalPaths) {
      const mockRequest = {
        cookies: {
          get: jest.fn(),
          set: jest.fn(),
        },
        headers: new Headers(),
        nextUrl: {
          pathname,
          clone: jest.fn(),
        },
      }

      await updateSession(mockRequest as any)
      expect(mockNextResponse.redirect).not.toHaveBeenCalled()
    }
  })

  it('should configure supabase client with correct cookie handlers', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: '1' } },
          error: null,
        }),
      },
    }
    mockCreateServerClient.mockReturnValue(mockSupabase)

    const mockRequest = {
      cookies: {
        get: jest.fn().mockReturnValue({ value: 'cookie-value' }),
        set: jest.fn(),
      },
      headers: new Headers(),
      nextUrl: {
        pathname: '/dashboard',
      },
    }

    await updateSession(mockRequest as any)

    expect(mockCreateServerClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key',
      expect.objectContaining({
        cookies: expect.objectContaining({
          get: expect.any(Function),
          set: expect.any(Function),
          remove: expect.any(Function),
        }),
      })
    )

    // Test cookie handlers
    const cookieConfig = mockCreateServerClient.mock.calls[0][2]
    
    // Test get
    const value = cookieConfig.cookies.get('test-cookie')
    expect(mockRequest.cookies.get).toHaveBeenCalledWith('test-cookie')
    expect(value).toBe('cookie-value')

    // Test set and remove functions exist
    expect(typeof cookieConfig.cookies.set).toBe('function')
    expect(typeof cookieConfig.cookies.remove).toBe('function')
  })
})