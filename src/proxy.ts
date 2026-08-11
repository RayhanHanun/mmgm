import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function proxy(request: NextRequest) {
  // Update session dan dapatkan user untuk pengecekan rute admin
  const { supabaseResponse, user } = await updateSession(request)

  const { pathname } = request.nextUrl

  // 1. Rute Admin: Dilindungi oleh Supabase Auth JWT
  if (pathname.startsWith('/admin')) {
    // Biarkan akses ke halaman login admin
    if (pathname === '/admin/login') {
      // (Opsional: Jika sudah login, redirect menjauh dari halaman login)
      if (user) {
         const url = request.nextUrl.clone()
         url.pathname = '/admin/dashboard'
         return NextResponse.redirect(url)
      }
      return supabaseResponse
    }

    // Jika mencoba akses admin tapi belum login
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }
  }

  // 2. Rute Publik: Dilindungi oleh Shared PIN
  if (pathname === '/') {
    const pinCookie = request.cookies.get('mmgm_pin_session')
    const sharedPin = process.env.SHARED_PIN

    if (!pinCookie || pinCookie.value !== sharedPin) {
      const url = request.nextUrl.clone()
      url.pathname = '/login-pin'
      return NextResponse.redirect(url)
    }
  }

  // Cegah akses root jika di login-pin tapi PIN sudah benar
  if (pathname === '/login-pin') {
    const pinCookie = request.cookies.get('mmgm_pin_session')
    const sharedPin = process.env.SHARED_PIN
    if (pinCookie && pinCookie.value === sharedPin) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Ekstensi gambar dan statis umum
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
