"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Filter, 
  X, 
  ArrowUpDown,
  TrendingUp,
  Calendar,
  Building
} from "lucide-react"

export interface FilterOptions {
  search: string
  sortBy: "nom" | "caTotal" | "dateCreation" | "derniereInteraction"
  sortOrder: "asc" | "desc"
  secteur: string
  entreprise: string
  caMin: string
  caMax: string
}

interface AdvancedFiltersProps {
  filters: FilterOptions
  onFiltersChange: (filters: FilterOptions) => void
  onReset: () => void
  totalCount: number
  filteredCount: number
}

export function AdvancedFilters({ 
  filters, 
  onFiltersChange, 
  onReset, 
  totalCount, 
  filteredCount 
}: AdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const updateFilter = (key: keyof FilterOptions, value: string) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const hasActiveFilters = 
    filters.search || 
    filters.secteur || 
    filters.entreprise || 
    filters.caMin || 
    filters.caMax ||
    filters.sortBy !== "nom" ||
    filters.sortOrder !== "asc"

  const secteurOptions = [
    "Technologie",
    "Services", 
    "Commerce",
    "Industrie",
    "Consulting",
    "Santé",
    "Éducation",
    "Finance",
    "Autre"
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtres avancés
            </CardTitle>
            <CardDescription>
              {filteredCount} client{filteredCount > 1 ? 's' : ''} trouvé{filteredCount > 1 ? 's' : ''} sur {totalCount}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={onReset}>
                <X className="mr-2 h-4 w-4" />
                Réinitialiser
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Moins" : "Plus"} de filtres
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Recherche principale */}
          <div className="relative">
            <Filter className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, email, entreprise..."
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtres de base toujours visibles */}
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Secteur</label>
              <Select value={filters.secteur} onValueChange={(value) => updateFilter("secteur", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les secteurs" />
                </SelectTrigger>
                <SelectContent>
                  {secteurOptions.map((secteur) => (
                    <SelectItem key={secteur} value={secteur}>
                      {secteur}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Trier par</label>
              <Select 
                value={`${filters.sortBy}-${filters.sortOrder}`} 
                onValueChange={(value) => {
                  const [sortBy, sortOrder] = value.split("-")
                  updateFilter("sortBy", sortBy as FilterOptions["sortBy"])
                  updateFilter("sortOrder", sortOrder as FilterOptions["sortOrder"])
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nom-asc">Nom (A-Z)</SelectItem>
                  <SelectItem value="nom-desc">Nom (Z-A)</SelectItem>
                  <SelectItem value="caTotal-desc">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Plus gros CA
                    </div>
                  </SelectItem>
                  <SelectItem value="caTotal-asc">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 rotate-180" />
                      Plus petit CA
                    </div>
                  </SelectItem>
                  <SelectItem value="dateCreation-desc">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Plus récent
                    </div>
                  </SelectItem>
                  <SelectItem value="dateCreation-asc">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 rotate-180" />
                      Plus ancien
                    </div>
                  </SelectItem>
                  <SelectItem value="derniereInteraction-desc">
                    Dernière interaction
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Entreprise</label>
              <Input
                placeholder="Filtrer par entreprise"
                value={filters.entreprise}
                onChange={(e) => updateFilter("entreprise", e.target.value)}
              />
            </div>
          </div>

          {/* Filtres étendus */}
          {isExpanded && (
            <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Chiffre d'affaires minimum (€)
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.caMin}
                  onChange={(e) => updateFilter("caMin", e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Chiffre d'affaires maximum (€)
                </label>
                <Input
                  type="number"
                  placeholder="Sans limite"
                  value={filters.caMax}
                  onChange={(e) => updateFilter("caMax", e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Badges des filtres actifs */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 pt-2">
              {filters.search && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Recherche: {filters.search}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => updateFilter("search", "")}
                  />
                </Badge>
              )}
              {filters.secteur && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Building className="h-3 w-3" />
                  Secteur: {filters.secteur}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => updateFilter("secteur", "")}
                  />
                </Badge>
              )}
              {filters.entreprise && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Entreprise: {filters.entreprise}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => updateFilter("entreprise", "")}
                  />
                </Badge>
              )}
              {filters.caMin && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  CA min: {parseInt(filters.caMin).toLocaleString()}€
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => updateFilter("caMin", "")}
                  />
                </Badge>
              )}
              {filters.caMax && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  CA max: {parseInt(filters.caMax).toLocaleString()}€
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => updateFilter("caMax", "")}
                  />
                </Badge>
              )}
              {(filters.sortBy !== "nom" || filters.sortOrder !== "asc") && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <ArrowUpDown className="h-3 w-3" />
                  Tri: {filters.sortBy === "caTotal" ? "CA" : 
                         filters.sortBy === "dateCreation" ? "Date" : 
                         filters.sortBy === "derniereInteraction" ? "Interaction" : "Nom"}
                  ({filters.sortOrder === "asc" ? "↑" : "↓"})
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => {
                      updateFilter("sortBy", "nom")
                      updateFilter("sortOrder", "asc")
                    }}
                  />
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Hook pour appliquer les filtres
export function useClientFilters(clients: any[]) {
  const [filters, setFilters] = useState<FilterOptions>({
    search: "",
    sortBy: "nom",
    sortOrder: "asc",
    secteur: "",
    entreprise: "",
    caMin: "",
    caMax: ""
  })

  const filteredAndSortedClients = clients
    .filter(client => {
      // Filtre de recherche
      const searchMatch = !filters.search || 
        client.nom.toLowerCase().includes(filters.search.toLowerCase()) ||
        client.email?.toLowerCase().includes(filters.search.toLowerCase()) ||
        client.entreprise?.toLowerCase().includes(filters.search.toLowerCase())

      // Filtre secteur
      const secteurMatch = !filters.secteur || client.secteur === filters.secteur

      // Filtre entreprise
      const entrepriseMatch = !filters.entreprise || 
        client.entreprise?.toLowerCase().includes(filters.entreprise.toLowerCase())

      // Filtre CA minimum
      const caMinMatch = !filters.caMin || client.caTotal >= parseInt(filters.caMin)

      // Filtre CA maximum
      const caMaxMatch = !filters.caMax || client.caTotal <= parseInt(filters.caMax)

      return searchMatch && secteurMatch && entrepriseMatch && caMinMatch && caMaxMatch
    })
    .sort((a, b) => {
      let comparison = 0

      switch (filters.sortBy) {
        case "caTotal":
          comparison = a.caTotal - b.caTotal
          break
        case "dateCreation":
          comparison = new Date(a.dateCreation).getTime() - new Date(b.dateCreation).getTime()
          break
        case "derniereInteraction":
          // Simuler une date de dernière interaction (dans une vraie app, ça viendrait de la BDD)
          const aLastInteraction = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
          const bLastInteraction = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
          comparison = aLastInteraction.getTime() - bLastInteraction.getTime()
          break
        default:
          comparison = a.nom.localeCompare(b.nom)
      }

      return filters.sortOrder === "desc" ? -comparison : comparison
    })

  return {
    filters,
    setFilters,
    filteredAndSortedClients,
    filteredCount: filteredAndSortedClients.length,
    totalCount: clients.length
  }
}
