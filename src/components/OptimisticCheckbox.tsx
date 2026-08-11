'use client'

import { useOptimistic, useTransition, useState } from 'react'
import { Check, AlertTriangle } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { toggleTransaction } from '@/actions/transactions'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface Props {
  memberId: string
  categoryId: number
  month: number
  year: number
  initialStatus: boolean
  isDisabled: boolean
  isPastDue?: boolean
}

export function OptimisticCheckbox({
  memberId,
  categoryId,
  month,
  year,
  initialStatus,
  isDisabled,
  isPastDue = false
}: Props) {
  const [optimisticStatus, addOptimisticStatus] = useOptimistic(
    initialStatus,
    (_state, newStatus: boolean) => newStatus
  )
  const [isPending, startTransition] = useTransition()
  const [showConfirm, setShowConfirm] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<boolean | null>(null)

  const executeToggle = (newStatus: boolean) => {
    startTransition(async () => {
      addOptimisticStatus(newStatus)
      
      const res = await toggleTransaction({ memberId, categoryId, month, year })
      if (!res.success) {
        toast.error(res.error)
      } else {
        toast.success(newStatus ? 'Berhasil dicatat.' : 'Berhasil dihapus.')
      }
    })
  }

  const handleToggle = () => {
    if (isDisabled || isPending) return
    const newStatus = !optimisticStatus
    setPendingStatus(newStatus)
    setShowConfirm(true)
  }

  const confirmAction = () => {
    if (pendingStatus !== null) {
      executeToggle(pendingStatus)
    }
    setShowConfirm(false)
  }

  // Render for Disabled (Public view)
  if (isDisabled) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        {optimisticStatus ? (
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          </span>
        ) : isPastDue ? (
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-rose-50 text-rose-500 font-bold text-[10px]">
            X
          </span>
        ) : (
          <span className="text-gray-300 text-sm">·</span>
        )}
      </div>
    )
  }

  // Render for Admin view
  return (
    <>
      <div className="flex h-full w-full items-center justify-center">
        <Checkbox
          checked={optimisticStatus}
          onCheckedChange={handleToggle}
          className={`h-5 w-5 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 ${!optimisticStatus && isPastDue ? 'border-rose-400 bg-rose-50' : ''}`}
        />
      </div>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-indigo-600">
              <AlertTriangle className="h-5 w-5" /> Konfirmasi
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 text-sm text-gray-700">
            {pendingStatus ? 'Yakin ingin mencatat pembayaran ini?' : 'Yakin ingin membatalkan/menghapus pembayaran ini?'}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowConfirm(false)}>Batal</Button>
            <Button variant={pendingStatus ? "default" : "destructive"} size="sm" onClick={confirmAction}>
              {pendingStatus ? 'Ya, Catat' : 'Ya, Hapus'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
