'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { addExpense, editExpense } from '@/actions/expenses'
import { Plus, Pencil } from 'lucide-react'

interface Props {
  categoryId: 1 | 2
  categoryName: string
  expenseToEdit?: {
    id: string
    amount: number
    description: string
    expense_date: Date
  }
}

export function ExpenseDialog({ categoryId, categoryName, expenseToEdit }: Props) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState(expenseToEdit ? expenseToEdit.amount.toString() : '')
  const [description, setDescription] = useState(expenseToEdit ? expenseToEdit.description : '')
  const [expenseDate, setExpenseDate] = useState(() => 
    expenseToEdit 
      ? new Date(expenseToEdit.expense_date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  )
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Sesuai dengan skema Zod di server actions
    const payload = {
      categoryId,
      amount: Number(amount),
      description,
      // Date input string ke ISO-8601
      expenseDate: new Date(expenseDate).toISOString(),
    }

    const res = expenseToEdit 
      ? await editExpense(expenseToEdit.id, payload)
      : await addExpense(payload)

    setIsLoading(false)

    if (res.success) {
      setOpen(false)
      if (!expenseToEdit) {
        setAmount('')
        setDescription('')
      }
    } else {
      alert(res.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {expenseToEdit ? (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-emerald-600">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button size="sm" className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white">
            <Plus className="h-4 w-4" /> Pengeluaran
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{expenseToEdit ? 'Edit Pengeluaran' : `Pengeluaran ${categoryName}`}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor={`amount-${categoryId}`}>Nominal (Rp)</Label>
            <Input
              id={`amount-${categoryId}`}
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Contoh: 50000"
              required
              min={1}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`desc-${categoryId}`}>Keterangan</Label>
            <Input
              id={`desc-${categoryId}`}
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beli sapu untuk posko"
              required
              minLength={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`date-${categoryId}`}>Tanggal</Label>
            <Input
              id={`date-${categoryId}`}
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
