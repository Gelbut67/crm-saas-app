"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronRight, Trash2, MapPin, Clock, CheckCircle2, Circle, History, RefreshCw } from "lucide-react"

interface TourneeVisiteRecord {
  id: string
  clientId: string
  ordre: number
  heureArrivee: string | null
  heureDepart: string | null
  visite: boolean
  client: {
    id: string
    nom: string
    entreprise?: string
    ville?: string
    codePostal?: string
    statut: string
    interactions: { id: string; date: string }[]
  }
}

interface TourneeRecord {
  id: string
  date: string
  nom: string | null
  statut: string
  visites: TourneeVisiteRecord[]
}

interface TourneeHistoryProps {
  onVisiteMarked?: () => void
}

export function TourneeHistory({ onVisiteMarked }: TourneeHistoryProps) {
  const [tournees, setTournees] = useState<TourneeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [updating, setUpdating] = useState<Set<string>>(new Set())

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/tournees/historique')
      if (res.ok) setTournees(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleVisite = async (tourneeId: string, visiteId: string, currentValue: boolean) => {
    setUpdating(prev => new Set(prev).add(visiteId))
    try {
      const res = await fetch(`/api/tournees/historique/${tourneeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visiteId, visite: !currentValue }),
      })
      if (res.ok) {
        setTournees(prev => prev.map(t => {
          if (t.id !== tourneeId) return t
          return {
            ...t,
            visites: t.visites.map(v =>
              v.id === visiteId ? { ...v, visite: !currentValue } : v
            ),
          }
        }))
        if (!currentValue) onVisiteMarked?.()
      }
    } finally {
      setUpdating(prev => { const s = new Set(prev); s.delete(visiteId); return s })
    }
  }

  const deleteTournee = async (id: string) => {
    if (!confirm('Supprimer cette tournée de l\'historique ?')) return
    await fetch(`/api/tournees/historique/${id}`, { method: 'DELETE' })
    setTournees(prev => prev.filter(t => t.id !== id))
  }

  if (loading) return (
    <Card>
      <CardContent className="py-8 text-center text-muted-foreground text-sm">
        Chargement de l'historique…
      </CardContent>
    </Card>
  )

  if (tournees.length === 0) return (
    <Card>
      <CardContent className="py-10 text-center">
        <History className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
        <p className="text-muted-foreground text-sm">Aucune tournée sauvegardée.</p>
        <p className="text-xs text-muted-foreground mt-1">Optimisez une tournée puis cliquez sur "Sauvegarder".</p>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <History className="w-4 h-4" />
          Historique des tournées ({tournees.length})
        </h3>
        <Button variant="ghost" size="sm" onClick={load}>
          <RefreshCw className="w-3.5 h-3.5 mr-1" />
          Actualiser
        </Button>
      </div>

      {tournees.map(t => {
        const done = t.visites.filter(v => v.visite).length
        const total = t.visites.length
        const pct = total > 0 ? Math.round((done / total) * 100) : 0
        const isExpanded = expanded.has(t.id)

        return (
          <Card key={t.id} className="overflow-hidden">
            <CardHeader className="p-0">
              <button
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/40 transition-colors"
                onClick={() => toggleExpand(t.id)}
              >
                {isExpanded ? <ChevronDown className="w-4 h-4 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">
                      {new Date(t.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    {t.nom && <span className="text-sm text-muted-foreground">— {t.nom}</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-muted-foreground">{total} visite{total > 1 ? 's' : ''} prévue{total > 1 ? 's' : ''}</span>
                    <span className={`text-xs font-semibold ${done === total ? 'text-green-600' : done > 0 ? 'text-orange-500' : 'text-muted-foreground'}`}>
                      {done}/{total} effectuée{done > 1 ? 's' : ''} ({pct}%)
                    </span>
                    {/* Barre de progression */}
                    <div className="flex-1 max-w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${done === total ? 'bg-green-500' : 'bg-orange-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700 flex-shrink-0"
                  onClick={e => { e.stopPropagation(); deleteTournee(t.id) }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </button>
            </CardHeader>

            {isExpanded && (
              <CardContent className="pt-0 pb-4 px-4">
                <div className="border-t pt-3 space-y-2">
                  {t.visites.map(v => {
                    const nbVisites = v.client.interactions.length
                    const isUpdating = updating.has(v.id)
                    return (
                      <div
                        key={v.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                          v.visite ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-card border-border'
                        }`}
                      >
                        <button
                          onClick={() => toggleVisite(t.id, v.id, v.visite)}
                          disabled={isUpdating}
                          className="flex-shrink-0 focus:outline-none"
                          title={v.visite ? 'Marquer comme non visité' : 'Marquer comme visité'}
                        >
                          {v.visite
                            ? <CheckCircle2 className="w-5 h-5 text-green-600" />
                            : <Circle className={`w-5 h-5 ${isUpdating ? 'text-muted-foreground animate-pulse' : 'text-muted-foreground'}`} />
                          }
                        </button>

                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {v.ordre}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-sm font-medium ${v.visite ? 'line-through text-muted-foreground' : ''}`}>
                              {v.client.entreprise || v.client.nom}
                            </span>
                            <Badge variant={v.client.statut === 'client' ? 'default' : 'secondary'} className="text-xs py-0">
                              {v.client.statut === 'client' ? 'Client' : 'Prospect'}
                            </Badge>
                            {nbVisites > 0 && (
                              <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs rounded-full px-2 py-0 font-medium">
                                {nbVisites} visite{nbVisites > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          {v.client.ville && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3" />{v.client.ville}
                            </p>
                          )}
                        </div>

                        {(v.heureArrivee || v.heureDepart) && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                            <Clock className="w-3 h-3" />
                            {v.heureArrivee}{v.heureDepart ? ` – ${v.heureDepart}` : ''}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}
