"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Search, ArrowUpDown, ArrowUp, ArrowDown, Phone, Calendar,
  FileText, Mail, MapPin, StickyNote, ChevronLeft, ChevronRight,
  Activity, Filter, Users, RefreshCw
} from "lucide-react"

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  appel:  { label: 'Appel',   color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',   icon: Phone },
  rdv:    { label: 'RDV',     color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300', icon: Calendar },
  email:  { label: 'Email',   color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',  icon: Mail },
  visite: { label: 'Visite',  color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300', icon: MapPin },
  note:   { label: 'Note',    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',   icon: StickyNote },
}

const TYPES = ['tous', 'appel', 'rdv', 'email', 'visite', 'note']

function TypeBadge({ type }: { type: string }) {
  const cfg = TYPE_CONFIG[type] || { label: type, color: 'bg-gray-100 text-gray-700', icon: FileText }
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  )
}

function SortIcon({ field, sortBy, sortOrder }: { field: string; sortBy: string; sortOrder: string }) {
  if (sortBy !== field) return <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />
  return sortOrder === 'asc'
    ? <ArrowUp className="w-3.5 h-3.5 text-primary" />
    : <ArrowDown className="w-3.5 h-3.5 text-primary" />
}

export default function InteractionsPage() {
  const [interactions, setInteractions] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('tous')
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [statsParType, setStatsParType] = useState<Record<string, number>>({})

  const fetchInteractions = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '50',
        sortBy,
        sortOrder,
        ...(typeFilter !== 'tous' && { type: typeFilter }),
        ...(search && { search }),
      })
      const res = await fetch(`/api/interactions?${params}`)
      if (res.ok) {
        const data = await res.json()
        setInteractions(data.interactions)
        setTotal(data.total)
        setTotalPages(data.totalPages)
      }
    } finally {
      setLoading(false)
    }
  }, [page, sortBy, sortOrder, typeFilter, search])

  // Statistiques globales (sans filtre de type)
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/interactions?limit=1000&sortBy=type&sortOrder=asc`)
      if (res.ok) {
        const data = await res.json()
        const stats: Record<string, number> = {}
        data.interactions.forEach((i: any) => {
          stats[i.type] = (stats[i.type] || 0) + 1
        })
        setStatsParType(stats)
      }
    } catch {}
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])
  useEffect(() => { fetchInteractions() }, [fetchInteractions])

  // Reset page on filter change
  useEffect(() => { setPage(1) }, [search, typeFilter, sortBy, sortOrder])

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(o => o === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  }
  const formatTime = (iso: string) => {
    const d = new Date(iso)
    // Si l'heure UTC est minuit, aucune heure n'a été saisie → ne pas afficher
    if (d.getUTCHours() === 0 && d.getUTCMinutes() === 0) return '—'
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  // Grouper par date
  const grouped: { date: string; items: any[] }[] = []
  let lastDate = ''
  interactions.forEach(i => {
    const d = formatDate(i.date)
    if (d !== lastDate) {
      grouped.push({ date: d, items: [i] })
      lastDate = d
    } else {
      grouped[grouped.length - 1].items.push(i)
    }
  })

  const totalInteractions = Object.values(statsParType).reduce((a, b) => a + b, 0)

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Journal des activités
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {total} interaction{total > 1 ? 's' : ''} au total
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchInteractions} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Stats par type */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {Object.entries(TYPE_CONFIG).map(([type, cfg]) => {
          const Icon = cfg.icon
          const count = statsParType[type] || 0
          return (
            <button
              key={type}
              onClick={() => setTypeFilter(typeFilter === type ? 'tous' : type)}
              className={`rounded-xl p-3 text-left transition-all border ${
                typeFilter === type
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-transparent bg-muted/50 hover:bg-muted'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{cfg.label}</span>
              </div>
              <p className="text-xl font-bold">{count}</p>
            </button>
          )
        })}
      </div>

      {/* Filtres et tri */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Recherche */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par client, entreprise ou contenu..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filtre type */}
            <div className="flex gap-1 flex-wrap">
              {TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    typeFilter === t
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {t === 'tous' ? 'Tous' : TYPE_CONFIG[t]?.label || t}
                </button>
              ))}
            </div>
          </div>

          {/* Boutons de tri */}
          <div className="flex gap-2 mt-3 pt-3 border-t flex-wrap">
            <span className="text-xs text-muted-foreground flex items-center gap-1 mr-1">
              <ArrowUpDown className="w-3 h-3" /> Trier par :
            </span>
            {[
              { field: 'date', label: 'Date' },
              { field: 'type', label: 'Type' },
              { field: 'client', label: 'Client' },
            ].map(({ field, label }) => (
              <button
                key={field}
                onClick={() => handleSort(field)}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  sortBy === field
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {label}
                <SortIcon field={field} sortBy={sortBy} sortOrder={sortOrder} />
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-16">
          <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : interactions.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Aucune interaction trouvée</p>
          <p className="text-sm mt-1">Modifiez vos filtres ou ajoutez des interactions</p>
        </div>
      ) : sortBy === 'date' ? (
        // Affichage groupé par date (uniquement quand trié par date)
        <div className="space-y-4">
          {grouped.map(group => (
            <div key={group.date}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {group.date}
                </span>
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">{group.items.length}</span>
              </div>
              <div className="space-y-2">
                {group.items.map(i => (
                  <InteractionRow key={i.id} interaction={i} formatTime={formatTime} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Affichage liste simple (autres tris)
        <div className="space-y-2">
          {interactions.map(i => (
            <InteractionRow key={i.id} interaction={i} formatTime={formatTime} formatDate={formatDate} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Page {page} / {totalPages} · {total} résultats
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline" size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
              Précédent
            </Button>
            <Button
              variant="outline" size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Suivant
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function InteractionRow({
  interaction: i,
  formatTime,
  formatDate,
}: {
  interaction: any
  formatTime: (s: string) => string
  formatDate?: (s: string) => string
}) {
  const [expanded, setExpanded] = useState(false)
  const clientHref = i.client?.statut === 'client' ? `/clients-db/${i.client.id}` : `/prospects-db/${i.client.id}`

  return (
    <div
      className="flex gap-3 p-3 rounded-xl border bg-card hover:bg-accent/30 transition-colors cursor-pointer"
      onClick={() => setExpanded(e => !e)}
    >
      {/* Heure */}
      <div className="flex-shrink-0 w-12 text-right">
        <span className="text-xs text-muted-foreground">{formatTime(i.date)}</span>
        {formatDate && (
          <p className="text-xs text-muted-foreground/70">{formatDate(i.date)}</p>
        )}
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <TypeBadge type={i.type} />
          {i.client && (
            <Link
              href={clientHref}
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1 text-sm font-medium hover:text-primary transition-colors"
            >
              <Users className="w-3 h-3" />
              {i.client.entreprise || i.client.nom}
              {i.client.entreprise && (
                <span className="text-muted-foreground font-normal">· {i.client.nom}</span>
              )}
            </Link>
          )}
          <Badge variant="outline" className="text-xs py-0 h-5">
            {i.client?.statut === 'client' ? 'Client' : 'Prospect'}
          </Badge>
        </div>
        <p className={`text-sm text-muted-foreground mt-1 ${expanded ? '' : 'line-clamp-2'}`}>
          {i.contenu}
        </p>
      </div>
    </div>
  )
}
