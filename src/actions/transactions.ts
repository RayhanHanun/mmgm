'use server'

import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { Role } from '@prisma/client'
import { revalidatePath } from 'next/cache'

const toggleSchema = z.object({
  memberId: z.string().uuid(),
  categoryId: z.number().int().min(1).max(3),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
})

export async function toggleTransaction(payload: z.infer<typeof toggleSchema>) {
  // 1. Validasi Input Payload
  const parsed = toggleSchema.safeParse(payload)
  if (!parsed.success) {
    return { success: false, error: 'Data tidak valid' }
  }
  const { memberId, categoryId, month, year } = parsed.data

  // 2. Verifikasi Sesi JWT Supabase
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Sesi tidak valid atau telah berakhir (Unauthorized)' }

  // 3. Verifikasi Role dari SystemAccount
  // Asumsi: Saat menautkan akun di STEP 2/3, user.id Auth sama dengan id di SystemAccount
  // Atau kita bisa menggunakan pendekatan pencarian lain jika diperlukan.
  let account = await prisma.systemAccount.findUnique({ where: { id: user.id } })
  
  // (Fallback untuk DEV mode: Cari berdasarkan email prefix jika ID berbeda)
  if (!account && user.email) {
    const username = user.email.split('@')[0]
    account = await prisma.systemAccount.findUnique({ where: { username } })
  }

  if (!account) return { success: false, error: 'Akun admin tidak terdaftar di sistem' }

  // 4. Verifikasi Otorisasi Kategori (RBAC)
  const category = await prisma.paymentCategory.findUnique({ where: { id: categoryId } })
  if (!category) return { success: false, error: 'Kategori pembayaran tidak ditemukan' }

  if (account.role !== Role.SUPER_ADMIN && account.role !== category.managed_by_role) {
    return { success: false, error: 'Dilarang: Anda tidak memiliki akses untuk mengubah kategori ini' }
  }

  // 5. Eksekusi Mutasi Optimistic (Idempotent: Insert or Delete)
  try {
    const existing = await prisma.transaction.findUnique({
      where: {
        member_id_category_id_period_month_period_year: {
          member_id: memberId,
          category_id: categoryId,
          period_month: month,
          period_year: year
        }
      }
    })

    if (existing) {
      // Hard Delete jika di-uncheck
      await prisma.transaction.delete({ where: { id: existing.id } })
    } else {
      // Insert jika di-check. Amount diambil LANGSUNG dari DB untuk mencegah bypass nominal.
      await prisma.transaction.create({
        data: {
          member_id: memberId,
          category_id: categoryId,
          period_month: month,
          period_year: year,
          amount: category.fixed_amount,
          recorded_by: account.id
        }
      })
    }

    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Toggle Transaction Error:', error)
    return { success: false, error: 'Gagal melakukan mutasi database' }
  }
}

const initialBalanceSchema = z.object({
  categoryId: z.number().int().min(1).max(2),
  amount: z.number().min(0)
})

export async function updateInitialBalance(payload: z.infer<typeof initialBalanceSchema>) {
  const parsed = initialBalanceSchema.safeParse(payload)
  if (!parsed.success) return { success: false, error: 'Data tidak valid' }
  const { categoryId, amount } = parsed.data

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  let account = await prisma.systemAccount.findUnique({ where: { id: user.id } })
  if (!account && user.email) {
    account = await prisma.systemAccount.findUnique({ where: { username: user.email.split('@')[0] } })
  }
  if (!account) return { success: false, error: 'Akun admin tidak terdaftar' }

  const category = await prisma.paymentCategory.findUnique({ where: { id: categoryId } })
  if (!category) return { success: false, error: 'Kategori tidak ditemukan' }

  if (account.role !== Role.SUPER_ADMIN && account.role !== category.managed_by_role) {
    return { success: false, error: 'Dilarang: Anda tidak memiliki akses untuk mengubah saldo ini' }
  }

  try {
    await prisma.paymentCategory.update({
      where: { id: categoryId },
      data: { initial_balance: amount }
    })
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Update Initial Balance Error:', error)
    return { success: false, error: 'Gagal memperbarui saldo awal' }
  }
}
