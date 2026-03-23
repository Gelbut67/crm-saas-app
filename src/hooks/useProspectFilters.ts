import { useState } from "react"

export interface FilterOptions {
  search: string
  sortBy: "nom" | "dateCreation" | "derniereInteraction" | "departement"
  sortOrder: "asc" | "desc"
  secteur: string
  entreprise: string
  departement: string
  caMin: string
  caMax: string
}

export function useProspectFilters(prospects: any[]) {
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

  const filteredAndSortedProspects = prospects
    .filter(prospect => {
      // Filtre de recherche
      const searchMatch = !filters.search || 
        prospect.nomEntreprise?.toLowerCase().includes(filters.search.toLowerCase()) ||
        prospect.entreprise?.toLowerCase().includes(filters.search.toLowerCase())

      // Filtre secteur
      const secteurMatch = !filters.secteur || prospect.secteur === filters.secteur

      // Filtre entreprise
      const entrepriseMatch = !filters.entreprise || 
        prospect.entreprise?.toLowerCase().includes(filters.entreprise.toLowerCase())

      // Filtre département
      const departementMatch = !filters.departement || prospect.departement === filters.departement

      return searchMatch && secteurMatch && entrepriseMatch && departementMatch
    })
    .sort((a, b) => {
      let comparison = 0

      switch (filters.sortBy) {
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
          comparison = (a.departement || "").localeCompare(b.departement || "")
          break
        default:
          comparison = (a.entreprise || a.nomEntreprise || "").localeCompare(b.entreprise || b.nomEntreprise || "")
      }

      return filters.sortOrder === "desc" ? -comparison : comparison
    })

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
    filteredAndSortedProspects,
    filteredCount: filteredAndSortedProspects.length,
    totalCount: prospects.length,
    resetFilters
  }
}
