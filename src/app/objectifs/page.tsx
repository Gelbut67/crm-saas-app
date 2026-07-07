"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Target, Plus, Trash2, CheckCircle2, Circle, MapPin, Navigation,
  Loader2, ChevronLeft, ChevronRight, History, RefreshCw, Search,
  Building, Users, TrendingUp, Calendar, X
} from "lucide-react"
import { useClients, useProspects } from "@/hooks/useDatabase"
import { TourneeHistory } from "@/components/tournee-history"
import { getLundiSemaine, getDimancheSemaine } from "@/lib/semaine"
import Link from "next/link"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface ObjectifItem {
  id: string
  clientId: string
  visite: boolean
  visitedAt: string | null
  reporte: boolean
  createdAt: string
  client: {
    id: string
    nom: string
    entreprise: string | null
    ville: string | null
    codePostal: string | null
    adresse: string | null
    departement: string | null
    statut: string
  }
}

interface Objectif {
  id: string
  weekStart: string
  items: ObjectifItem[]
}

interface SemaineHistorique {
  id: string
  weekStart: string
  items: ObjectifItem[]
}

function formatSemaine(weekStart: Date): string {
  const fin = getDimancheSemaine(weekStart)
  if (weekStart.getMonth() === fin.getMonth()) {
    return `${format(weekStart, 'd', { locale: fr })} - ${format(fin, 'd MMMM yyyy', { locale: fr })}`
  }
  return `${format(weekStart, 'd MMM', { locale: fr })} - ${format(fin, 'd MMMM yyyy', { locale: fr })}`
}

export default function ObjectifsPage() {
  const { clients, loading: loadingClients } = useClients()
  const { prospects, loading: loadingProspects } = useProspects()
  const allClients = [...clients, ...prospects]
  const loading = loadingClients || loadingProspects

  const [objectif, setObjectif] = useState<Objectif | null>(null)
  const [loadingObj, setLoadingObj] = useState(true)
  const [weekOffset, setWeekOffset] = useState(0) // 0 = semaine courante, -1 = précédente, etc.
  const [showAddModal, setShowAddModal] = useState(false)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<'tous' | 'client' | 'prospect'>('tous')
  const [updating, setUpdating] = useState<Set<string>>(new Set())
  const [showHistory, setShowHistory] = useState(false)
  const [historique, setHistorique] = useState<SemaineHistorique[]>([])
  const [loadingHist, setLoadingHist] = useState(false)

  const weekStart = useMemo(() => {
    const currentWeekStart = getLundiSemaine(new Date())
    const refDate = new Date(currentWeekStart)
    refDate.setDate(refDate.getDate() + weekOffset * 7)
    return getLundiSemaine(refDate)
  }, [weekOffset])
  const isCurrentWeek = weekOffset === 0
  const isPast = weekOffset < 0

  const loadObjectif = useCallback(async () => {
    setLoadingObj(true)
    try {
      const res = await fetch(`/api/objectifs?week=${weekStart.toISOString()}`)
      if (res.ok) {
        const data = await res.json()
        setObjectif(data)
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoadingObj(false)
    }
  }, [weekStart])

  useEffect(() => {
    loadObjectif()
  }, [loadObjectif])

  const loadHistorique = useCallback(async () => {
    setLoadingHist(true)
    try {
      const res = await await fetch('/api/objectifs/historique')
      if (res.ok) setHistorique(await res.json())
    } finally {
      setLoadingHist(false)
    }
  }, [])

  useEffect(() => {
    if (showHistory) loadHistorique()
  }, [showHistory, loadHistorique])

  const ajouterClient = async (clientId: string) => {
    try {
      const res = await fetch('/api/objectifs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      })
      if (res.ok) {
        await loadObjectif()
      } else if (res.status === 409) {
        // déjà présent, ignorer
      }
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const toggleVisite = async (itemId: string, currentValue: boolean) => {
    setUpdating(prev => new Set(prev).add(itemId))
    try {
      const res = await fetch(`/api/objectifs/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visite: !currentValue }),
      })
      if (res.ok) {
        const updated = await res.json()
        setObjectif(prev => prev ? {
          ...prev,
          items: prev.items.map(i => i.id === itemId ? updated : i),
        } : null)
      }
    } finally {
      setUpdating(prev => { const s = new Set(prev); s.delete(itemId); return s })
    }
  }

  const supprimerItem = async (itemId: string) => {
    try {
      await fetch(`/api/objectifs/items/${itemId}`, { method: 'DELETE' })
      setObjectif(prev => prev ? {
        ...prev,
        items: prev.items.filter(i => i.id !== itemId),
      } : null)
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  // Stats
  const items = objectif?.items || []
  const total = items.length
  const done = items.filter(i => i.visite).length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const reportes = items.filter(i => i.reporte && !i.visite).length

  // Clients/prospects disponibles à ajouter (pas déjà dans la liste)
  const idsInList = new Set(items.map(i => i.clientId))
  const clientsDisponibles = allClients.filter(c => {
    if (idsInList.has(c.id)) return false
    if (filterType === 'client' && c.statut !== 'client') return false
    if (filterType === 'prospect' && c.statut !== 'prospect') return false
    const s = search.toLowerCase()
    if (s && !c.nom?.toLowerCase().includes(s) &&
        !(c.entreprise || '').toLowerCase().includes(s) &&
        !(c.ville || '').toLowerCase().includes(s)) return false
    return true
  })

  // IDs non visités pour envoi vers tournées
  const idsNonVisites = items.filter(i => !i.visite).map(i => i.clientId)
  const idsTous = items.map(i => i.clientId)

  const semaineLabel = formatSemaine(weekStart)

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Target className="w-7 h-7 text-primary" />
            Objectifs hebdomadaires
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Planifiez vos visites de la semaine et suivez leur réalisation
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => loadObjectif()}>
          <RefreshCw className={`w-4 h-4 mr-1.5 ${loadingObj ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Navigation entre semaines */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setWeekOffset(o => o - 1)}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Semaine précédente
        </Button>
        <div className="text-center">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold capitalize">{semaineLabel}</span>
          </div>
          {isCurrentWeek && (
            <Badge className="mt-1 bg-green-100 text-green-700">Semaine courante</Badge>
          )}
          {isPast && (
            <Badge variant="secondary" className="mt-1">Semaine passée</Badge>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setWeekOffset(o => Math.min(0, o + 1))}
          disabled={weekOffset >= 0}
        >
          Semaine suivante
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Stats */}
      {total > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="pt-6 text-center">
              <Target className="w-7 h-7 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{total}</div>
              <div className="text-sm text-muted-foreground">Visites planifiées</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <CheckCircle2 className="w-7 h-7 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold text-green-600">{done}</div>
              <div className="text-sm text-muted-foreground">Effectuées</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Circle className="w-7 h-7 mx-auto mb-2 text-orange-500" />
              <div className="text-2xl font-bold text-orange-500">{total - done}</div>
              <div className="text-sm text-muted-foreground">Restantes</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <TrendingUp className="w-7 h-7 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold">{pct}%</div>
              <div className="text-sm text-muted-foreground">Progression</div>
              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${done === total ? 'bg-green-500' : 'bg-blue-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Barre de progression globale */}
      {total > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${done === total ? 'bg-green-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-sm font-semibold whitespace-nowrap">{done}/{total}</span>
        </div>
      )}

      {/* Actions */}
      {total > 0 && (
        <div className="flex flex-wrap gap-3">
          {idsNonVisites.length > 0 && (
            <Link href={`/tournees?ids=${idsNonVisites.join(',')}`}>
              <Button>
                <Navigation className="w-4 h-4 mr-2" />
                Optimiser une tournée ({idsNonVisites.length} non visité{idsNonVisites.length > 1 ? 's' : ''})
              </Button>
            </Link>
          )}
          {idsTous.length > 0 && idsNonVisites.length === 0 && (
            <Link href={`/tournees?ids=${idsTous.join(',')}`}>
              <Button variant="outline">
                <Navigation className="w-4 h-4 mr-2" />
                Optimiser une tournée (tous)
              </Button>
            </Link>
          )}
          {isCurrentWeek && (
            <Button variant="outline" onClick={() => setShowAddModal(s => !s)}>
              <Plus className="w-4 h-4 mr-2" />
              {showAddModal ? 'Masquer' : 'Ajouter des entreprises'}
            </Button>
          )}
        </div>
      )}

      {/* Modal d'ajout */}
      {showAddModal && isCurrentWeek && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Ajouter des entreprises à visiter</CardTitle>
                <CardDescription>Sélectionnez les clients et prospects à inclure dans votre semaine</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, entreprise, ville..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterType} onValueChange={(v) => setFilterType(v as 'tous' | 'client' | 'prospect')}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous</SelectItem>
                  <SelectItem value="client">Clients</SelectItem>
                  <SelectItem value="prospect">Prospects</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="border rounded-lg max-h-80 overflow-y-auto divide-y">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : clientsDisponibles.length === 0 ? (
                <p className="text-center py-8 text-sm text-muted-foreground">Aucun résultat</p>
              ) : (
                clientsDisponibles.map(c => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        c.statut === 'client' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {c.statut === 'client' ? <Users className="w-4 h-4" /> : <Building className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{c.nom}</span>
                          <Badge variant="outline" className="text-xs py-0 h-5">
                            {c.statut === 'client' ? 'Client' : 'Prospect'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {c.entreprise ? `${c.entreprise} · ` : ''}{c.ville || 'Ville non renseignée'}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => ajouterClient(c.id)}
                      className="flex-shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Ajouter
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des entreprises de la semaine */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Liste de visites — {semaineLabel}
          </CardTitle>
          <CardDescription>
            {total > 0
              ? `${total} entreprise${total > 1 ? 's' : ''} · ${done} visitée${done > 1 ? 's' : ''} · ${reportes} reportée${reportes > 1 ? 's' : ''}`
              : 'Aucune entreprise planifiée pour cette semaine'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingObj ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <Target className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
              <p className="text-muted-foreground font-medium">Aucune visite planifiée</p>
              <p className="text-sm text-muted-foreground mt-1">
                {isCurrentWeek
                  ? 'Cliquez sur "Ajouter des entreprises" pour commencer'
                  : 'Aucune entreprise planifiée cette semaine-là'}
              </p>
              {isCurrentWeek && (
                <Button className="mt-4" onClick={() => setShowAddModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter des entreprises
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {items.map(item => {
                const isUpdating = updating.has(item.id)
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                      item.visite
                        ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                        : 'bg-card border-border hover:bg-muted/30'
                    }`}
                  >
                    {/* Checkbox visite */}
                    <button
                      onClick={() => toggleVisite(item.id, item.visite)}
                      disabled={isUpdating || isPast}
                      className="flex-shrink-0 focus:outline-none disabled:opacity-50"
                      title={item.visite ? 'Marquer comme non visité' : 'Marquer comme visité'}
                    >
                      {isUpdating ? (
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      ) : item.visite ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground hover:text-green-600 transition-colors" />
                      )}
                    </button>

                    {/* Infos client */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={item.client.statut === 'client' ? `/clients-db/${item.client.id}` : `/prospects-db/${item.client.id}`}
                          className={`text-sm font-medium hover:text-primary transition-colors ${item.visite ? 'line-through text-muted-foreground' : ''}`}
                        >
                          {item.client.entreprise || item.client.nom}
                        </Link>
                        <Badge variant="outline" className="text-xs py-0 h-5">
                          {item.client.statut === 'client' ? 'Client' : 'Prospect'}
                        </Badge>
                        {item.reporte && !item.visite && (
                          <Badge className="text-xs py-0 h-5 bg-orange-100 text-orange-700">
                            Reporté
                          </Badge>
                        )}
                      </div>
                      {item.client.ville && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          {item.client.ville}{item.client.codePostal ? ` (${item.client.codePostal})` : ''}
                        </p>
                      )}
                      {item.visite && item.visitedAt && (
                        <p className="text-xs text-green-600 mt-0.5">
                          ✓ Visité le {new Date(item.visitedAt).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>

                    {/* Supprimer */}
                    {isCurrentWeek && !item.visite && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 flex-shrink-0"
                        onClick={() => supprimerItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historique des objectifs + tournées */}
      <div className="space-y-4">
        <button
          onClick={() => setShowHistory(s => !s)}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <History className="w-4 h-4" />
          {showHistory ? 'Masquer' : 'Afficher'} l'historique
        </button>

        {showHistory && (
          <div className="space-y-6">
            {/* Historique des objectifs hebdomadaires */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Historique des objectifs
              </h3>
              {loadingHist ? (
                <Card>
                  <CardContent className="py-8 text-center text-sm text-muted-foreground">
                    Chargement…
                  </CardContent>
                </Card>
              ) : historique.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-sm text-muted-foreground">
                    Aucun objectif antérieur.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {historique.map(sem => {
                    const sDone = sem.items.filter((i: ObjectifItem) => i.visite).length
                    const sTotal = sem.items.length
                    const sPct = sTotal > 0 ? Math.round((sDone / sTotal) * 100) : 0
                    return (
                      <Card key={sem.id} className="overflow-hidden">
                        <CardHeader className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium text-sm capitalize">
                                {formatSemaine(new Date(sem.weekStart))}
                              </span>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-muted-foreground">{sTotal} planifiée{sTotal > 1 ? 's' : ''}</span>
                                <span className={`text-xs font-semibold ${sDone === sTotal ? 'text-green-600' : sDone > 0 ? 'text-orange-500' : 'text-muted-foreground'}`}>
                                  {sDone}/{sTotal} ({sPct}%)
                                </span>
                                <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${sDone === sTotal ? 'bg-green-500' : 'bg-orange-400'}`}
                                    style={{ width: `${sPct}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0 pb-3 px-4">
                          <div className="border-t pt-2 space-y-1">
                            {sem.items.map((item: ObjectifItem) => (
                              <div key={item.id} className="flex items-center gap-2 py-1.5 text-sm">
                                {item.visite
                                  ? <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                                  : <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                }
                                <span className={item.visite ? 'line-through text-muted-foreground' : ''}>
                                  {item.client.entreprise || item.client.nom}
                                </span>
                                <Badge variant="outline" className="text-xs py-0 h-4">
                                  {item.client.statut === 'client' ? 'C' : 'P'}
                                </Badge>
                                {item.reporte && !item.visite && (
                                  <Badge className="text-xs py-0 h-4 bg-orange-100 text-orange-700">Reporté</Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Historique des tournées (réutilise le composant existant) */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Navigation className="w-4 h-4" />
                Historique des tournées
              </h3>
              <TourneeHistory onVisiteMarked={() => loadObjectif()} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
