'use server'

import { prisma } from '@/lib/db'
import { createClient } from '@/utils/supabase/server'
import { Role } from '@prisma/client'
import { revalidatePath } from 'next/cache'

export async function setArisanWinner(month: number, year: number, memberId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  let account = await prisma.systemAccount.findUnique({ where: { id: user.id } })
  if (!account && user.email) {
    const username = user.email.split('@')[0]
    account = await prisma.systemAccount.findUnique({ where: { username } })
  }
  if (!account) return { success: false, error: 'Unauthorized' }

  if (account.role !== Role.SUPER_ADMIN && account.role !== Role.PJ_ARISAN) {
    return { success: false, error: 'Akses ditolak' }
  }

  try {
    // 1. Cek apakah bulan ini sudah ada pemenang
    const existing = await prisma.arisanWinner.findUnique({
      where: {
        period_month_period_year: {
          period_month: month,
          period_year: year
        }
      }
    })

    if (existing) {
      return { success: false, error: 'Sudah ada pemenang arisan di bulan ini' }
    }

    // 2. Ambil semua member aktif arisan
    const activeMembers = await prisma.member.findMany({
      where: { is_active: true, is_arisan_active: true }
    })
    
    if (activeMembers.length === 0) {
      return { success: false, error: 'Tidak ada anggota yang mengikuti arisan' }
    }

    // 3. Cari pemenang terakhir untuk mengetahui siklus saat ini
    const lastWinner = await prisma.arisanWinner.findFirst({
      orderBy: [
        { period_year: 'desc' },
        { period_month: 'desc' }
      ]
    })
    
    let currentCycle = lastWinner ? lastWinner.arisan_cycle : 1

    // 4. Ambil semua pemenang di siklus saat ini
    const winnersInCurrentCycle = await prisma.arisanWinner.findMany({
      where: { arisan_cycle: currentCycle }
    })
    
    let winnerIds = new Set(winnersInCurrentCycle.map((w: any) => w.member_id))
    
    // Jika semua anggota arisan sudah menang di siklus ini, reset untuk siklus berikutnya
    if (winnerIds.size >= activeMembers.length) {
      currentCycle += 1
      winnerIds = new Set() // Kosongkan daftar pemenang untuk siklus baru
    }

    // 5. Verifikasi member belum menang di siklus ini (opsional, tapi baik untuk mencegah salah input)
    if (winnerIds.has(memberId)) {
      return { success: false, error: 'Anggota tersebut sudah mendapat arisan pada putaran/siklus ini' }
    }

    // 6. Simpan pemenang
    await prisma.arisanWinner.create({
      data: {
        member_id: memberId,
        period_month: month,
        period_year: year,
        arisan_cycle: currentCycle,
        recorded_by: account.id
      }
    })

    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Spin Arisan Error:', error)
    return { success: false, error: 'Gagal melakukan spin arisan' }
  }
}

export async function deleteArisanWinner(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  let account = await prisma.systemAccount.findUnique({ where: { id: user.id } })
  if (!account && user.email) {
    const username = user.email.split('@')[0]
    account = await prisma.systemAccount.findUnique({ where: { username } })
  }
  if (!account) return { success: false, error: 'Unauthorized' }

  if (account.role !== Role.SUPER_ADMIN && account.role !== Role.PJ_ARISAN) {
    return { success: false, error: 'Akses ditolak' }
  }

  try {
    await prisma.arisanWinner.delete({
      where: { id }
    })

    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Delete Arisan Winner Error:', error)
    return { success: false, error: 'Gagal menghapus data' }
  }
}
