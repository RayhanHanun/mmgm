import { PinForm } from './PinForm'

export default function LoginPinPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-950">
      <div className="w-full max-w-sm rounded-xl border bg-card text-card-foreground shadow-sm p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">Akses Anggota</h1>
          <p className="mt-2 text-sm text-muted-foreground">Masukkan 4 digit PIN bersama</p>
        </div>

        <PinForm />
      </div>
    </div>
  )
}
