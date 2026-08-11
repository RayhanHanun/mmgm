'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { addMember, editMember } from '@/actions/members'
import { Pencil, UserPlus, CheckCircle2 } from 'lucide-react'

interface Props {
  memberToEdit?: {
    id: string
    nickname: string
  }
}

export function MemberDialog({ memberToEdit }: Props) {
  const [open, setOpen] = useState(false)
  const [nickname, setNickname] = useState(memberToEdit?.nickname || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nickname.trim()) return

    setIsSubmitting(true)
    setError(null)

    const res = memberToEdit 
      ? await editMember(memberToEdit.id, nickname)
      : await addMember(nickname)
      
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
        if (!memberToEdit) setNickname('')
        setSuccess(false)
        setError(null)
      }, 300)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {memberToEdit ? (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-indigo-600">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button size="sm" className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white">
            <UserPlus className="h-4 w-4" /> Tambah Anggota
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{memberToEdit ? 'Edit Anggota' : 'Tambah Anggota'}</DialogTitle>
        </DialogHeader>
        
        {success ? (
          <div className="py-8 flex flex-col items-center justify-center text-center animate-in zoom-in duration-300">
            <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Berhasil!</h3>
            <p className="text-sm text-gray-500">Anggota berhasil {memberToEdit ? 'diperbarui' : 'ditambahkan'}.</p>
            <Button className="mt-6 w-full" variant="outline" onClick={() => handleOpenChange(false)}>
              Tutup
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="nickname">Nama Anggota</Label>
              <Input
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Contoh: Budi Santoso"
                required
              />
            </div>

            {error && <p className="text-sm text-rose-600 font-medium">{error}</p>}

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting || !nickname.trim()} className="min-w-[120px] bg-indigo-600 hover:bg-indigo-700">
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
