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

export function ReminderToasts() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const shownRef = useRef<Set<string>>(new Set())

  const check = useCallback(async () => {
    try {
      const res = await fetch('/api/reminders?dueOnly=true')
      if (!res.ok) return
      const reminders: Reminder[] = await res.json()
      const newToasts: Toast[] = []
      for (const r of reminders) {
        if (!shownRef.current.has(r.id)) {
          shownRef.current.add(r.id)
          newToasts.push({
            id: r.id,
            titre: r.titre,
            contenu: r.contenu,
            clientNom: r.client ? (r.client.entreprise || r.client.nom) : null,
            clientId: r.client?.id ?? null,
            clientStatut: r.client?.statut ?? null,
          })
        }
      }
      if (newToasts.length > 0) setToasts(prev => [...prev, ...newToasts])
    } catch {}
  }, [])

  useEffect(() => {
    check()
    const iv = setInterval(check, 60_000)
    const handler = () => check()
    window.addEventListener('reminders-updated', handler)
    return () => { clearInterval(iv); window.removeEventListener('reminders-updated', handler) }
  }, [check])

  const dismiss = (id: string) => setToasts(prev => prev.filter(t => t.id !== id))

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] space-y-2 max-w-sm">
      {toasts.map(t => (
        <div key={t.id} className="flex items-start gap-3 p-3 rounded-xl border border-orange-300 bg-white dark:bg-gray-900 shadow-lg animate-in slide-in-from-right-4">
          <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center flex-shrink-0">
            <Bell className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">🔔 Rappel échu</p>
            <p className="text-sm font-medium truncate">{t.titre}</p>
            {t.clientNom && <p className="text-xs text-muted-foreground">{t.clientNom}</p>}
            {t.contenu && <p className="text-xs text-muted-foreground line-clamp-1">{t.contenu}</p>}
            {t.clientId && (
              <Link
                href={t.clientStatut === 'client' ? `/clients-db/${t.clientId}` : `/prospects-db/${t.clientId}`}
                className="text-xs text-primary hover:underline"
                onClick={() => dismiss(t.id)}
              >
                Voir la fiche →
              </Link>
            )}
          </div>
          <button onClick={() => dismiss(t.id)} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}

