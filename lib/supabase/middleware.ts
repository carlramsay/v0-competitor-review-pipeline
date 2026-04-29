import { NextResponse, type NextRequest } from 'next/server'

const AUTH_COOKIE_NAME = "app_session"

export async function updateSession(request: NextRequest) {
  const session = request.cookies.get(AUTH_COOKIE_NAME)
  const isAuthenticated = !!session?.value
  const pathname = request.nextUrl.pathname

  console.log("[v0] Middleware check:", { pathname, isAuthenticated, hasCookie: !!session })

  const protectedPaths = ['/form', '/generate', '/reviews', '/admin', '/queue']
  const isProtectedPath = protectedPaths.some(path => 
    pathname.startsWith(path)
  )

  if (isProtectedPath && !isAuthenticated) {
    console.log("[v0] Middleware redirecting to / - not authenticated for protected path:", pathname)
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}
