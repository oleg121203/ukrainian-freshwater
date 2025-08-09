import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { AdminDashboard } from '@/components/AdminDashboard'

interface AdminGateProps {
  onNavigate?: (section: string) => void
}

export function AdminGate({ onNavigate }: AdminGateProps) {
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState('')
  const expected = (import.meta as any).env?.VITE_ADMIN_PASSWORD || 'petka-2025'

  useEffect(() => {
    const ok = sessionStorage.getItem('adminAuthed') === '1'
    if (ok) setAuthed(true)
  }, [])

  if (authed) {
    return <AdminDashboard onNavigate={onNavigate || (() => {})} />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="bg-white/95 backdrop-blur p-6 rounded-xl shadow-xl w-full max-w-sm border">
        <h1 className="text-xl font-semibold mb-2">Вхід в адмін-панель</h1>
        <p className="text-sm text-gray-600 mb-4">Введіть пароль, щоб продовжити.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (pw === expected) {
              sessionStorage.setItem('adminAuthed', '1')
              setAuthed(true)
              toast.success('Ласкаво просимо, адміністратор!', { id: 'admin-login' })
            } else {
              toast.error('Невірний пароль', { id: 'admin-login' })
            }
          }}
          className="space-y-3"
        >
          <Input
            type="password"
            placeholder="Пароль"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
          />
          <div className="flex gap-2">
            <Button type="submit" className="w-full">Увійти</Button>
            <Button type="button" variant="outline" onClick={() => onNavigate?.('hero')}>Назад</Button>
          </div>
          <p className="text-xs text-gray-500">Поточний пароль за замовчуванням: <span className="font-mono">petka-2025</span> (змінюйте через VITE_ADMIN_PASSWORD)</p>
        </form>
      </div>
    </div>
  )
}

export default AdminGate
