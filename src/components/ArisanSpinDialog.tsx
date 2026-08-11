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
import { UserPlus, CheckCircle2 } from 'lucide-react'
import { setArisanWinner } from '@/actions/arisan'

interface Props {
  currentYear: number
  disabled?: boolean
  members: { id: string; nickname: string }[]
  wonInCurrentCycleIds?: string[]
}

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

export function ArisanSpinDialog({ currentYear, disabled, members, wonInCurrentCycleIds = [] }: Props) {
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  
  // Find first eligible member for default selection
  const defaultMember = members.find(m => !wonInCurrentCycleIds.includes(m.id))
  const [selectedMemberId, setSelectedMemberId] = useState(defaultMember?.id || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!selectedMemberId) return

    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    const res = await setArisanWinner(month, currentYear, selectedMemberId)

    setIsSubmitting(false)
    if (res.success) {
      setSuccess(true)
    } else {
      setError(res.error || 'Terjadi kesalahan')
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setTimeout(() => {
        setSuccess(false)
        setError(null)
      }, 300)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white" disabled={disabled}>
          <UserPlus className="h-4 w-4" /> Pemenang Arisan
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tentukan Pemenang Arisan</DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Bulan</label>
            <select
              value={month}
              onChange={e => setMonth(Number(e.target.value))}
              disabled={isSubmitting || success}
              className="w-full bg-white border border-gray-200 text-gray-700 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {MONTHS.map((m, idx) => (
                <option key={idx} value={idx + 1}>{m}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Anggota Pemenang</label>
            <select
              value={selectedMemberId}
              onChange={e => setSelectedMemberId(e.target.value)}
              disabled={isSubmitting || success}
              className="w-full bg-white border border-gray-200 text-gray-700 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="" disabled>Pilih anggota...</option>
              {members
                .filter(m => !wonInCurrentCycleIds.includes(m.id))
                .map(m => (
                  <option key={m.id} value={m.id}>
                    {m.nickname}
                  </option>
                ))}
            </select>
            <p className="text-xs text-gray-500">Akan dicatat untuk {MONTHS[month - 1]} {currentYear}</p>
          </div>

          {error && (
            <div className="p-3 text-sm text-rose-600 bg-rose-50 rounded-lg border border-rose-100 text-center">
              {error}
            </div>
          )}

          {success && (
            <div className="p-6 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl border border-violet-100 flex flex-col items-center text-center animate-in zoom-in duration-300">
              <CheckCircle2 className="h-12 w-12 text-violet-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900">Berhasil Disimpan</h3>
              <p className="text-sm text-violet-600 font-medium mt-1">Pemenang {MONTHS[month - 1]} {currentYear} telah dicatat.</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)}>
            {success ? 'Tutup' : 'Batal'}
          </Button>
          {!success && (
            <Button onClick={handleSubmit} disabled={isSubmitting || !selectedMemberId} className="bg-violet-600 hover:bg-violet-700 min-w-[120px]">
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
