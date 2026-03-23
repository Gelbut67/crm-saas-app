import { useState, useMemo } from 'react'

export interface FilterOptions {
  search: string
  sortBy: "nom" | "entreprise" | "caTotal" | "dateCreation" | "derniereInteraction"
  sortOrder: "asc" | "desc"
  secteur: string
  entreprise: string
  departement: string
  caMin: string
  caMax: string
}

export function useClientFiltersDB(clients: any[]) {
  const [filters, setFilters] = useState<FilterOptions>({
    search: "",
    sortBy: "nom",
    sortOrder: "asc",
    secteur: "",
    entreprise: "",
    departement: "",
    caMin: "",
    caMax: ""
  })

  const filteredClients = useMemo(() => {
    let result = [...clients]

    // Filtre de recherche
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(client => 
        client.nom?.toLowerCase().includes(searchLower) ||
        client.email?.toLowerCase().includes(searchLower) ||
        client.entreprise?.toLowerCase().includes(searchLower) ||
        client.secteur?.toLowerCase().includes(searchLower) ||
        client.contacts?.some((c: any) => 
          c.nom?.toLowerCase().includes(searchLower) ||
          c.email?.toLowerCase().includes(searchLower)
        )
      )
    }

    // Filtre par secteur
    if (filters.secteur) {
      result = result.filter(client => client.secteur === filters.secteur)
    }

    // Filtre par entreprise
    if (filters.entreprise) {
      const searchLower = filters.entreprise.toLowerCase()
      result = result.filter(client => 
        client.entreprise?.toLowerCase().includes(searchLower)
      )
    }

    // Filtre par CA min
    if (filters.caMin) {
      const min = parseFloat(filters.caMin)
      result = result.filter(client => (client.caTotal || 0) >= min)
    }

    // Filtre par CA max
    if (filters.caMax) {
      const max = parseFloat(filters.caMax)
      result = result.filter(client => (client.caTotal || 0) <= max)
    }

    // Tri
    result.sort((a, b) => {
      let comparison = 0

      switch (filters.sortBy) {
        case "entreprise":
          const aEntreprise = (a.entreprise || a.nom || "").toLowerCase()
          const bEntreprise = (b.entreprise || b.nom || "").toLowerCase()
          comparison = aEntreprise.localeCompare(bEntreprise, 'fr')
          break
        case "nom":
          const aNom = (a.nom || "").toLowerCase()
          const bNom = (b.nom || "").toLowerCase()
          comparison = aNom.localeCompare(bNom, 'fr')
          break
        case "caTotal":
          comparison = (a.caTotal || 0) - (b.caTotal || 0)
          break
        case "dateCreation":
          comparison = new Date(a.dateCreation).getTime() - new Date(b.dateCreation).getTime()
          break
        case "derniereInteraction":
          const aInteraction = a.interactions?.[0]?.date ? new Date(a.interactions[0].date).getTime() : 0
          const bInteraction = b.interactions?.[0]?.date ? new Date(b.interactions[0].date).getTime() : 0
          comparison = aInteraction - bInteraction
          break
        default:
          const aDefault = (a.nom || "").toLowerCase()
          const bDefault = (b.nom || "").toLowerCase()
          comparison = aDefault.localeCompare(bDefault, 'fr')
      }

      return filters.sortOrder === "asc" ? comparison : -comparison
    })

    return result
  }, [clients, filters])

  const resetFilters = () => {
    setFilters({
      search: "",
      sortBy: "nom",
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
    filteredClients,
    resetFilters
  }
}
