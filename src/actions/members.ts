'use server'

import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/db'
import { Role } from '@prisma/client'
import { revalidatePath } from 'next/cache'

async function verifySuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  let account = await prisma.systemAccount.findUnique({ where: { id: user.id } })
  if (!account && user.email) {
    const username = user.email.split('@')[0]
    account = await prisma.systemAccount.findUnique({ where: { username } })
  }
  
  if (!account || account.role !== Role.SUPER_ADMIN) return null
  return account
}

export async function toggleArisanParticipation(memberId: string, isActive: boolean) {
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
    await prisma.member.update({
      where: { id: memberId },
      data: { is_arisan_active: isActive }
    })

    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Toggle Arisan Participation Error:', error)
    return { success: false, error: 'Gagal mengubah status arisan anggota' }
  }
}

export async function addMember(nickname: string) {
  const admin = await verifySuperAdmin()
  if (!admin) return { success: false, error: 'Unauthorized: Hanya Super Admin' }

  try {
    const existing = await prisma.member.findUnique({ where: { nickname } })
    if (existing) {
      return { success: false, error: 'Nama anggota sudah terdaftar' }
    }

    await prisma.member.create({
      data: {
        nickname,
        join_date: new Date()
      }
    })
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Add Member Error:', error)
    return { success: false, error: 'Gagal menambahkan anggota' }
  }
}

export async function editMember(id: string, nickname: string) {
  const admin = await verifySuperAdmin()
  if (!admin) return { success: false, error: 'Unauthorized: Hanya Super Admin' }

  try {
    const existing = await prisma.member.findUnique({ where: { nickname } })
    if (existing && existing.id !== id) {
      return { success: false, error: 'Nama anggota sudah digunakan orang lain' }
    }

    await prisma.member.update({
      where: { id },
      data: { nickname }
    })
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Edit Member Error:', error)
    return { success: false, error: 'Gagal mengubah nama anggota' }
  }
}

export async function deleteMember(id: string) {
  const admin = await verifySuperAdmin()
  if (!admin) return { success: false, error: 'Unauthorized: Hanya Super Admin' }

  try {
    const txCount = await prisma.transaction.count({ where: { member_id: id } })
    const winnerCount = await prisma.arisanWinner.count({ where: { member_id: id } })

    if (txCount > 0 || winnerCount > 0) {
      // Soft delete
      await prisma.member.update({
        where: { id },
        data: { is_active: false }
      })
      revalidatePath('/')
      return { success: true, message: 'Anggota dinonaktifkan karena sudah memiliki riwayat transaksi' }
    } else {
      // Hard delete
      await prisma.member.delete({ where: { id } })
      revalidatePath('/')
      return { success: true, message: 'Anggota dihapus secara permanen' }
    }
  } catch (error) {
    console.error('Delete Member Error:', error)
    return { success: false, error: 'Gagal menghapus anggota' }
  }
}
