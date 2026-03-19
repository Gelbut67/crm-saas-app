import { useState, useMemo } from 'react'

export interface FilterOptions {
  search: string
  sortBy: "nom" | "caTotal" | "dateCreation" | "derniereInteraction"
  sortOrder: "asc" | "desc"
  secteur: string
  entreprise: string
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
      let aValue: any
      let bValue: any

      switch (filters.sortBy) {
        case "nom":
          aValue = a.nom?.toLowerCase() || ""
          bValue = b.nom?.toLowerCase() || ""
          break
        case "caTotal":
          aValue = a.caTotal || 0
          bValue = b.caTotal || 0
          break
        case "dateCreation":
          aValue = new Date(a.dateCreation).getTime()
          bValue = new Date(b.dateCreation).getTime()
          break
        case "derniereInteraction":
          aValue = a.interactions?.[0]?.date ? new Date(a.interactions[0].date).getTime() : 0
          bValue = b.interactions?.[0]?.date ? new Date(b.interactions[0].date).getTime() : 0
          break
        default:
          aValue = a.nom?.toLowerCase() || ""
          bValue = b.nom?.toLowerCase() || ""
      }

      if (aValue < bValue) return filters.sortOrder === "asc" ? -1 : 1
      if (aValue > bValue) return filters.sortOrder === "asc" ? 1 : -1
      return 0
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
