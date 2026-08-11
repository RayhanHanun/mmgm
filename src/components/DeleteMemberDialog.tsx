'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { deleteMember } from '@/actions/members'
import { Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react'

interface Props {
  member: {
    id: string
    nickname: string
  }
}

export function DeleteMemberDialog({ member }: Props) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)

    const res = await deleteMember(member.id)
      
    setIsDeleting(false)
    
    if (res.success) {
      setSuccess(true)
      setSuccessMessage(res.message || 'Anggota berhasil dihapus')
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
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50">
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Hapus Anggota</DialogTitle>
        </DialogHeader>
        
        {success ? (
          <div className="py-8 flex flex-col items-center justify-center text-center animate-in zoom-in duration-300">
            <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Berhasil!</h3>
            <p className="text-sm text-gray-500">{successMessage}</p>
            <Button className="mt-6 w-full" variant="outline" onClick={() => handleOpenChange(false)}>
              Tutup
            </Button>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            <div className="p-4 bg-rose-50 rounded-lg flex gap-3 border border-rose-100">
              <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
              <div className="text-sm text-rose-800">
                <p>Anda yakin ingin menghapus <strong>{member.nickname}</strong> dari sistem?</p>
                <p className="mt-2 opacity-80 text-xs">Jika anggota ini memiliki riwayat transaksi sebelumnya, data mereka tidak akan dihapus permanen, tetapi disembunyikan agar riwayat keuangan tetap sinkron.</p>
              </div>
            </div>

            {error && <p className="text-sm text-rose-600 font-medium">{error}</p>}

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Batal
              </Button>
              <Button 
                type="button" 
                variant="destructive"
                disabled={isDeleting} 
                onClick={handleDelete}
                className="min-w-[120px]"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
