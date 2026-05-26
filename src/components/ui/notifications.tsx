"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { Bell, X } from "lucide-react"
import { format, isPast, isToday, isTomorrow } from "date-fns"
import { fr } from "date-fns/locale"

interface Reminder {
  id: string
  titre: string
  contenu: string | null
  echeance: string
  fait: boolean
  client: { id: string; nom: string; entreprise: string | null; statut: string } | null
}

interface Toast {
  id: string
  titre: string
  contenu: string | null
  clientNom: string | null
  clientId: string | null
  clientStatut: string | null
}

function echeanceUrgency(iso: string): 'overdue' | 'today' | 'soon' | 'future' {
  const d = new Date(iso)
  if (isPast(d) && !isToday(d)) return 'overdue'
  if (isToday(d)) return 'today'
  if (isTomorrow(d)) return 'soon'
  return 'future'
}

function echeanceText(iso: string): string {
  const d = new Date(iso)
  if (isPast(d) && !isToday(d)) return `En retard · ${format(d, 'dd MMM', { locale: fr })}`
  if (isToday(d)) return `Aujourd'hui · ${format(d, 'HH:mm')}`
  if (isTomorrow(d)) return 'Demain'
  return format(d, 'dd MMM yyyy', { locale: fr })
}

const URGENCY_STYLE: Record<string, string> = {
  overdue: 'border-red-300 bg-red-50 dark:bg-red-900/20',
  today:   'border-orange-300 bg-orange-50 dark:bg-orange-900/20',
  soon:    'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20',
  future:  'border-border bg-card',
}

// ── Toast Bubbles ────────────────────────────────────────────────────────────

interface ToastItem extends Toast {
  urgency: 'overdue' | 'today'
  dismissAt: number
}

export function ReminderToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const shownRef = useRef<Set<string>>(new Set())

  const check = useCallback(async () => {
    try {
      const res = await fetch('/api/reminders?includeDone=false')
      if (!res.ok) return
      const reminders: Reminder[] = await res.json()
      const now = new Date()
      const newToasts: ToastItem[] = []
      for (const r of reminders) {
        const d = new Date(r.echeance)
        const isOverdue = d < now && !isToday(d)
        const isDueToday = isToday(d)
        if (!isOverdue && !isDueToday) continue
        if (shownRef.current.has(r.id)) continue
        shownRef.current.add(r.id)
        newToasts.push({
          id: r.id,
          titre: r.titre,
          contenu: r.contenu,
          clientNom: r.client ? (r.client.entreprise || r.client.nom) : null,
          clientId: r.client?.id ?? null,
          clientStatut: r.client?.statut ?? null,
          urgency: isOverdue ? 'overdue' : 'today',
          dismissAt: Date.now() + 12_000,
        })
      }
      if (newToasts.length > 0) setToasts(prev => [...prev, ...newToasts])
    } catch {}
  }, [])

  // Auto-dismiss after 12s
  useEffect(() => {
    const tick = setInterval(() => {
      const now = Date.now()
      setToasts(prev => prev.filter(t => t.dismissAt > now))
    }, 1_000)
    return () => clearInterval(tick)
  }, [])

  useEffect(() => {
    check()
    const iv = setInterval(check, 60_000)
    const handler = () => { shownRef.current.clear(); check() }
    window.addEventListener('reminders-updated', handler)
    return () => { clearInterval(iv); window.removeEventListener('reminders-updated', handler) }
  }, [check])

  const dismiss = (id: string) => setToasts(prev => prev.filter(t => t.id !== id))

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[200] space-y-2 w-80">
      {toasts.map(t => {
        const isOverdue = t.urgency === 'overdue'
        const remaining = Math.max(0, Math.round((t.dismissAt - Date.now()) / 1000))
        return (
          <div
            key={t.id}
            className={`flex items-start gap-3 p-4 rounded-xl border-2 shadow-xl transition-all ${
              isOverdue
                ? 'border-red-400 bg-red-50 dark:bg-red-950'
                : 'border-orange-400 bg-orange-50 dark:bg-orange-950'
            }`}
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
              isOverdue ? 'bg-red-200 dark:bg-red-800' : 'bg-orange-200 dark:bg-orange-800'
            }`}>
              <Bell className={`w-5 h-5 ${isOverdue ? 'text-red-600 dark:text-red-300' : 'text-orange-600 dark:text-orange-300'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-bold uppercase tracking-wide mb-0.5 ${
                isOverdue ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'
              }`}>
                {isOverdue ? '⚠️ Rappel en retard' : '🔔 Rappel aujourd\'hui'}
              </p>
              <p className="text-sm font-semibold text-foreground">{t.titre}</p>
              {t.clientNom && (
                <p className="text-xs text-muted-foreground mt-0.5">{t.clientNom}</p>
              )}
              {t.contenu && (
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{t.contenu}</p>
              )}
              <div className="flex items-center gap-3 mt-1.5">
                {t.clientId && (
                  <Link
                    href={t.clientStatut === 'client' ? `/clients-db/${t.clientId}` : `/prospects-db/${t.clientId}`}
                    className="text-xs font-medium text-primary hover:underline"
                    onClick={() => dismiss(t.id)}
                  >
                    Voir la fiche →
                  </Link>
                )}
                <Link
                  href="/notifications"
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => dismiss(t.id)}
                >
                  Tous les rappels
                </Link>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <button onClick={() => dismiss(t.id)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
              <span className="text-[10px] text-muted-foreground">{remaining}s</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

