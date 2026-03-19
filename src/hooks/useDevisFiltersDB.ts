import { useState, useMemo } from 'react'

export interface DevisFilterOptions {
  search: string
  sortBy: "titre" | "montant" | "dateCreation" | "dateEcheance"
  sortOrder: "asc" | "desc"
  statut: string
  montantMin: string
  montantMax: string
}

export function useDevisFiltersDB(devis: any[]) {
  const [filters, setFilters] = useState<DevisFilterOptions>({
    search: "",
    sortBy: "dateCreation",
    sortOrder: "desc",
    statut: "",
    montantMin: "",
    montantMax: ""
  })

  const filteredDevis = useMemo(() => {
    let result = [...devis]

    // Filtre de recherche
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(devi => 
        devi.titre?.toLowerCase().includes(searchLower) ||
        devi.description?.toLowerCase().includes(searchLower) ||
        devi.client?.nom?.toLowerCase().includes(searchLower) ||
        devi.client?.entreprise?.toLowerCase().includes(searchLower)
      )
    }

    // Filtre par statut
    if (filters.statut) {
      result = result.filter(devi => devi.statut === filters.statut)
    }

    // Filtre par montant min
    if (filters.montantMin) {
      const min = parseFloat(filters.montantMin)
      result = result.filter(devi => (devi.montant || 0) >= min)
    }

    // Filtre par montant max
    if (filters.montantMax) {
      const max = parseFloat(filters.montantMax)
      result = result.filter(devi => (devi.montant || 0) <= max)
    }

    // Tri
    result.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (filters.sortBy) {
        case "titre":
          aValue = a.titre?.toLowerCase() || ""
          bValue = b.titre?.toLowerCase() || ""
          break
        case "montant":
          aValue = a.montant || 0
          bValue = b.montant || 0
          break
        case "dateCreation":
          aValue = new Date(a.dateCreation).getTime()
          bValue = new Date(b.dateCreation).getTime()
          break
        case "dateEcheance":
          aValue = new Date(a.dateEcheance).getTime()
          bValue = new Date(b.dateEcheance).getTime()
          break
        default:
          aValue = new Date(a.dateCreation).getTime()
          bValue = new Date(b.dateCreation).getTime()
      }

      if (aValue < bValue) return filters.sortOrder === "asc" ? -1 : 1
      if (aValue > bValue) return filters.sortOrder === "asc" ? 1 : -1
      return 0
    })

    return result
  }, [devis, filters])

  const resetFilters = () => {
    setFilters({
      search: "",
      sortBy: "dateCreation",
      sortOrder: "desc",
      statut: "",
      montantMin: "",
      montantMax: ""
    })
  }

  return {
    filters,
    setFilters,
    filteredDevis,
    resetFilters
  }
}
