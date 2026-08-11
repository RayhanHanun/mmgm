import { prisma } from '@/lib/db'

function getObligatedMonths(joinDate: Date, targetDate: Date = new Date()) {
  const yearsDiff = targetDate.getFullYear() - joinDate.getFullYear()
  const monthsDiff = targetDate.getMonth() - joinDate.getMonth()
  // +1 karena bulan bergabung tetap dihitung sebagai 1 bulan kewajiban
  const totalMonths = yearsDiff * 12 + monthsDiff + 1
  return Math.max(0, totalMonths)
}

export async function getDashboardData(year: number) {
  // 1. Fetching paralel untuk semua data yang dibutuhkan secara O(N)
  const [
    members,
    transactionsYear,
    expensesYear,
    aggKasIn,
    aggKasOut,
    aggDanasosIn,
    aggDanasosOut,
    aggArisanIn,
    arisanWinnersYear,
    lastWinner,
    categories
  ] = await Promise.all([
    prisma.member.findMany({ where: { is_active: true }, orderBy: { nickname: 'asc' } }),
    prisma.transaction.findMany({ where: { period_year: year } }),
    prisma.expense.findMany({
      where: {
        expense_date: {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1),
        },
      },
      orderBy: { expense_date: 'desc' }
    }),
    prisma.transaction.aggregate({ _sum: { amount: true }, where: { category_id: 1 } }),
    prisma.expense.aggregate({ _sum: { amount: true }, where: { category_id: 1 } }),
    prisma.transaction.aggregate({ _sum: { amount: true }, where: { category_id: 2 } }),
    prisma.expense.aggregate({ _sum: { amount: true }, where: { category_id: 2 } }),
    prisma.transaction.aggregate({ _sum: { amount: true }, where: { category_id: 3 } }),
    prisma.arisanWinner.findMany({ 
      where: { period_year: year },
      include: { member: true },
      orderBy: { period_month: 'asc' }
    }),
    prisma.arisanWinner.findFirst({
      orderBy: [
        { period_year: 'desc' },
        { period_month: 'desc' }
      ]
    }),
    prisma.paymentCategory.findMany()
  ])

  const currentCycle = lastWinner ? lastWinner.arisan_cycle : 1
  const winnersInCurrentCycle = await prisma.arisanWinner.findMany({
    where: { arisan_cycle: currentCycle }
  })
  
  const activeArisanCount = members.filter((m: any) => m.is_active && m.is_arisan_active).length
  let wonInCurrentCycleIds = winnersInCurrentCycle.map((w: any) => w.member_id)
  
  if (wonInCurrentCycleIds.length >= activeArisanCount && activeArisanCount > 0) {
    wonInCurrentCycleIds = []
  }

  // Hitung total kewajiban Arisan (All-time) untuk defisit
  const totalArisanExpected = members.reduce((sum: number, m: any) => sum + getObligatedMonths(m.join_date, new Date()), 0) * 10000
  const totalArisanPaid = Number(aggArisanIn._sum.amount || 0)
  const totalArisanDeficit = Math.max(0, totalArisanExpected - totalArisanPaid)

  // Hitung Saldo Aktual (All-time)
  const kasCategory = categories.find((c: any) => c.id === 1)
  const danasosCategory = categories.find((c: any) => c.id === 2)
  const initialKas = Number(kasCategory?.initial_balance || 0)
  const initialDanasos = Number(danasosCategory?.initial_balance || 0)

  const totalKasIn = Number(aggKasIn._sum.amount || 0)
  const totalKasOut = Number(aggKasOut._sum.amount || 0)
  const saldoKasAktual = initialKas + totalKasIn - totalKasOut - totalArisanDeficit

  const totalDanasosIn = Number(aggDanasosIn._sum.amount || 0)
  const totalDanasosOut = Number(aggDanasosOut._sum.amount || 0)
  const saldoDanasosAktual = initialDanasos + totalDanasosIn - totalDanasosOut

  // Diffing/Mapping Data Transaksi Tahun Berjalan
  // Memetakan transaksi agar dapat diakses dengan cepat O(1) di UI.
  // Map structure: Record<member_id, Record<category_id, Record<month, boolean>>>
  const ledgerMap: Record<string, Record<number, Record<number, boolean>>> = {}

  members.forEach((m: any) => {
    ledgerMap[m.id] = {
      1: {}, // KAS
      2: {}, // DANASOS
      3: {}  // ARISAN
    }
  })

  transactionsYear.forEach((t: any) => {
    if (ledgerMap[t.member_id]) {
      ledgerMap[t.member_id][t.category_id][t.period_month] = true
    }
  })

  // Format data untuk mempermudah render Matrix UI
  const matrixData = members.map((m: any) => {
    return {
      member: m,
      kas: ledgerMap[m.id][1],
      danasos: ledgerMap[m.id][2],
      arisan: ledgerMap[m.id][3],
    }
  })

  return {
    matrixData,
    expensesYear: expensesYear.map((e: any) => ({
      ...e,
      amount: Number(e.amount)
    })),
    arisanWinnersYear,
    wonInCurrentCycleIds,
    financials: {
      saldoKasAktual,
      saldoDanasosAktual,
      initialKas,
      initialDanasos,
      totalArisanDeficit,
      allTime: {
        kasIn: totalKasIn,
        kasOut: totalKasOut,
        danasosIn: totalDanasosIn,
        danasosOut: totalDanasosOut,
        arisanIn: totalArisanPaid
      }
    }
  }
}
