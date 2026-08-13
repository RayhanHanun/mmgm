import { getDashboardData } from '@/lib/data-fetcher'
import { DashboardView } from '@/components/DashboardView'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/admin/login')

  let account = await prisma.systemAccount.findUnique({ where: { id: user.id } })
  if (!account && user.email) {
    const username = user.email.split('@')[0]
    account = await prisma.systemAccount.findUnique({ where: { username } })
  }

  if (!account) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-destructive">Akses Ditolak</h1>
        <p className="mt-2 text-muted-foreground">Akun Supabase Anda belum diregistrasikan di tabel SystemAccount (Role Mapping).</p>
      </div>
    )
  }

  const params = await searchParams
  const yearParam = params?.year
  const currentYear = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear()
  const data = await getDashboardData(currentYear)

  return (
    <div className="flex-1 bg-[#f4f6f8]">
      <DashboardView 
        data={data} 
        isAdmin={true} 
        userRole={account.role} 
        currentYear={currentYear} 
        headerTitle="Admin MMGM"
        headerAction={
          <form action={async () => {
            'use server'
            const { logout } = await import('@/actions/auth')
            await logout()
            const { redirect } = await import('next/navigation')
            redirect('/')
          }}>
            <button 
              type="submit"
              className="inline-flex items-center justify-center text-sm font-medium text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 px-4 py-2 rounded-lg transition-all"
            >
              Keluar ←
            </button>
          </form>
        }
      />
    </div>
  )
}
