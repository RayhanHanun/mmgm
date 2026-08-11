'use client'

import { useState } from 'react'
import { verifyPin } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'

export default function LoginPinPage() {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const result = await verifyPin(pin)
    
    if (result.success) {
      router.push('/')
      router.refresh()
    } else {
      setError(result.error || 'Terjadi kesalahan')
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-950">
      <div className="w-full max-w-sm rounded-xl border bg-card text-card-foreground shadow-sm p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">Akses Anggota</h1>
          <p className="mt-2 text-sm text-muted-foreground">Masukkan 4 digit PIN bersama</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pin">PIN Akses</Label>
            <Input
              id="pin"
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              required
              className="text-center text-2xl tracking-[0.5em] h-14"
            />
          </div>

          {error && <p className="text-sm text-destructive font-medium">{error}</p>}

          <Button type="submit" className="w-full h-12 text-lg" disabled={isLoading}>
            {isLoading ? 'Memverifikasi...' : 'Masuk'}
          </Button>
        </form>
      </div>
    </div>
  )
}
