import { NextResponse, type NextRequest } from 'next/server'

const AUTH_COOKIE_NAME = "app_session"

export async function updateSession(request: NextRequest) {
  const session = request.cookies.get(AUTH_COOKIE_NAME)
  const isAuthenticated = !!session?.value

  const protectedPaths = ['/form', '/generate', '/reviews', '/admin', '/queue']
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )

  if (isProtectedPath && !isAuthenticated) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}
