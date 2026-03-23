import { useState, useMemo } from 'react'

export interface DevisFilterOptions {
  search: string
  sortBy: "titre" | "client" | "montant" | "dateCreation" | "dateEcheance"
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
      let comparison = 0

      switch (filters.sortBy) {
        case "client":
          const aClient = (a.client?.entreprise || a.client?.nom || "").toLowerCase()
          const bClient = (b.client?.entreprise || b.client?.nom || "").toLowerCase()
          comparison = aClient.localeCompare(bClient, 'fr')
          break
        case "titre":
          const aTitre = (a.titre || "").toLowerCase()
          const bTitre = (b.titre || "").toLowerCase()
          comparison = aTitre.localeCompare(bTitre, 'fr')
          break
        case "montant":
          comparison = (a.montant || 0) - (b.montant || 0)
          break
        case "dateCreation":
          comparison = new Date(a.dateCreation).getTime() - new Date(b.dateCreation).getTime()
          break
        case "dateEcheance":
          comparison = new Date(a.dateEcheance).getTime() - new Date(b.dateEcheance).getTime()
          break
        default:
          comparison = new Date(a.dateCreation).getTime() - new Date(b.dateCreation).getTime()
      }

      return filters.sortOrder === "asc" ? comparison : -comparison
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
