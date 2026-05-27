"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Bell, Plus, Check, Trash2, Clock, X, RefreshCw,
  AlertTriangle, Calendar, Users, Search
} from "lucide-react"
import { NotificationTimesEditor } from "@/components/notification-times-editor"
import { format, isPast, isToday, isTomorrow } from "date-fns"
import { fr } from "date-fns/locale"

interface Reminder {
  id: string
  titre: string
  contenu: string | null
  echeance: string
  notificationsAt: string[]
  fait: boolean
  client: { id: string; nom: string; entreprise: string | null; statut: string } | null
}

function urgency(iso: string): 'overdue' | 'today' | 'soon' | 'future' {
  const d = new Date(iso)
  if (isPast(d) && !isToday(d)) return 'overdue'
  if (isToday(d)) return 'today'
  if (isTomorrow(d)) return 'soon'
  return 'future'
}

const URGENCY_CONFIG = {
  overdue: { label: 'En retard', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300', icon: AlertTriangle },
  today:   { label: "Aujourd'hui", color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300', icon: Bell },
  soon:    { label: 'Demain', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300', icon: Clock },
  future:  { label: 'À venir', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', icon: Calendar },
}

const CARD_STYLE = {
  overdue: 'border-red-200 bg-red-50/50 dark:bg-red-900/10',
  today:   'border-orange-200 bg-orange-50/50 dark:bg-orange-900/10',
  soon:    'border-yellow-200 bg-yellow-50/50 dark:bg-yellow-900/10',
  future:  'border-border bg-card',
}

export default function NotificationsPage() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [done, setDone] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filterTab, setFilterTab] = useState<'pending' | 'done'>('pending')
  const [form, setForm] = useState({ titre: '', contenu: '', echeance: '', notificationsAt: [] as string[] })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [pendingRes, doneRes] = await Promise.all([
        fetch('/api/reminders?includeDone=false'),
        fetch('/api/reminders?includeDone=true'),
      ])
      if (pendingRes.ok) setReminders(await pendingRes.json())
      if (doneRes.ok) {
        const all = await doneRes.json()
        setDone(all.filter((r: Reminder) => r.fait))
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const handler = () => load()
    window.addEventListener('reminders-updated', handler)
    window.addEventListener('focus', handler)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') load()
    })
    return () => {
      window.removeEventListener('reminders-updated', handler)
      window.removeEventListener('focus', handler)
    }
  }, [load])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          echeance: new Date(form.echeance).toISOString(),
          notificationsAt: form.notificationsAt.map((t: string) => new Date(t).toISOString()),
        }),
      })
      if (res.ok) {
        setForm({ titre: '', contenu: '', echeance: '', notificationsAt: [] })
        setShowForm(false)
        load()
        window.dispatchEvent(new Event('reminders-updated'))
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDone = async (id: string) => {
    await fetch(`/api/reminders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fait: true }),
    })
    load()
    window.dispatchEvent(new Event('reminders-updated'))
  }

  const handleUndone = async (id: string) => {
    await fetch(`/api/reminders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fait: false }),
    })
    load()
    window.dispatchEvent(new Event('reminders-updated'))
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/reminders/${id}`, { method: 'DELETE' })
    load()
    window.dispatchEvent(new Event('reminders-updated'))
  }

  const filterList = (list: Reminder[]) =>
    list.filter(r => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        r.titre.toLowerCase().includes(q) ||
        r.contenu?.toLowerCase().includes(q) ||
        r.client?.nom.toLowerCase().includes(q) ||
        r.client?.entreprise?.toLowerCase().includes(q)
      )
    })

  const filteredPending = filterList(reminders)
  const filteredDone    = filterList(done)

  // Stats
  const overdue = reminders.filter(r => urgency(r.echeance) === 'overdue').length
  const today   = reminders.filter(r => urgency(r.echeance) === 'today').length
  const upcoming = reminders.filter(r => ['soon', 'future'].includes(urgency(r.echeance))).length

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Notifications & Rappels
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {reminders.length} rappel{reminders.length > 1 ? 's' : ''} en attente
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? <X className="w-4 h-4 mr-1.5" /> : <Plus className="w-4 h-4 mr-1.5" />}
            {showForm ? 'Annuler' : 'Nouveau rappel'}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'En retard', value: overdue, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20 border-red-200', icon: AlertTriangle },
          { label: "Aujourd'hui", value: today,   color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200', icon: Bell },
          { label: 'À venir', value: upcoming, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200', icon: Calendar },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className={`rounded-xl border p-4 ${bg}`}>
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Formulaire */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nouveau rappel</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <Label>Titre *</Label>
                  <Input
                    value={form.titre}
                    onChange={e => setForm({ ...form, titre: e.target.value })}
                    placeholder="Ex : Rappeler M. Dupont pour le devis"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>Échéance *</Label>
                  <Input
                    type="datetime-local"
                    value={form.echeance}
                    onChange={e => setForm({ ...form, echeance: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>Note (optionnel)</Label>
                  <Input
                    value={form.contenu}
                    onChange={e => setForm({ ...form, contenu: e.target.value })}
                    placeholder="Détails..."
                  />
                </div>
              </div>
              <div className="p-2 bg-muted/30 rounded-lg border">
                <NotificationTimesEditor
                  times={form.notificationsAt}
                  onChange={v => setForm({ ...form, notificationsAt: v })}
                  echeance={form.echeance}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Pour lier un rappel à un client, utilisez la section Rappels dans sa fiche.
              </p>
              <div className="flex gap-2 pt-1">
                <Button type="submit" size="sm" disabled={saving}>
                  {saving ? 'Enregistrement...' : 'Créer le rappel'}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setShowForm(false)}>
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Barre de recherche + onglets */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un rappel..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
          {[
            { key: 'pending', label: `En attente (${reminders.length})` },
            { key: 'done',    label: `Terminés (${done.length})` },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilterTab(tab.key as any)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filterTab === tab.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-16">
          <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filterTab === 'pending' ? (
        filteredPending.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">Aucun rappel en attente</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredPending.map(r => {
              const u = urgency(r.echeance)
              const cfg = URGENCY_CONFIG[u]
              const Icon = cfg.icon
              const clientHref = r.client?.statut === 'client'
                ? `/clients-db/${r.client.id}`
                : `/prospects-db/${r.client?.id}`
              return (
                <div key={r.id} className={`rounded-xl border p-4 ${CARD_STYLE[u]}`}>
                  <div className="flex items-start gap-3">
                    {/* Bouton terminer */}
                    <button
                      onClick={() => handleDone(r.id)}
                      className="mt-0.5 w-5 h-5 flex-shrink-0 rounded-full border-2 border-muted-foreground/40 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                      title="Marquer comme terminé"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-sm">{r.titre}</p>
                          {r.contenu && (
                            <p className="text-xs text-muted-foreground mt-0.5">{r.contenu}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="text-muted-foreground hover:text-red-500 transition-colors flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>
                          <Icon className="w-3 h-3" />
                          {cfg.label}
                          {' · '}
                          {format(new Date(r.echeance), isToday(new Date(r.echeance)) ? "HH'h'mm" : 'dd MMM yyyy', { locale: fr })}
                        </span>
                        {r.client && (
                          <Link
                            href={clientHref}
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <Users className="w-3 h-3" />
                            {r.client.entreprise || r.client.nom}
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      ) : (
        filteredDone.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Check className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">Aucun rappel terminé</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredDone.map(r => (
              <div key={r.id} className="rounded-xl border p-4 opacity-60 bg-card">
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm line-through text-muted-foreground">{r.titre}</p>
                    {r.client && (
                      <p className="text-xs text-muted-foreground">{r.client.entreprise || r.client.nom}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost" size="sm"
                      onClick={() => handleUndone(r.id)}
                      className="h-7 text-xs"
                    >
                      Réactiver
                    </Button>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="text-muted-foreground hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
