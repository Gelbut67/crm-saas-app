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
  sortBy: "nom" | "entreprise" | "caTotal" | "dateCreation" | "derniereInteraction" | "departement"
  sortOrder: "asc" | "desc"
  secteur: string
  entreprise: string
  departement: string
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
    filters.departement ||
    filters.caMin || 
    filters.caMax ||
    filters.sortBy !== "entreprise" ||
    filters.sortOrder !== "asc"

  const secteurOptions = [
    "Agriculture",
    "Maraîchage",
    "Viticulture / Vigneron",
    "Brasserie / Brasseur",
    "Restauration",
    "Hôtellerie",
    "Traiteur",
    "Épicerie / Épicerie fine",
    "Cave à vins",
    "Boulangerie / Pâtisserie",
    "Charcuterie / Fromagerie",
    "CHR (Café, Hôtel, Restaurant)",
    "Grande distribution",
    "Grossiste alimentaire",
    "Producteur local",
    "Coopérative agricole",
    "Technologie",
    "Services",
    "Commerce",
    "Industrie",
    "Consulting",
    "Santé",
    "Éducation",
    "Finance",
    "Autre",
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
          <div className="grid gap-4 md:grid-cols-4">
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
              <label className="text-sm font-medium mb-2 block">Département</label>
              <Select value={filters.departement} onValueChange={(value) => updateFilter("departement", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les départements" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="01">01 - Ain</SelectItem>
                  <SelectItem value="02">02 - Aisne</SelectItem>
                  <SelectItem value="03">03 - Allier</SelectItem>
                  <SelectItem value="04">04 - Alpes-de-Hte-Provence</SelectItem>
                  <SelectItem value="05">05 - Hautes-Alpes</SelectItem>
                  <SelectItem value="06">06 - Alpes-Maritimes</SelectItem>
                  <SelectItem value="07">07 - Ardèche</SelectItem>
                  <SelectItem value="08">08 - Ardennes</SelectItem>
                  <SelectItem value="09">09 - Ariège</SelectItem>
                  <SelectItem value="10">10 - Aube</SelectItem>
                  <SelectItem value="11">11 - Aude</SelectItem>
                  <SelectItem value="12">12 - Aveyron</SelectItem>
                  <SelectItem value="13">13 - Bouches-du-Rhône</SelectItem>
                  <SelectItem value="14">14 - Calvados</SelectItem>
                  <SelectItem value="15">15 - Cantal</SelectItem>
                  <SelectItem value="16">16 - Charente</SelectItem>
                  <SelectItem value="17">17 - Charente-Maritime</SelectItem>
                  <SelectItem value="18">18 - Cher</SelectItem>
                  <SelectItem value="19">19 - Corrèze</SelectItem>
                  <SelectItem value="2A">2A - Corse-du-Sud</SelectItem>
                  <SelectItem value="2B">2B - Haute-Corse</SelectItem>
                  <SelectItem value="21">21 - Côte-d'Or</SelectItem>
                  <SelectItem value="22">22 - Côtes-d'Armor</SelectItem>
                  <SelectItem value="23">23 - Creuse</SelectItem>
                  <SelectItem value="24">24 - Dordogne</SelectItem>
                  <SelectItem value="25">25 - Doubs</SelectItem>
                  <SelectItem value="26">26 - Drôme</SelectItem>
                  <SelectItem value="27">27 - Eure</SelectItem>
                  <SelectItem value="28">28 - Eure-et-Loir</SelectItem>
                  <SelectItem value="29">29 - Finistère</SelectItem>
                  <SelectItem value="30">30 - Gard</SelectItem>
                  <SelectItem value="31">31 - Haute-Garonne</SelectItem>
                  <SelectItem value="32">32 - Gers</SelectItem>
                  <SelectItem value="33">33 - Gironde</SelectItem>
                  <SelectItem value="34">34 - Hérault</SelectItem>
                  <SelectItem value="35">35 - Ille-et-Vilaine</SelectItem>
                  <SelectItem value="36">36 - Indre</SelectItem>
                  <SelectItem value="37">37 - Indre-et-Loire</SelectItem>
                  <SelectItem value="38">38 - Isère</SelectItem>
                  <SelectItem value="39">39 - Jura</SelectItem>
                  <SelectItem value="40">40 - Landes</SelectItem>
                  <SelectItem value="41">41 - Loir-et-Cher</SelectItem>
                  <SelectItem value="42">42 - Loire</SelectItem>
                  <SelectItem value="43">43 - Haute-Loire</SelectItem>
                  <SelectItem value="44">44 - Loire-Atlantique</SelectItem>
                  <SelectItem value="45">45 - Loiret</SelectItem>
                  <SelectItem value="46">46 - Lot</SelectItem>
                  <SelectItem value="47">47 - Lot-et-Garonne</SelectItem>
                  <SelectItem value="48">48 - Lozère</SelectItem>
                  <SelectItem value="49">49 - Maine-et-Loire</SelectItem>
                  <SelectItem value="50">50 - Manche</SelectItem>
                  <SelectItem value="51">51 - Marne</SelectItem>
                  <SelectItem value="52">52 - Haute-Marne</SelectItem>
                  <SelectItem value="53">53 - Mayenne</SelectItem>
                  <SelectItem value="54">54 - Meurthe-et-Moselle</SelectItem>
                  <SelectItem value="55">55 - Meuse</SelectItem>
                  <SelectItem value="56">56 - Morbihan</SelectItem>
                  <SelectItem value="57">57 - Moselle</SelectItem>
                  <SelectItem value="58">58 - Nièvre</SelectItem>
                  <SelectItem value="59">59 - Nord</SelectItem>
                  <SelectItem value="60">60 - Oise</SelectItem>
                  <SelectItem value="61">61 - Orne</SelectItem>
                  <SelectItem value="62">62 - Pas-de-Calais</SelectItem>
                  <SelectItem value="63">63 - Puy-de-Dôme</SelectItem>
                  <SelectItem value="64">64 - Pyrénées-Atlantiques</SelectItem>
                  <SelectItem value="65">65 - Hautes-Pyrénées</SelectItem>
                  <SelectItem value="66">66 - Pyrénées-Orientales</SelectItem>
                  <SelectItem value="67">67 - Bas-Rhin</SelectItem>
                  <SelectItem value="68">68 - Haut-Rhin</SelectItem>
                  <SelectItem value="69">69 - Rhône</SelectItem>
                  <SelectItem value="70">70 - Haute-Saône</SelectItem>
                  <SelectItem value="71">71 - Saône-et-Loire</SelectItem>
                  <SelectItem value="72">72 - Sarthe</SelectItem>
                  <SelectItem value="73">73 - Savoie</SelectItem>
                  <SelectItem value="74">74 - Haute-Savoie</SelectItem>
                  <SelectItem value="75">75 - Paris</SelectItem>
                  <SelectItem value="76">76 - Seine-Maritime</SelectItem>
                  <SelectItem value="77">77 - Seine-et-Marne</SelectItem>
                  <SelectItem value="78">78 - Yvelines</SelectItem>
                  <SelectItem value="79">79 - Deux-Sèvres</SelectItem>
                  <SelectItem value="80">80 - Somme</SelectItem>
                  <SelectItem value="81">81 - Tarn</SelectItem>
                  <SelectItem value="82">82 - Tarn-et-Garonne</SelectItem>
                  <SelectItem value="83">83 - Var</SelectItem>
                  <SelectItem value="84">84 - Vaucluse</SelectItem>
                  <SelectItem value="85">85 - Vendée</SelectItem>
                  <SelectItem value="86">86 - Vienne</SelectItem>
                  <SelectItem value="87">87 - Haute-Vienne</SelectItem>
                  <SelectItem value="88">88 - Vosges</SelectItem>
                  <SelectItem value="89">89 - Yonne</SelectItem>
                  <SelectItem value="90">90 - Territoire de Belfort</SelectItem>
                  <SelectItem value="91">91 - Essonne</SelectItem>
                  <SelectItem value="92">92 - Hauts-de-Seine</SelectItem>
                  <SelectItem value="93">93 - Seine-Saint-Denis</SelectItem>
                  <SelectItem value="94">94 - Val-de-Marne</SelectItem>
                  <SelectItem value="95">95 - Val-d'Oise</SelectItem>
                  <SelectItem value="971">971 - Guadeloupe</SelectItem>
                  <SelectItem value="972">972 - Martinique</SelectItem>
                  <SelectItem value="973">973 - Guyane</SelectItem>
                  <SelectItem value="974">974 - La Réunion</SelectItem>
                  <SelectItem value="976">976 - Mayotte</SelectItem>
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
                  <SelectItem value="entreprise-asc">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Entreprise (A-Z)
                    </div>
                  </SelectItem>
                  <SelectItem value="entreprise-desc">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Entreprise (Z-A)
                    </div>
                  </SelectItem>
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
                  <SelectItem value="departement-asc">
                    Département (A-Z)
                  </SelectItem>
                  <SelectItem value="departement-desc">
                    Département (Z-A)
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
              {filters.departement && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Département: {filters.departement}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => updateFilter("departement", "")}
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
              {(filters.sortBy !== "entreprise" || filters.sortOrder !== "asc") && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <ArrowUpDown className="h-3 w-3" />
                  Tri: {filters.sortBy === "entreprise" ? "Entreprise" :
                         filters.sortBy === "caTotal" ? "CA" : 
                         filters.sortBy === "dateCreation" ? "Date" : 
                         filters.sortBy === "derniereInteraction" ? "Interaction" : 
                         filters.sortBy === "departement" ? "Département" : "Nom"}
                  ({filters.sortOrder === "asc" ? "↑" : "↓"})
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => {
                      updateFilter("sortBy", "entreprise")
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
    sortBy: "entreprise",
    sortOrder: "asc",
    secteur: "",
    entreprise: "",
    departement: "",
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

      // Filtre département
      const departementMatch = !filters.departement || client.departement === filters.departement

      // Filtre CA minimum
      const caMinMatch = !filters.caMin || client.caTotal >= parseInt(filters.caMin)

      // Filtre CA maximum
      const caMaxMatch = !filters.caMax || client.caTotal <= parseInt(filters.caMax)

      return searchMatch && secteurMatch && entrepriseMatch && departementMatch && caMinMatch && caMaxMatch
    })
    .sort((a, b) => {
      let comparison = 0

      switch (filters.sortBy) {
        case "entreprise":
          const aEntreprise = (a.entreprise || a.nom || "").toLowerCase()
          const bEntreprise = (b.entreprise || b.nom || "").toLowerCase()
          comparison = aEntreprise.localeCompare(bEntreprise, 'fr')
          break
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
        case "departement":
          const aDept = (a.departement || "").toLowerCase()
          const bDept = (b.departement || "").toLowerCase()
          comparison = aDept.localeCompare(bDept, 'fr')
          break
        default:
          const aNom = (a.nom || "").toLowerCase()
          const bNom = (b.nom || "").toLowerCase()
          comparison = aNom.localeCompare(bNom, 'fr')
      }

      return filters.sortOrder === "desc" ? -comparison : comparison
    })

  const resetFilters = () => {
    setFilters({
      search: "",
      sortBy: "entreprise",
      sortOrder: "asc",
      secteur: "",
      entreprise: "",
      departement: "",
      caMin: "",
      caMax: ""
    })
  }

  return {
    filters,
    setFilters,
    filteredAndSortedClients,
    filteredCount: filteredAndSortedClients.length,
    totalCount: clients.length,
    resetFilters
  }
}
