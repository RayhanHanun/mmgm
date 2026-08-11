'use server'

import { cookies } from 'next/headers'

export async function verifyPin(pin: string) {
  const sharedPin = process.env.SHARED_PIN

  if (pin === sharedPin) {
    const cookieStore = await cookies()
    
    // Set cookie valid for 30 days
    cookieStore.set('mmgm_pin_session', pin, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 days in seconds
      path: '/',
    })
    
    return { success: true }
  }

  return { success: false, error: 'PIN tidak valid' }
}

export async function logout() {
  const { createClient } = await import('@/utils/supabase/server')
  const supabase = await createClient()
  await supabase.auth.signOut()
}
