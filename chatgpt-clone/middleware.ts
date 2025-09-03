import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let res = NextResponse.next()
  const pathname = req.nextUrl.pathname

  // Create a Supabase client configured to use cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => req.cookies.get(name)?.value,
        set: (name: string, value: string, options: any) => {
          res.cookies.set({ name, value, ...options })
        },
        remove: (name: string, options: any) => {
          res.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  const { data: { session } } = await supabase.auth.getSession()

  // Define protected and public routes
  const protectedRoutes = ['/dashboard']
  const authRoutes = ['/login', '/auth']
  
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  )

  // Redirect authenticated users away from auth pages
  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Redirect unauthenticated users to login for protected routes
  if (!session && isProtectedRoute) {
    const redirectUrl = new URL('/login', req.url)
    // Preserve the original URL as a redirect parameter
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Allow the request to continue
  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}