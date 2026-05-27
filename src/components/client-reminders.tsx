"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Bell, Plus, Check, Trash2, Clock, X, RotateCcw, AlertCircle } from "lucide-react"
import { NotificationTimesEditor } from "@/components/notification-times-editor"
import { format, isPast, isToday, isTomorrow } from "date-fns"
import { fr } from "date-fns/locale"

interface Reminder {
  id: string
  titre: string
  contenu: string | null
  echeance: string
  dateCreation: string
  notificationsAt: string[]
  fait: boolean
  clientId: string | null
}

function echeanceLabel(iso: string): { text: string; color: string } {
  const d = new Date(iso)
  if (isPast(d) && !isToday(d)) return { text: 'En retard', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' }
  if (isToday(d)) return { text: "Aujourd'hui", color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' }
  if (isTomorrow(d)) return { text: 'Demain', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' }
  return { text: format(d, 'dd MMM yyyy', { locale: fr }), color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' }
}

export function ClientReminders({ clientId }: { clientId: string }) {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [tab, setTab] = useState<'pending' | 'history'>('pending')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [form, setForm] = useState({ titre: '', contenu: '', echeance: '', notificationsAt: [] as string[] })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reminders?clientId=${clientId}&includeDone=true`)
      if (res.ok) setReminders(await res.json())
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => { load() }, [load])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaveError('')
    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          echeance: new Date(form.echeance).toISOString(),
          notificationsAt: form.notificationsAt.map(t => new Date(t).toISOString()),
          clientId,
        }),
      })
      if (res.ok) {
        setForm({ titre: '', contenu: '', echeance: '', notificationsAt: [] })
        setShowForm(false)
        await load()
        window.dispatchEvent(new Event('reminders-updated'))
      } else {
        const err = await res.json()
        setSaveError(err.error || 'Erreur lors de la création')
      }
    } catch {
      setSaveError('Erreur réseau')
    } finally {
      setSaving(false)
    }
  }

  const handleDone = async (id: string, fait: boolean) => {
    await fetch(`/api/reminders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fait: !fait }),
    })
    load()
    window.dispatchEvent(new Event('reminders-updated'))
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/reminders/${id}`, { method: 'DELETE' })
    load()
    window.dispatchEvent(new Event('reminders-updated'))
  }

  const pending = reminders.filter(r => !r.fait)
  const done    = reminders.filter(r => r.fait)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <CardTitle>Rappels</CardTitle>
            {pending.length > 0 && (
              <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
                {pending.length}
              </Badge>
            )}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => { setShowForm(!showForm); setSaveError('') }}>
            {showForm ? <X className="w-4 h-4" /> : <><Plus className="w-4 h-4 mr-1" />Ajouter</>}
          </Button>
        </div>

        {/* Onglets */}
        <div className="flex gap-1 mt-2 p-1 bg-muted rounded-lg w-fit">
          {[
            { key: 'pending', label: `En attente (${pending.length})` },
            { key: 'history', label: `Historique (${done.length})` },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                tab === t.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Formulaire */}
        {showForm && (
          <form onSubmit={handleCreate} className="p-3 border rounded-xl space-y-3 bg-muted/30">
            <div className="space-y-1">
              <Label>Titre *</Label>
              <Input
                value={form.titre}
                onChange={e => setForm({ ...form, titre: e.target.value })}
                placeholder="Ex : Rappeler pour devis"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
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
            <div className="p-2 bg-background rounded-lg border space-y-2">
              <NotificationTimesEditor
                times={form.notificationsAt}
                onChange={v => setForm({ ...form, notificationsAt: v })}
                echeance={form.echeance}
              />
            </div>
            {saveError && (
              <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {saveError}
              </div>
            )}
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? 'Enregistrement...' : 'Créer le rappel'}
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => { setShowForm(false); setSaveError('') }}>
                Annuler
              </Button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-4">Chargement...</p>
        ) : tab === 'pending' ? (
          pending.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Aucun rappel en attente</p>
          ) : (
            <div className="space-y-2">
              {pending.map(r => {
                const lbl = echeanceLabel(r.echeance)
                return (
                  <div key={r.id} className="flex items-start gap-2 p-2.5 rounded-lg border bg-card">
                    <button
                      onClick={() => handleDone(r.id, r.fait)}
                      className="mt-0.5 w-5 h-5 flex-shrink-0 rounded-full border-2 border-muted-foreground/40 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                      title="Marquer terminé"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-medium">{r.titre}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${lbl.color}`}>
                          <Clock className="w-2.5 h-2.5 inline mr-0.5" />{lbl.text}
                        </span>
                      </div>
                      {r.contenu && <p className="text-xs text-muted-foreground mt-0.5">{r.contenu}</p>}
                      <p className="text-xs text-muted-foreground/60 mt-0.5">
                        Créé le {format(new Date(r.dateCreation), 'dd MMM yyyy', { locale: fr })}
                      </p>
                    </div>
                    <button onClick={() => handleDelete(r.id)} className="text-muted-foreground hover:text-red-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          )
        ) : (
          done.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Aucun rappel dans l'historique</p>
          ) : (
            <div className="space-y-2">
              {done.map(r => (
                <div key={r.id} className="flex items-start gap-2 p-2.5 rounded-lg border bg-muted/30">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm line-through text-muted-foreground">{r.titre}</p>
                    {r.contenu && (
                      <p className="text-xs text-muted-foreground/60 mt-0.5 line-through">{r.contenu}</p>
                    )}
                    <p className="text-xs text-muted-foreground/60 mt-0.5">
                      Échéance : {format(new Date(r.echeance), 'dd MMM yyyy', { locale: fr })}
                      {' · '}Créé le {format(new Date(r.dateCreation), 'dd MMM yyyy', { locale: fr })}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleDone(r.id, r.fait)}
                      className="text-muted-foreground hover:text-blue-500 transition-colors"
                      title="Réactiver"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(r.id)} className="text-muted-foreground hover:text-red-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </CardContent>
    </Card>
  )
}
