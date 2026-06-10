"use client"

import { useSession, signIn } from 'next-auth/react'
import { useState } from 'react'
import { ShieldAlert, LogOut } from 'lucide-react'

export function ImpersonateBanner() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)

  if (!session?.user?.impersonatedBy) return null

  const handleRestore = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/restore', { method: 'POST' })
      if (!res.ok) return
      const { token, adminId } = await res.json()
      await signIn('credentials', {
        restoreToken: token,
        adminId,
        redirect: true,
        callbackUrl: '/admin/users',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-between px-4 py-2 bg-amber-500 text-white text-sm shadow-lg">
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 flex-shrink-0" />
        <span>Vous naviguez en tant que <strong>{session.user.name}</strong> — mode administrateur</span>
      </div>
      <button
        onClick={handleRestore}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg transition text-xs font-semibold whitespace-nowrap"
      >
        <LogOut className="w-3.5 h-3.5" />
        {loading ? 'Retour...' : 'Reprendre mon compte admin'}
      </button>
    </div>
  )
}
