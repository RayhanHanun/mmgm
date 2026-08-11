import { getDashboardData } from '@/lib/data-fetcher'
import { DashboardView } from '@/components/DashboardView'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function PublicDashboard({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const params = await searchParams
  const yearParam = params?.year
  const currentYear = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear()
  const data = await getDashboardData(currentYear)

  return (
    <main className="min-h-screen bg-[#f4f6f8]">
      <DashboardView 
        data={data} 
        isAdmin={false} 
        userRole={null} 
        currentYear={currentYear} 
        headerTitle="MMGM"
        headerAction={
          <Link 
            href="/admin/login" 
            className="inline-flex items-center justify-center text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-lg transition-all"
          >
          Admin
          </Link>
        }
      />
    </main>
  )
}
