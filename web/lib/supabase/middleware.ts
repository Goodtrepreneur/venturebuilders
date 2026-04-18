import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(
          cookiesToSet: {
            name: string
            value: string
            options?: Parameters<NextResponse["cookies"]["set"]>[2]
          }[]
        ) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Public routes (no auth required). /privacy must stay reachable while logged out.
  if (pathname === "/privacy") {
    return response
  }

  const isProtectedRoute =
    pathname.startsWith("/dashboard") || pathname.startsWith("/admin")
  const isLoginPage = pathname === "/login"

  if (isProtectedRoute && !user) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirectTo", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (pathname.startsWith("/admin") && user?.email !== "steve@veturebuilders.fund") {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  if (isLoginPage && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return response
}
