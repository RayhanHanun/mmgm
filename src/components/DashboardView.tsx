'use client'

import { useState, useCallback } from 'react'
import { OptimisticCheckbox } from './OptimisticCheckbox'
import { ExpenseDialog } from './ExpenseDialog'
import { Wallet, AlertTriangle, HeartHandshake, TrendingDown, LayoutDashboard, Landmark, Users, Dice5, Receipt, Trash2, Eye, EyeOff } from 'lucide-react'
import Image from 'next/image'
import { deleteExpense } from '@/actions/expenses'
import { deleteArisanWinner } from '@/actions/arisan'
import { toggleArisanParticipation } from '@/actions/members'
import { updateInitialBalance } from '@/actions/transactions'
import { ArisanSpinDialog } from './ArisanSpinDialog'
import { MemberDialog } from './MemberDialog'
import { DeleteMemberDialog } from './DeleteMemberDialog'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const CATEGORIES = {
  1: { name: 'Kas', role: 'PJ_KAS' },
  2: { name: 'Dana Sosial', role: 'PJ_DANASOS' },
  3: { name: 'Arisan', role: 'PJ_ARISAN' },
}

const formatIDR = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val)

type TabKey = 'global' | 'kas' | 'danasos' | 'arisan'

const TAB_CONFIG: { key: TabKey; label: string; icon: typeof LayoutDashboard; activeClass: string }[] = [
  { key: 'global', label: 'Ringkasan', icon: LayoutDashboard, activeClass: 'bg-gray-900 text-white' },
  { key: 'kas', label: 'Kas', icon: Landmark, activeClass: 'bg-emerald-600 text-white' },
  { key: 'danasos', label: 'Dansos', icon: Users, activeClass: 'bg-sky-600 text-white' },
  { key: 'arisan', label: 'Arisan', icon: Dice5, activeClass: 'bg-violet-600 text-white' },
]

export function DashboardView({ data, isAdmin, userRole, currentYear, headerTitle, headerSubtitle, headerAction }: any) {
  const [activeTab, setActiveTab] = useState<TabKey>('global')
  const { financials, matrixData } = data
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [confirmState, setConfirmState] = useState<{ open: boolean, title: string, message: string, onConfirm: () => void }>({ open: false, title: '', message: '', onConfirm: () => {} })
  const [editBalance, setEditBalance] = useState<{ open: boolean, categoryId: number, amount: string }>({ open: false, categoryId: 1, amount: '' })
  const [isUpdatingBalance, setIsUpdatingBalance] = useState(false)

  const handleUpdateBalance = async () => {
    setIsUpdatingBalance(true)
    const res = await updateInitialBalance({ categoryId: editBalance.categoryId, amount: Number(editBalance.amount) || 0 })
    setIsUpdatingBalance(false)
    if (res.success) {
      toast.success('Saldo awal berhasil diperbarui')
      setEditBalance({ ...editBalance, open: false })
    } else {
      toast.error(res.error)
    }
  }

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('year', e.target.value)
    router.push(`${pathname}?${params.toString()}`)
  }

  // Callback ref to auto-scroll table on mobile
  const tableContainerRef = useCallback((node: HTMLDivElement | null) => {
    if (node && window.innerWidth < 768) {
      setTimeout(() => {
        const now = new Date()
        if (currentYear === now.getFullYear()) {
          const currentMonth = now.getMonth()
          const ths = node.querySelectorAll('th')
          if (ths.length > currentMonth + 1) {
            const targetTh = ths[currentMonth + 1]
            const stickyWidth = ths[0].offsetWidth
            node.scrollTo({
              left: targetTh.offsetLeft - stickyWidth - 10,
              behavior: 'smooth'
            })
          }
        }
      }, 100)
    }
  }, [currentYear])

  const leaderboard = [...matrixData].map(row => {
    let unpaids = 0
    const currentMonthIndex = new Date().getFullYear() === currentYear ? new Date().getMonth() : 11
    for (let m = 1; m <= currentMonthIndex + 1; m++) {
      if (!row.kas[m]) unpaids++
      if (!row.danasos[m]) unpaids++
      if (!row.arisan[m]) unpaids++
    }
    return { name: row.member.nickname, unpaids }
  })
    .sort((a, b) => b.unpaids - a.unpaids)
    .slice(0, 5)

  const renderMatrixTable = (categoryId: number, categoryKey: 'kas' | 'danasos' | 'arisan') => {
    const isCategoryAdmin = isAdmin && (userRole === 'SUPER_ADMIN' || userRole === CATEGORIES[categoryId as keyof typeof CATEGORIES].role)
    const catTheme = {
      header: 'bg-slate-900',
      headerText: 'text-slate-50',
      accent: 'text-slate-900'
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className={`text-lg font-bold tracking-tight ${catTheme.accent}`}>
            Data {CATEGORIES[categoryId as keyof typeof CATEGORIES].name}
          </h2>
          <div className="flex items-center gap-2">
            <select
              value={currentYear}
              onChange={handleYearChange}
              className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-500 font-medium shadow-sm"
            >
              {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2].sort().map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            {isCategoryAdmin && categoryId !== 3 && (
              <ExpenseDialog categoryId={categoryId as 1 | 2} categoryName={CATEGORIES[categoryId as keyof typeof CATEGORIES].name} />
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl overflow-hidden ring-1 ring-gray-200/60 w-full">
          <div ref={tableContainerRef} className="w-full overflow-x-auto relative">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className={catTheme.header}>
                  <th className={`sticky left-0 z-10 ${catTheme.header} ${catTheme.headerText} px-3 md:px-4 py-3 min-w-[120px] md:min-w-[160px] text-left text-[11px] md:text-xs font-semibold uppercase tracking-wider border-r border-white/20`}>
                    Anggota
                  </th>
                  {MONTHS.map((month, idx) => (
                    <th key={idx} className={`${catTheme.headerText} px-0.5 md:px-1 py-3 text-center min-w-[44px] md:min-w-[56px] text-[11px] md:text-xs font-semibold uppercase tracking-wider`}>{month}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrixData.map((row: any, index: number) => {
                  const isArisanInactive = categoryId === 3 && !row.member.is_arisan_active
                  return (
                    <tr key={row.member.id} className={`border-b border-gray-100 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${isArisanInactive ? 'opacity-50 grayscale' : 'hover:bg-gray-100'}`}>
                      <td className="sticky left-0 z-10 bg-inherit border-r border-gray-100 px-3 md:px-4 py-2.5 md:py-3 font-medium text-gray-800 whitespace-nowrap">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 md:gap-2">
                            <span className="text-xs md:text-sm">
                              {row.member.nickname}
                              {!row.member.is_active && <span className="ml-2 text-[9px] md:text-[10px] text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full font-semibold">Inaktif</span>}
                              {isArisanInactive && <span className="ml-2 text-[9px] md:text-[10px] text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded-full font-semibold">Cuti Arisan</span>}
                            </span>
                          </span>
                          {categoryId === 3 && isCategoryAdmin && (
                              <button
                                onClick={() => {
                                  const newStatus = !row.member.is_arisan_active
                                  setConfirmState({
                                    open: true,
                                    title: 'Konfirmasi Status Arisan',
                                    message: `Yakin ingin ${newStatus ? 'mengaktifkan' : 'menonaktifkan'} arisan untuk ${row.member.nickname}?`,
                                    onConfirm: async () => {
                                      const res = await toggleArisanParticipation(row.member.id, newStatus)
                                      if (!res.success) {
                                        toast.error(res.error)
                                      } else {
                                        toast.success(`Arisan ${row.member.nickname} berhasil ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}.`)
                                      }
                                      setConfirmState(prev => ({ ...prev, open: false }))
                                    }
                                  })
                                }}
                                className="text-gray-400 hover:text-indigo-600 p-1 rounded-md hover:bg-indigo-50 ml-2"
                              title={row.member.is_arisan_active ? 'Nonaktifkan Arisan' : 'Aktifkan Arisan'}
                            >
                              {row.member.is_arisan_active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                            </button>
                          )}
                        </div>
                      </td>
                      {MONTHS.map((_, idx) => {
                        const monthNumber = idx + 1

                        // Cek apakah bulan ini sudah lewat atau sedang berjalan
                        const currentDate = new Date()
                        const currentMonthReal = currentDate.getMonth() + 1
                        const currentYearReal = currentDate.getFullYear()
                        const isMonthPastOrCurrent = currentYear < currentYearReal || (currentYear === currentYearReal && monthNumber <= currentMonthReal)

                        // Cek apakah member sudah bergabung pada bulan ini
                        const joinDate = new Date(row.member.join_date)
                        const joinMonth = joinDate.getMonth() + 1
                        const joinYear = joinDate.getFullYear()
                        const isAfterJoinDate = currentYear > joinYear || (currentYear === joinYear && monthNumber >= joinMonth)

                        const isPastDue = isMonthPastOrCurrent && isAfterJoinDate

                        return (
                          <td key={`${categoryId}-${row.member.id}-${monthNumber}`} className="w-11 md:w-14 h-11 md:h-14 text-center align-middle p-0">
                            <OptimisticCheckbox
                              key={`checkbox-${categoryId}-${row.member.id}-${monthNumber}`}
                              memberId={row.member.id}
                              categoryId={categoryId}
                              month={monthNumber}
                              year={currentYear}
                              initialStatus={!!row[categoryKey][monthNumber]}
                              isDisabled={!isCategoryAdmin || isArisanInactive}
                              isPastDue={isPastDue}
                            />
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expense History for this Category */}
        {(categoryId === 1 || categoryId === 2) && (
          <div className="bg-white rounded-2xl ring-1 ring-gray-200/60 overflow-hidden mt-6">
            <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
              <Receipt className="h-4 w-4 text-slate-500" />
              <h3 className="font-bold text-gray-800 text-sm md:text-base">Riwayat Pengeluaran {CATEGORIES[categoryId as keyof typeof CATEGORIES].name}</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {data.expensesYear.filter((e: any) => e.category_id === categoryId).length === 0 ? (
                <div className="px-4 md:px-6 py-8 text-center text-gray-500 text-sm">
                  Belum ada catatan pengeluaran.
                </div>
              ) : (
                data.expensesYear
                  .filter((e: any) => e.category_id === categoryId)
                  .map((exp: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between px-4 md:px-6 py-3 hover:bg-gray-50 transition-colors gap-2">
                      <div className="flex flex-col overflow-hidden mr-4">
                        <p className="text-sm font-semibold text-gray-800 line-clamp-2 break-words leading-snug" title={exp.description}>{exp.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span suppressHydrationWarning className="text-[10px] md:text-[11px] text-gray-500 font-medium whitespace-nowrap">
                            {new Date(exp.expense_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 shrink-0">
                        <span suppressHydrationWarning className="text-sm font-bold text-gray-900 shrink-0 tabular-nums">
                          {formatIDR(exp.amount)}
                        </span>
                        {isCategoryAdmin && (
                          <div className="flex items-center gap-1">
                            <ExpenseDialog
                              categoryId={categoryId as 1 | 2}
                              categoryName={CATEGORIES[categoryId as keyof typeof CATEGORIES].name}
                              expenseToEdit={{
                                id: exp.id,
                                amount: exp.amount,
                                description: exp.description,
                                expense_date: exp.expense_date
                              }}
                            />
                              <button
                                onClick={() => {
                                  setConfirmState({
                                    open: true,
                                    title: 'Hapus Pengeluaran',
                                    message: 'Yakin ingin menghapus pengeluaran ini?',
                                    onConfirm: async () => {
                                      const res = await deleteExpense(exp.id)
                                      if (!res.success) {
                                        toast.error(res.error)
                                      } else {
                                        toast.success('Pengeluaran berhasil dihapus.')
                                      }
                                      setConfirmState(prev => ({ ...prev, open: false }))
                                    }
                                  })
                                }}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

        {/* Arisan Winners History */}
        {categoryId === 3 && (
          <div className="bg-white rounded-2xl ring-1 ring-gray-200/60 overflow-hidden mt-6">
            <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2">
                <Dice5 className="h-4 w-4 text-gray-800" />
                <h3 className="font-bold text-gray-800 text-sm md:text-base">Pemenang Arisan</h3>
              </div>
              {isCategoryAdmin && (
                <ArisanSpinDialog
                  currentYear={currentYear}
                  members={data.matrixData.map((r: any) => r.member).filter((m: any) => m.is_active && m.is_arisan_active)}
                  wonInCurrentCycleIds={data.wonInCurrentCycleIds || []}
                />
              )}
            </div>
            <div className="divide-y divide-gray-100">
              {(!data.arisanWinnersYear || data.arisanWinnersYear.length === 0) ? (
                <div className="px-4 md:px-6 py-8 text-center text-gray-500 text-sm">
                  Belum ada pemenang arisan tahun ini.
                </div>
              ) : (
                data.arisanWinnersYear.map((winner: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between px-4 md:px-6 py-3 hover:bg-gray-50 transition-colors gap-2">
                    <div className="flex flex-col overflow-hidden mr-4">
                      <p className="text-sm font-semibold text-gray-800">{winner.member.nickname}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] md:text-[11px] text-gray-500 font-medium">
                          Bulan {MONTHS[winner.period_month - 1]}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 shrink-0">
                      <span suppressHydrationWarning className="text-[10px] text-gray-400">
                        Diacak pada {new Date(winner.won_at).toLocaleDateString('id-ID')}
                      </span>
                      {isCategoryAdmin && <button
                            onClick={() => {
                              setConfirmState({
                                open: true,
                                title: 'Batalkan Kemenangan',
                                message: 'Yakin ingin membatalkan kemenangan arisan ini?',
                                onConfirm: async () => {
                                  const res = await deleteArisanWinner(winner.id)
                                  if (!res.success) {
                                    toast.error(res.error)
                                  } else {
                                    toast.success('Kemenangan berhasil dibatalkan.')
                                  }
                                  setConfirmState(prev => ({ ...prev, open: false }))
                                }
                              })
                            }}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      }
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'global':
        return (
          <div className="space-y-4 md:space-y-6">
            <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-3">
              <div 
                onClick={() => {
                  if (userRole === 'SUPER_ADMIN' || userRole === 'PJ_KAS') {
                    setEditBalance({ open: true, categoryId: 1, amount: String(financials.initialKas || 0) })
                  }
                }}
                className={`relative overflow-hidden rounded-2xl p-5 md:p-6 ${financials.saldoKasAktual > 0 ? 'bg-gradient-to-br from-emerald-500 to-emerald-700' : 'bg-gradient-to-br from-rose-500 to-rose-700'} text-white shadow-lg ${
                  (userRole === 'SUPER_ADMIN' || userRole === 'PJ_KAS') ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''
                }`}
              >
                <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10" />
                <div className="absolute bottom-0 right-0 -mb-6 -mr-6 h-32 w-32 rounded-full bg-white/5" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2 md:mb-3">
                    <Wallet className="h-4 w-4 md:h-5 md:w-5 text-white/80" />
                    <span className="text-xs md:text-sm font-semibold text-white/90 uppercase tracking-wide">Saldo Kas Aktual</span>
                  </div>
                  <p suppressHydrationWarning className="text-2xl md:text-3xl font-black tracking-tight">{formatIDR(financials.saldoKasAktual)}</p>
                  <p className="text-[11px] md:text-xs text-white/70 mt-1.5">Setelah dipotong defisit arisan</p>
                </div>
              </div>

              {/* Dana Talangan */}
              <div className="relative overflow-hidden rounded-2xl p-5 md:p-6 bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10" />
                <div className="absolute bottom-0 right-0 -mb-6 -mr-6 h-32 w-32 rounded-full bg-white/5" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2 md:mb-3">
                    <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-white/80" />
                    <span className="text-xs md:text-sm font-semibold text-white/90 uppercase tracking-wide">Dana Talangan</span>
                  </div>
                  <p suppressHydrationWarning className="text-2xl md:text-3xl font-black tracking-tight">{formatIDR(financials.totalArisanDeficit)}</p>
                  <p className="text-[11px] md:text-xs text-white/70 mt-1.5">Subsidi silang dari KAS</p>
                </div>
              </div>

              {/* Saldo Danasos */}
              <div 
                onClick={() => {
                  if (userRole === 'SUPER_ADMIN' || userRole === 'PJ_DANASOS') {
                    setEditBalance({ open: true, categoryId: 2, amount: String(financials.initialDanasos || 0) })
                  }
                }}
                className={`relative overflow-hidden rounded-2xl p-5 md:p-6 bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-lg ${
                  (userRole === 'SUPER_ADMIN' || userRole === 'PJ_DANASOS') ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''
                }`}
              >
                <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10" />
                <div className="absolute bottom-0 right-0 -mb-6 -mr-6 h-32 w-32 rounded-full bg-white/5" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2 md:mb-3">
                    <HeartHandshake className="h-4 w-4 md:h-5 md:w-5 text-white/80" />
                    <span className="text-xs md:text-sm font-semibold text-white/90 uppercase tracking-wide">Saldo Danasos</span>
                  </div>
                  <p suppressHydrationWarning className="text-2xl md:text-3xl font-black tracking-tight">{formatIDR(financials.saldoDanasosAktual)}</p>
                  <p className="text-[11px] md:text-xs text-white/70 mt-1.5">Dana darurat & sosial</p>
                </div>
              </div>
            </div>

            {/* Split layout for Leaderboard and Expenses */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {/* Leaderboard */}
              <div className="bg-white rounded-2xl ring-1 ring-gray-200/60 overflow-hidden flex flex-col h-full max-h-[400px]">
                <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-100 flex items-center gap-2 sticky top-0 bg-white z-10">
                  <TrendingDown className="h-4 w-4 text-rose-500" />
                  <h3 className="font-bold text-gray-800 text-sm md:text-base">Top 5 Anggota Menunggak</h3>
                </div>
                <div className="divide-y divide-gray-100 overflow-y-auto">
                  {leaderboard.map((u, idx) => (
                    <div key={idx} className="flex items-center px-4 md:px-6 py-3 hover:bg-gray-50 transition-colors">
                      <span className={`inline-flex h-6 w-6 md:h-7 md:w-7 items-center justify-center rounded-full text-[11px] md:text-xs font-bold text-white mr-2.5 md:mr-3 shrink-0 ${idx === 0 ? 'bg-rose-500' : idx === 1 ? 'bg-orange-500' : idx === 2 ? 'bg-amber-500' : 'bg-gray-400'
                        }`}>
                        {idx + 1}
                      </span>
                      <p className="text-sm font-semibold text-gray-800 truncate">{u.name}</p>
                      <span className="ml-auto bg-rose-100 text-rose-700 px-2.5 py-0.5 md:px-3 md:py-1 rounded-full text-[11px] md:text-xs font-bold tabular-nums shrink-0">
                        {u.unpaids} tunggakan
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Riwayat Pengeluaran */}
              <div className="bg-white rounded-2xl ring-1 ring-gray-200/60 overflow-hidden flex flex-col h-full max-h-[400px]">
                <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-slate-500" />
                    <h3 className="font-bold text-gray-800 text-sm md:text-base">Riwayat Pengeluaran</h3>
                  </div>
                  <select
                    value={currentYear}
                    onChange={handleYearChange}
                    className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-500 font-medium shadow-sm"
                  >
                    {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2].sort().map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div className="divide-y divide-gray-100 overflow-y-auto">
                  {data.expensesYear.length === 0 ? (
                    <div className="px-4 md:px-6 py-8 text-center text-gray-500 text-sm">
                      Belum ada catatan pengeluaran.
                    </div>
                  ) : (
                    data.expensesYear.map((exp: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between px-4 md:px-6 py-3 hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col overflow-hidden mr-4">
                          <p className="text-sm font-semibold text-gray-800 line-clamp-2 break-words leading-snug" title={exp.description}>{exp.description}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span suppressHydrationWarning className="text-[10px] md:text-[11px] text-gray-500 font-medium whitespace-nowrap">
                              {new Date(exp.expense_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            </span>
                            <span className="text-[9px] md:text-[10px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap bg-slate-100 text-slate-700 border border-slate-200">
                              {CATEGORIES[exp.category_id as keyof typeof CATEGORIES].name}
                            </span>
                          </div>
                        </div>
                        <span suppressHydrationWarning className="text-sm font-bold text-gray-900 shrink-0 tabular-nums">
                          {formatIDR(exp.amount)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Member List Table */}
            <div className="bg-white rounded-2xl ring-1 ring-gray-200/60 overflow-hidden flex flex-col mt-6">
              <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-slate-500" />
                  <h3 className="font-bold text-gray-800 text-sm md:text-base">Anggota Lengkap</h3>
                </div>
                {userRole === 'SUPER_ADMIN' && (
                  <MemberDialog />
                )}
              </div>
              <div className="divide-y divide-gray-100 overflow-y-auto max-h-[600px]">
                {data.matrixData.length === 0 ? (
                  <div className="px-4 md:px-6 py-8 text-center text-gray-500 text-sm">
                    Belum ada anggota.
                  </div>
                ) : (
                  data.matrixData.map((row: any) => (
                    <div key={row.member.id} className={`flex items-center justify-between px-4 md:px-6 py-3 hover:bg-gray-50 transition-colors ${!row.member.is_active ? 'opacity-60' : ''}`}>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-800 text-sm">{row.member.nickname}</span>
                        {!row.member.is_active && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap bg-rose-100 text-rose-700">
                            Nonaktif
                          </span>
                        )}
                      </div>
                      {userRole === 'SUPER_ADMIN' && (
                        <div className="flex items-center gap-1 shrink-0">
                          <MemberDialog memberToEdit={row.member} />
                          <DeleteMemberDialog member={row.member} />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )
      case 'kas':
        return renderMatrixTable(1, 'kas')
      case 'danasos':
        return renderMatrixTable(2, 'danasos')
      case 'arisan':
        return renderMatrixTable(3, 'arisan')
    }
  }

  return (
    <div className="pb-20 md:pb-0">
      {/* Header with Integrated Desktop Tabs */}
      <header className="sticky top-0 z-50 w-full bg-slate-950 border-b border-slate-900 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-20 flex items-center justify-between relative">

          <div className="flex items-center gap-3 z-10">
            <Image src="/image.png" alt="Logo MMGM" width={52} height={52} className="object-contain" style={{ width: "auto", height: "auto" }} priority />
            <div className="flex flex-col leading-tight justify-center">
              <h1 className="text-xl md:text-2xl font-bold text-white">{headerTitle}</h1>
              {headerSubtitle && <p className="text-[11px] md:text-xs font-medium text-amber-500">{headerSubtitle}</p>}
            </div>
          </div>

          {/* Desktop Tabs */}
          <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-2">
            {TAB_CONFIG.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-medium text-sm transition-all ${isActive ? 'bg-[#7c3aed] text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          <div className="z-10 flex items-center gap-2">
            {headerAction}
          </div>
        </div>
      </header>

      {/* Tab Content Area */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        {renderContent()}
      </div>

      <Dialog open={confirmState.open} onOpenChange={(open) => setConfirmState(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" /> Konfirmasi
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 text-sm text-gray-700">
            {confirmState.message}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmState(prev => ({ ...prev, open: false }))}>Batal</Button>
            <Button variant="destructive" size="sm" onClick={confirmState.onConfirm}>Ya, Lanjutkan</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Initial Balance Dialog */}
      <Dialog open={editBalance.open} onOpenChange={(open) => setEditBalance(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-indigo-600" /> Penyesuaian Saldo Awal
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Saldo Awal (Rp)</label>
              <input
                type="number"
                value={editBalance.amount}
                onChange={(e) => setEditBalance(prev => ({ ...prev, amount: e.target.value }))}
                className="w-full border-gray-200 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border"
                placeholder="0"
              />
              <p className="text-xs text-gray-500">Angka ini akan ditambahkan sebagai modal awal ke dalam saldo aktual {editBalance.categoryId === 1 ? 'Kas' : 'Danasos'}.</p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditBalance(prev => ({ ...prev, open: false }))}>Batal</Button>
            <Button onClick={handleUpdateBalance} disabled={isUpdatingBalance} size="sm">
              {isUpdatingBalance ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile Bottom Nav — fixed, visible only on mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgb(0,0,0,0.06)]">
        <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
          {TAB_CONFIG.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors ${isActive ? 'text-gray-900' : 'text-gray-400'
                  }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-gray-900' : 'text-gray-400'}`} strokeWidth={isActive ? 2.5 : 1.5} />
                <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>{tab.label}</span>
                {isActive && <span className="absolute bottom-1.5 h-1 w-5 rounded-full bg-gray-900" />}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
