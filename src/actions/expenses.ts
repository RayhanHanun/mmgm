'use server'

import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { Role } from '@prisma/client'
import { revalidatePath } from 'next/cache'

const expenseSchema = z.object({
  categoryId: z.number().int().refine((val) => val === 1 || val === 2, {
    message: 'Pengeluaran hanya bisa dilakukan untuk KAS (1) atau DANASOS (2)',
  }),
  amount: z.number().positive('Nominal pengeluaran harus lebih besar dari 0'),
  description: z.string().min(3, 'Deskripsi minimal 3 karakter').max(255, 'Deskripsi terlalu panjang'),
  expenseDate: z.string().datetime(), // ISO 8601
})

export async function addExpense(payload: z.infer<typeof expenseSchema>) {
  // 1. Validasi Input Payload
  const parsed = expenseSchema.safeParse(payload)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }
  const { categoryId, amount, description, expenseDate } = parsed.data

  // 2. Verifikasi Sesi JWT Supabase
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Sesi tidak valid atau telah berakhir' }

  // 3. Verifikasi Role dari SystemAccount
  let account = await prisma.systemAccount.findUnique({ where: { id: user.id } })
  if (!account && user.email) {
    const username = user.email.split('@')[0]
    account = await prisma.systemAccount.findUnique({ where: { username } })
  }
  if (!account) return { success: false, error: 'Akun admin tidak terdaftar di sistem' }

  // 4. Verifikasi Otorisasi Kategori (RBAC)
  const category = await prisma.paymentCategory.findUnique({ where: { id: categoryId } })
  if (!category) return { success: false, error: 'Kategori pengeluaran tidak ditemukan' }

  if (account.role !== Role.SUPER_ADMIN && account.role !== category.managed_by_role) {
    return { success: false, error: 'Dilarang: Anda tidak memiliki akses untuk menambah pengeluaran pada kategori ini' }
  }

  // 5. Eksekusi Insert
  try {
    await prisma.expense.create({
      data: {
        category_id: categoryId,
        amount,
        description,
        expense_date: new Date(expenseDate),
        recorded_by: account.id
      }
    })

    revalidatePath('/') // Revalidate dashboard
    return { success: true }
  } catch (error) {
    console.error('Add Expense Error:', error)
    return { success: false, error: 'Gagal mencatat pengeluaran ke database' }
  }
}

export async function editExpense(id: string, payload: z.infer<typeof expenseSchema>) {
  const parsed = expenseSchema.safeParse(payload)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }
  const { categoryId, amount, description, expenseDate } = parsed.data

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Sesi tidak valid atau telah berakhir' }

  let account = await prisma.systemAccount.findUnique({ where: { id: user.id } })
  if (!account && user.email) {
    const username = user.email.split('@')[0]
    account = await prisma.systemAccount.findUnique({ where: { username } })
  }
  if (!account) return { success: false, error: 'Akun admin tidak terdaftar di sistem' }

  const category = await prisma.paymentCategory.findUnique({ where: { id: categoryId } })
  if (!category) return { success: false, error: 'Kategori pengeluaran tidak ditemukan' }

  if (account.role !== Role.SUPER_ADMIN && account.role !== category.managed_by_role) {
    return { success: false, error: 'Dilarang: Anda tidak memiliki akses untuk mengubah pengeluaran pada kategori ini' }
  }

  try {
    await prisma.expense.update({
      where: { id },
      data: {
        category_id: categoryId,
        amount,
        description,
        expense_date: new Date(expenseDate),
      }
    })

    revalidatePath('/') // Revalidate dashboard
    return { success: true }
  } catch (error) {
    console.error('Edit Expense Error:', error)
    return { success: false, error: 'Gagal mengubah pengeluaran di database' }
  }
}

export async function deleteExpense(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Sesi tidak valid atau telah berakhir' }

  let account = await prisma.systemAccount.findUnique({ where: { id: user.id } })
  if (!account && user.email) {
    const username = user.email.split('@')[0]
    account = await prisma.systemAccount.findUnique({ where: { username } })
  }
  if (!account) return { success: false, error: 'Akun admin tidak terdaftar di sistem' }

  try {
    const expense = await prisma.expense.findUnique({ where: { id } })
    if (!expense) return { success: false, error: 'Pengeluaran tidak ditemukan' }

    const category = await prisma.paymentCategory.findUnique({ where: { id: expense.category_id } })
    if (!category) return { success: false, error: 'Kategori pengeluaran tidak ditemukan' }

    if (account.role !== Role.SUPER_ADMIN && account.role !== category.managed_by_role) {
      return { success: false, error: 'Dilarang: Anda tidak memiliki akses untuk menghapus pengeluaran pada kategori ini' }
    }

    await prisma.expense.delete({ where: { id } })

    revalidatePath('/') // Revalidate dashboard
    return { success: true }
  } catch (error) {
    console.error('Delete Expense Error:', error)
    return { success: false, error: 'Gagal menghapus pengeluaran dari database' }
  }
}
