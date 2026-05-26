"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, X, Clock, Check, Trash2, AlertTriangle, ChevronRight, Plus } from "lucide-react"
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

// ── Notification Center (cloche + panneau) ───────────────────────────────────

export function NotificationCenter() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [isOpen, setIsOpen] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/reminders?includeDone=false')
      if (res.ok) setReminders(await res.json())
    } catch {}
  }, [])

  useEffect(() => {
    load()
    const iv = setInterval(load, 60_000)
    const handler = () => load()
    window.addEventListener('reminders-updated', handler)
    return () => { clearInterval(iv); window.removeEventListener('reminders-updated', handler) }
  }, [load])

  const dueCount = reminders.filter(r => {
    const d = new Date(r.echeance)
    return isPast(d) || isToday(d)
  }).length

  const handleDone = async (id: string) => {
    await fetch(`/api/reminders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fait: true }),
    })
    load()
    window.dispatchEvent(new Event('reminders-updated'))
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/reminders/${id}`, { method: 'DELETE' })
    load()
    window.dispatchEvent(new Event('reminders-updated'))
  }

  const sections = [
    { label: '🔴 En retard', items: reminders.filter(r => echeanceUrgency(r.echeance) === 'overdue') },
    { label: '🟠 Aujourd\'hui', items: reminders.filter(r => echeanceUrgency(r.echeance) === 'today') },
    { label: '🟡 Demain', items: reminders.filter(r => echeanceUrgency(r.echeance) === 'soon') },
    { label: '🔵 À venir', items: reminders.filter(r => echeanceUrgency(r.echeance) === 'future') },
  ].filter(s => s.items.length > 0)

  return (
    <>
      {/* Cloche */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-muted transition-colors"
        title="Rappels"
      >
        <Bell className="w-5 h-5 text-muted-foreground" />
        {dueCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
            {dueCount > 99 ? '99+' : dueCount}
          </span>
        )}
      </button>

      {/* Panneau latéral */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="fixed top-0 right-0 z-50 h-full w-80 bg-background border-l shadow-xl flex flex-col animate-in slide-in-from-right-4">
            {/* En-tête */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h2 className="font-semibold">Rappels</h2>
                <p className="text-xs text-muted-foreground">{reminders.length} en attente</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 rounded-lg hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Liste */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {sections.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                  <Bell className="w-10 h-10 opacity-20" />
                  <p className="text-sm">Aucun rappel en attente</p>
                </div>
              ) : (
                sections.map(section => (
                  <div key={section.label}>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">{section.label}</p>
                    <div className="space-y-2">
                      {section.items.map(r => (
                        <div key={r.id} className={`rounded-xl border p-3 ${URGENCY_STYLE[echeanceUrgency(r.echeance)]}`}>
                          <div className="flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{r.titre}</p>
                              {r.client && (
                                <Link
                                  href={r.client.statut === 'client' ? `/clients-db/${r.client.id}` : `/prospects-db/${r.client.id}`}
                                  onClick={() => setIsOpen(false)}
                                  className="text-xs text-primary hover:underline"
                                >
                                  {r.client.entreprise || r.client.nom}
                                </Link>
                              )}
                              {r.contenu && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{r.contenu}</p>}
                              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" />{echeanceText(r.echeance)}
                              </p>
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              <button
                                onClick={() => handleDone(r.id)}
                                className="p-1 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600"
                                title="Marquer terminé"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(r.id)}
                                className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                                title="Supprimer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}
