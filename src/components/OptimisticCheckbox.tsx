'use client'

import { useOptimistic, useTransition } from 'react'
import { Check } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { toggleTransaction } from '@/actions/transactions'

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

  const handleToggle = () => {
    if (isDisabled || isPending) return

    const newStatus = !optimisticStatus
    startTransition(async () => {
      addOptimisticStatus(newStatus)
      
      const res = await toggleTransaction({ memberId, categoryId, month, year })
      if (!res.success) {
        alert(res.error)
      }
    })
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
    <div className="flex h-full w-full items-center justify-center">
      <Checkbox
        checked={optimisticStatus}
        onCheckedChange={handleToggle}
        disabled={isPending}
        className={`h-5 w-5 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 ${!optimisticStatus && isPastDue ? 'border-rose-400 bg-rose-50' : ''}`}
      />
    </div>
  )
}
